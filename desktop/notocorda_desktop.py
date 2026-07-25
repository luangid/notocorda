#!/usr/bin/env python3
"""Notocorda — aplicativo de desktop.

A interface é a MESMA do futuro app web: a pasta `viewer/` inteira, sem
nenhuma variante desktop. Aqui ela roda dentro de uma janela nativa (WebKit
do próprio sistema) servida por um HTTP local, e ganha uma ponte para o
Python: abrir o documento de origem, salvar view no lugar certo, revalidar o
grafo. Quando isto for para a web, este arquivo é substituído por um servidor
com login e leitura do git — a interface não muda.

O mapa NÃO precisa morar dentro deste repositório: a ferramenta é uma, os
mapas são muitos. Ao receber um grafo de fora, o servidor sobe no ancestral
comum entre o repositório e o mapa, e as duas árvores ficam visíveis.

Abre-se a PASTA da documentação, não o arquivo derivado: o graph.json é
compilado na hora quando falta ou quando algum Markdown está mais novo.

Uso:
    .venv/bin/python desktop/notocorda_desktop.py                  # exemplo da cafeteria
    .venv/bin/python desktop/notocorda_desktop.py ../outro-vault   # a pasta do mapa
    .venv/bin/python desktop/notocorda_desktop.py --listar         # que mapas existem
    .venv/bin/python desktop/notocorda_desktop.py --esquecer NOME  # tira um da estante
    .venv/bin/python desktop/notocorda_desktop.py --teste          # abre e fecha (checagem)
"""
from __future__ import annotations

import argparse
import datetime
import http.server
import json
import os
import socket
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent          # o repositório: viewer/, compiler/
GRAFO_PADRAO = "examples/cafeteria"

# Preenchidas em `abrir_mapa()` — dependem de qual grafo foi pedido:
BASE = RAIZ        # pasta servida por HTTP (ancestral comum de RAIZ e do mapa)
VAULT = RAIZ       # raiz do mapa aberto; é a ela que `source.path` se refere

# A ESTANTE: os mapas que esta pessoa já abriu. Mora fora do repositório de
# propósito — a ferramenta é pública, os mapas são de quem os escreve, e a
# lista de onde eles moram no disco é dado privado que nunca deve virar commit.
ESTANTE = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") \
    / "notocorda" / "estante.json"
ESTANTE_MAX = 24


def raiz_do_vault(grafo: Path) -> Path:
    """A pasta a que os `source.path` do grafo se referem.

    O compilador grava caminhos relativos à raiz dos Markdown de autoria. Ela
    é a pasta do próprio grafo, exceto quando ele foi escrito em `generated/`,
    que é subpasta da raiz — a convenção do CONTRATO §2.
    """
    pai = grafo.parent
    return pai.parent if pai.name == "generated" else pai


def abrir_mapa(grafo: Path) -> None:
    """Fixa as raízes globais para o mapa que será aberto."""
    global BASE, VAULT
    VAULT = raiz_do_vault(grafo)
    comuns = Path(*os.path.commonprefix([RAIZ.parts, grafo.parts]))
    BASE = comuns if comuns.is_dir() else RAIZ


# --- estante: os mapas que já foram abertos -------------------------------
# Achar o mapa de novo não deveria ser trabalho. A varredura da pasta servida
# só enxerga o que está debaixo dela — e o mapa de verdade quase nunca mora
# dentro da ferramenta. A estante guarda o caminho absoluto de cada mapa
# aberto, para que ele reapareça na lista mesmo depois de fechar o app.


def ler_estante() -> list[dict]:
    """Os mapas guardados, do mais recente para o mais antigo.

    Nunca explode: um arquivo corrompido vira estante vazia — perder a lista
    de atalhos é irritante, não conseguir abrir o app é pior.
    """
    try:
        dados = json.loads(ESTANTE.read_text(encoding="utf-8"))
        itens = dados.get("mapas", []) if isinstance(dados, dict) else dados
        return [i for i in itens if isinstance(i, dict) and i.get("grafo")]
    except (OSError, json.JSONDecodeError, AttributeError):
        return []


def gravar_estante(itens: list[dict]) -> None:
    try:
        ESTANTE.parent.mkdir(parents=True, exist_ok=True)
        ESTANTE.write_text(
            json.dumps({"versao": 1, "mapas": itens[:ESTANTE_MAX]},
                       ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8")
    except OSError as exc:  # noqa: BLE001 - a estante é conveniência, não requisito
        print(f"aviso: não consegui gravar a estante ({exc})", file=sys.stderr)


def guardar_na_estante(grafo: Path) -> None:
    """Registra (ou atualiza) o mapa recém-aberto no topo da estante."""
    grafo = grafo.resolve()
    vault = raiz_do_vault(grafo)
    item = {
        "grafo": str(grafo),
        "vault": str(vault),
        "nome": vault.name,
        "aberto_em": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    item.update({k: v for k, v in resumo_do_grafo(grafo).items() if k != "erro"})
    resto = [i for i in ler_estante() if i.get("grafo") != item["grafo"]]
    gravar_estante([item] + resto)


def esquecer_da_estante(alvo: str) -> bool:
    """Tira um mapa da estante. Aceita o caminho do grafo, do vault ou o nome."""
    itens = ler_estante()
    sobrou = [i for i in itens
              if alvo not in (i.get("grafo"), i.get("vault"), i.get("nome"))]
    if len(sobrou) == len(itens):
        return False
    gravar_estante(sobrou)
    return True


sys.path.insert(0, str(RAIZ / "compiler"))

# --- abrir pela PASTA da documentação ------------------------------------
# Quem escreve pensa na pasta dos Markdown, não no arquivo derivado. Então o
# que se aponta é o vault; o graph.json é detalhe de implementação, e é
# recompilado sozinho quando algum Markdown está mais novo que ele.


def eh_vault(pasta: Path) -> bool:
    """Uma pasta é um mapa quando tem documentos de autoria ou grafo compilado."""
    if not pasta.is_dir():
        return False
    if (pasta / "generated" / "graph.json").exists() or (pasta / "graph.json").exists():
        return True
    return any((pasta / d).is_dir() for d in ("spine", "realizations", "problems"))


def grafo_do_vault(vault: Path) -> Path:
    """Onde mora (ou vai morar) o grafo compilado deste vault."""
    solto = vault / "graph.json"
    return solto if solto.exists() else vault / "generated" / "graph.json"


def _desatualizado(vault: Path, grafo: Path) -> bool:
    if not grafo.exists():
        return True
    corte = grafo.stat().st_mtime
    return any(md.stat().st_mtime > corte for md in vault.rglob("*.md"))


def compilar(vault: Path, destino: Path) -> Path:
    """Roda o compilador sobre os Markdown do vault e grava o graph.json.

    Não reescreve quando o resultado é igual ao que já está em disco: abrir o
    mapa não deve sujar o git só porque o carimbo de hora mudou.
    """
    import build_graph  # compiler/build_graph.py

    schemas = vault / "schemas"
    if not (schemas / "registries.yaml").exists():
        schemas = RAIZ / "schemas"
    graph = build_graph.construir(vault, schemas)
    if not graph["nodes"]:
        # aponta-se para a pasta errada com facilidade, e o compilador varre a
        # subárvore inteira: melhor recusar que gravar um grafo vazio lá dentro
        raise ValueError(f"nenhum documento de autoria em {vault}")
    texto = json.dumps(graph, ensure_ascii=False, indent=2) + "\n"

    if destino.exists():
        antigo = json.loads(destino.read_text(encoding="utf-8"))
        if {**antigo, "generated_at": None} == {**graph, "generated_at": None}:
            destino.touch()   # marca como conferido, para não recompilar de novo
            return destino

    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding="utf-8")
    return destino


def resolver_mapa(alvo: Path) -> Path:
    """Aceita a PASTA da documentação ou o graph.json, e devolve o graph.json.

    Dada uma pasta, compila os Markdown quando o grafo não existe ou está
    velho. Se o compilador falhar (falta de dependência, erro de documento),
    cai para o último grafo compilado, se houver — ver o mapa desatualizado é
    melhor que não ver mapa nenhum.
    """
    if alvo.is_file():
        return alvo
    if not eh_vault(alvo):
        raise ValueError(f"{alvo} não parece a pasta de um mapa "
                         "(sem spine/, sem realizations/, sem graph.json)")
    grafo = grafo_do_vault(alvo)
    if _desatualizado(alvo, grafo):
        try:
            return compilar(alvo, grafo)
        except Exception as exc:  # noqa: BLE001
            if not grafo.exists():
                raise
            print(f"aviso: não consegui recompilar ({exc}); abrindo o grafo anterior",
                  file=sys.stderr)
    return grafo


class ServidorSilencioso(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Serve a pasta do mapa sem poluir o terminal a cada requisição."""

    daemon_threads = True
    allow_reuse_address = True


class HandlerSilencioso(http.server.SimpleHTTPRequestHandler):
    """Serve a partir do BASE **do momento da requisição**.

    A pasta servida não é fixa: abrir um mapa de outro canto do disco muda o
    ancestral comum, e reabrir o servidor numa porta nova invalidaria a janela
    já aberta. Por isso o diretório é lido a cada requisição, não fixado na
    criação do servidor.
    """

    def __init__(self, *args, **kwargs):
        kwargs.pop("directory", None)
        super().__init__(*args, directory=str(BASE), **kwargs)

    def log_message(self, *args):  # noqa: D102 - silêncio proposital
        pass


def subir_servidor() -> tuple[ServidorSilencioso, int]:
    """Sobe o HTTP local numa porta livre e devolve (servidor, porta).

    Precisa ser HTTP e não file:// — o viewer busca o graph.json por fetch,
    que o navegador bloqueia em arquivos locais.
    """
    servidor = ServidorSilencioso(("127.0.0.1", 0), HandlerSilencioso)
    porta = servidor.socket.getsockname()[1]
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return servidor, porta


def porta_viva(porta: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", porta)) == 0


def resumo_do_grafo(caminho: Path) -> dict:
    """Quantos nós, relações e etapas — o suficiente para reconhecer o mapa."""
    try:
        with caminho.open(encoding="utf-8") as f:
            g = json.load(f)
        etapas = [n for n in g.get("nodes", []) if n.get("spine_kind") == "value-stage"]
        return {
            "nos": len(g.get("nodes", [])),
            "relacoes": len(g.get("edges", [])),
            "etapas": len(etapas),
            "gerado_em": g.get("generated_at"),
        }
    except (OSError, json.JSONDecodeError) as exc:
        return {"erro": str(exc)}


def _ordem_tempo(iso: str | None) -> float:
    """ISO → número comparável; sem data vai para o fim da fila."""
    try:
        return datetime.datetime.fromisoformat(iso).timestamp() if iso else 0.0
    except (ValueError, TypeError):
        return 0.0


def listar_grafos() -> list[dict]:
    """Os mapas oferecidos no "Abrir mapa": a estante primeiro, a varredura depois.

    São duas origens de natureza diferente, e ambas importam:

    * **estante** — mapas que esta pessoa já abriu, onde quer que morem no
      disco. Sobrevivem a fechar o app e a trocar a pasta servida.
    * **varredura** — todo `graph.json` sob a pasta servida agora. Acha mapas
      vizinhos que nunca foram abertos.

    Cada item traz `abs` (caminho absoluto, que o desktop reabre de qualquer
    lugar) e `caminho` (relativo à RAIZ, só quando o HTTP alcança o arquivo —
    é dele que o navegador precisa).
    """
    itens: dict[str, dict] = {}

    def rel_servido(caminho: Path) -> str | None:
        if not caminho.is_relative_to(BASE):
            return None
        return os.path.relpath(caminho, RAIZ).replace(os.sep, "/")

    for guardado in ler_estante():
        caminho = Path(guardado["grafo"])
        vault = Path(guardado.get("vault") or raiz_do_vault(caminho))
        # o mapa continua existindo se o grafo está lá OU se o vault ainda é um
        # vault — nesse caso o grafo é recompilado na hora de abrir
        existe = caminho.exists() or eh_vault(vault)
        item = {
            "abs": str(caminho), "caminho": rel_servido(caminho),
            "nome": guardado.get("nome") or vault.name, "vault": str(vault),
            "estante": True, "aberto_em": guardado.get("aberto_em"),
            "sumiu": not existe,
        }
        # o retrato guardado vale enquanto o arquivo não puder ser lido de novo
        for chave in ("nos", "relacoes", "etapas", "gerado_em"):
            if guardado.get(chave) is not None:
                item[chave] = guardado[chave]
        if caminho.exists():
            item.update(resumo_do_grafo(caminho))
        elif not existe:
            item["erro"] = "não está mais neste caminho"
        itens[str(caminho)] = item

    for caminho in sorted(BASE.glob("**/graph.json")):
        # `.obsidian/graph.json` é configuração do Obsidian, não é mapa
        if any(p in (".venv", ".obsidian", ".git", "node_modules") for p in caminho.parts):
            continue
        chave = str(caminho.resolve())
        if chave in itens:
            itens[chave]["caminho"] = rel_servido(caminho)   # agora o HTTP alcança
            continue
        vault = raiz_do_vault(caminho)
        # o nome é o da PASTA da documentação, não o da `generated/` que só
        # guarda o derivado — é assim que quem escreve chama o mapa
        item = {"abs": chave, "caminho": rel_servido(caminho), "nome": vault.name,
                "vault": str(vault), "estante": False, "sumiu": False}
        item.update(resumo_do_grafo(caminho))
        itens[chave] = item

    achados = list(itens.values())
    # estante no topo (mais recente primeiro), varredura depois em ordem de nome
    achados.sort(key=lambda i: (not i["estante"],
                                -_ordem_tempo(i.get("aberto_em")) if i["estante"] else 0,
                                i.get("nome") or ""))
    return achados


class PonteNotocorda:
    """Funções que o viewer chama via `window.pywebview.api`.

    A mesma lista de operações que a versão web exporá por HTTP — é o
    contrato entre a interface e o mapa em disco.
    """

    def __init__(self, porta: int):
        self.porta = porta
        self.janela = None  # preenchida em main(), para os diálogos nativos

    # -- utilidades internas -------------------------------------------------
    def _resolver(self, relativo: str) -> Path:
        """Resolve um `source.path` do grafo, recusando fuga da pasta servida.

        A âncora é o VAULT (a raiz dos Markdown do mapa aberto), não o
        repositório: a ferramenta e o conteúdo são duas árvores distintas.
        """
        alvo = (VAULT / relativo).resolve()
        if not alvo.is_relative_to(BASE):
            raise ValueError(f"caminho fora da pasta servida: {relativo}")
        return alvo

    # -- API exposta ao viewer ----------------------------------------------
    def info(self) -> dict:
        return {"modo": "desktop", "raiz": str(RAIZ), "vault": str(VAULT),
                "base": str(BASE), "porta": self.porta, "estante": str(ESTANTE)}

    def listar_grafos(self) -> list[dict]:
        return listar_grafos()

    def esquecer_mapa(self, alvo: str) -> dict:
        """Tira o mapa da estante. Não toca em nada no disco do mapa."""
        return {"ok": esquecer_da_estante(alvo)}

    def abrir_mapa(self, alvo: str) -> dict:
        """Reabre um mapa pelo caminho absoluto — inclusive fora da pasta servida.

        Quando o mapa mora fora do que o HTTP alcança, a pasta servida é
        reancorada no novo ancestral comum. A porta continua a mesma (o
        handler lê o BASE a cada requisição), então basta à interface navegar
        para a URL devolvida.
        """
        try:
            caminho = Path(alvo).expanduser()
            if not caminho.exists():
                return {"ok": False, "erro": f"não encontrei {alvo} — o mapa saiu do lugar?"}
            grafo = resolver_mapa(caminho)
            dados = json.loads(grafo.read_text(encoding="utf-8"))
            if not isinstance(dados.get("nodes"), list):
                return {"ok": False, "erro": f"{grafo.name} não parece um graph.json (sem `nodes`)"}
            abrir_mapa(grafo)   # a função do módulo, que reancora BASE/VAULT
            guardar_na_estante(grafo)
            return {"ok": True, "url": montar_url(self.porta, grafo),
                    "nome": raiz_do_vault(grafo).name, "caminho": str(grafo)}
        except Exception as exc:  # noqa: BLE001 - devolvido à interface
            return {"ok": False, "erro": str(exc)}

    def escolher_grafo(self) -> dict:
        """Diálogo nativo para abrir a PASTA de um mapa — isto é uma
        ferramenta, não o leitor de um mapa só.

        Escolhe-se a pasta da documentação, não o arquivo derivado: quem
        escreve pensa nos Markdown. O grafo é compilado na hora se estiver
        faltando ou velho.

        Abrir daqui é o mesmo que abrir da estante — inclusive guardar o mapa
        nela: um mapa escolhido uma vez não deve precisar ser reprocurado.
        """
        try:
            import webview

            janela = self.janela or (webview.windows[0] if webview.windows else None)
            if janela is None:
                return {"ok": False, "erro": "janela indisponível"}
            escolha = janela.create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=str(BASE),
            )
            if not escolha:
                return {"ok": False, "cancelado": True}
            return self.abrir_mapa(str(Path(escolha[0]).resolve()))
        except Exception as exc:  # noqa: BLE001 - devolvido à interface
            return {"ok": False, "erro": str(exc)}

    def validar(self, relativo: str) -> dict:
        """Roda o validador do contrato e devolve o resultado estruturado."""
        try:
            import validate  # compiler/validate.py

            grafo = json.loads(self._resolver(relativo).read_text(encoding="utf-8"))
            erros = validate.validar_schema(grafo)
            reg = validate.carregar_registries()
            erros_regra, avisos = validate.validar_regras(grafo, reg)
            return {
                "ok": not (erros or erros_regra),
                "erros": erros + erros_regra,
                "avisos": avisos,
                "eixo": validate.descrever_eixo(grafo),
            }
        except Exception as exc:  # noqa: BLE001 - devolvido à interface
            return {"ok": False, "erros": [str(exc)], "avisos": [], "eixo": []}

    def abrir_documento(self, relativo: str) -> dict:
        """Abre o arquivo de origem no editor padrão do sistema."""
        try:
            alvo = self._resolver(relativo)
            if not alvo.exists():
                # o documento de autoria pode ainda não existir (fixture, lacuna)
                return {"ok": False, "erro": f"não existe em disco: {relativo}"}
            subprocess.Popen(["xdg-open", str(alvo)])
            return {"ok": True, "caminho": str(alvo)}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "erro": str(exc)}

    def salvar_view(self, view: dict) -> dict:
        """Grava o arquivo de view em `views/` — posições vivem na view, nunca
        no documento de negócio (CONTRATO §3.7)."""
        try:
            pasta = VAULT / "views"   # a view pertence ao mapa, não à ferramenta
            pasta.mkdir(exist_ok=True)
            nome = str(view.get("id", "view.sem-nome")).replace("/", "-")
            destino = pasta / f"{nome}.json"
            destino.write_text(json.dumps(view, ensure_ascii=False, indent=2), encoding="utf-8")
            return {"ok": True, "caminho": os.path.relpath(destino, BASE).replace(os.sep, "/")}
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "erro": str(exc)}


def montar_url(porta: int, grafo: Path) -> str:
    """Endereço do viewer servido a partir de BASE.

    O `?graph=` é relativo à pasta do viewer — daí o `../` de sempre, com um
    `../` a mais para cada nível entre BASE e o repositório quando o mapa
    mora fora dele.
    """
    prefixo = os.path.relpath(RAIZ, BASE).replace(os.sep, "/")
    prefixo = "" if prefixo == "." else prefixo + "/"
    rel = os.path.relpath(grafo, RAIZ / "viewer").replace(os.sep, "/")
    org = raiz_do_vault(grafo).name
    return f"http://127.0.0.1:{porta}/{prefixo}viewer/?graph={rel}&org={org}"


def main() -> int:
    ap = argparse.ArgumentParser(description="Notocorda — mapa vivo (desktop)")
    ap.add_argument("mapa", nargs="?", default=GRAFO_PADRAO,
                    help=f"pasta da documentação a abrir (padrão: {GRAFO_PADRAO}); "
                         "aceita também um graph.json direto")
    ap.add_argument("--listar", action="store_true", help="lista os mapas disponíveis e sai")
    ap.add_argument("--esquecer", metavar="MAPA",
                    help="tira um mapa da estante (nome ou caminho) e sai")
    ap.add_argument("--teste", action="store_true", help="abre e fecha a janela — checagem do ambiente")
    args = ap.parse_args()

    if args.esquecer:
        achou = esquecer_da_estante(args.esquecer)
        print(f"{'esqueci' if achou else 'não estava na estante'}: {args.esquecer}")
        return 0 if achou else 1

    alvo = Path(args.mapa)
    alvo = (alvo if alvo.is_absolute() else Path.cwd() / alvo).resolve()
    if not alvo.exists():
        alvo = (RAIZ / args.mapa).resolve()   # também aceita caminho relativo ao repo
    if not alvo.exists():
        print(f"não encontrei {args.mapa}", file=sys.stderr)
        return 1

    try:
        grafo = resolver_mapa(alvo)   # pasta → compila se preciso; arquivo → ele mesmo
    except Exception as exc:  # noqa: BLE001
        print(f"não consegui abrir {args.mapa}: {exc}", file=sys.stderr)
        return 1
    abrir_mapa(grafo)

    if args.listar:
        print(f"estante: {ESTANTE}")
        for g in listar_grafos():
            marca = "✗" if g.get("erro") else ("★" if g["estante"] else "·")
            onde = g.get("caminho") or g["abs"]
            if g.get("erro"):
                print(f"  {marca} {g['nome']}  ({onde}): {g['erro']}")
            else:
                print(f"  {marca} {g['nome']}  ({onde})  —  {g.get('nos', '?')} nós, "
                      f"{g.get('relacoes', '?')} relações, {g.get('etapas', '?')} etapas")
        return 0

    guardar_na_estante(grafo)   # abriu, entrou na estante

    try:
        import webview
    except ImportError:
        print("pywebview não instalado. Rode:  .venv/bin/pip install pywebview", file=sys.stderr)
        return 1

    servidor, porta = subir_servidor()
    url = montar_url(porta, grafo)
    print(f"Notocorda — servindo {BASE} em http://127.0.0.1:{porta}")
    print(f"abrindo {os.path.relpath(grafo, BASE)}")

    ponte = PonteNotocorda(porta)
    janela = webview.create_window(
        "Notocorda — mapa vivo",
        url,
        js_api=ponte,
        width=1600,
        height=1000,
        min_size=(1100, 700),
    )
    ponte.janela = janela  # o diálogo de "abrir mapa" precisa da janela

    if args.teste:
        def fechar_depois():
            import time

            time.sleep(6)
            print("modo teste: janela abriu, fechando.")
            janela.destroy()

        threading.Thread(target=fechar_depois, daemon=True).start()

    try:
        webview.start()
    finally:
        servidor.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())

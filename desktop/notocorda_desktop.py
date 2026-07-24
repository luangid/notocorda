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
    .venv/bin/python desktop/notocorda_desktop.py --teste          # abre e fecha (checagem)
"""
from __future__ import annotations

import argparse
import functools
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
    def log_message(self, *args):  # noqa: D102 - silêncio proposital
        pass


def subir_servidor() -> tuple[ServidorSilencioso, int]:
    """Sobe o HTTP local numa porta livre e devolve (servidor, porta).

    Precisa ser HTTP e não file:// — o viewer busca o graph.json por fetch,
    que o navegador bloqueia em arquivos locais.
    """
    handler = functools.partial(HandlerSilencioso, directory=str(BASE))
    servidor = ServidorSilencioso(("127.0.0.1", 0), handler)
    porta = servidor.socket.getsockname()[1]
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return servidor, porta


def porta_viva(porta: int) -> bool:
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", porta)) == 0


def listar_grafos() -> list[dict]:
    """Todo graph.json sob a pasta servida, com um resumo de cada um.

    O caminho devolvido é relativo à RAIZ do repositório (podendo começar por
    `../`, quando o mapa mora fora dele): é o que a interface concatena ao
    `../` do endereço do viewer.
    """
    achados = []
    for caminho in sorted(BASE.glob("**/graph.json")):
        # `.obsidian/graph.json` é configuração do Obsidian, não é mapa
        if any(p in (".venv", ".obsidian", ".git", "node_modules") for p in caminho.parts):
            continue
        rel = os.path.relpath(caminho, RAIZ).replace(os.sep, "/")
        # o nome é o da PASTA da documentação, não o da `generated/` que só
        # guarda o derivado — é assim que quem escreve chama o mapa
        item = {"caminho": rel, "nome": raiz_do_vault(caminho).name}
        try:
            with caminho.open(encoding="utf-8") as f:
                g = json.load(f)
            etapas = [n for n in g.get("nodes", []) if n.get("spine_kind") == "value-stage"]
            item.update(
                nos=len(g.get("nodes", [])),
                relacoes=len(g.get("edges", [])),
                etapas=len(etapas),
                gerado_em=g.get("generated_at"),
            )
        except (OSError, json.JSONDecodeError) as exc:
            item["erro"] = str(exc)
        achados.append(item)
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
                "base": str(BASE), "porta": self.porta}

    def listar_grafos(self) -> list[dict]:
        return listar_grafos()

    def escolher_grafo(self) -> dict:
        """Diálogo nativo para abrir a PASTA de um mapa — isto é uma
        ferramenta, não o leitor de um mapa só.

        Escolhe-se a pasta da documentação, não o arquivo derivado: quem
        escreve pensa nos Markdown. O grafo é compilado na hora se estiver
        faltando ou velho.

        Devolve o caminho relativo quando a pasta mora dentro da raiz servida
        (aí a interface só troca o `?graph=`), e o conteúdo já lido quando ela
        vem de fora — nesse caso o viewer o guarda na sessão do navegador.
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

            pasta = Path(escolha[0]).resolve()
            try:
                caminho = resolver_mapa(pasta)
            except ValueError as exc:
                return {"ok": False, "erro": str(exc)}
            dados = json.loads(caminho.read_text(encoding="utf-8"))
            if not isinstance(dados.get("nodes"), list):
                return {"ok": False, "erro": f"{caminho.name} não parece um graph.json (sem `nodes`)"}
            if caminho.is_relative_to(BASE):
                relativo = os.path.relpath(caminho, RAIZ).replace(os.sep, "/")
            else:
                relativo = None  # fora do que o HTTP serve: viaja pela sessão
            return {
                "ok": True,
                "caminho": str(caminho),
                "relativo": relativo,
                "nome": raiz_do_vault(caminho).name,
                "conteudo": None if relativo else dados,
            }
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
    ap.add_argument("--teste", action="store_true", help="abre e fecha a janela — checagem do ambiente")
    args = ap.parse_args()

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
        for g in listar_grafos():
            if "erro" in g:
                print(f"  ✗ {g['caminho']}: {g['erro']}")
            else:
                print(f"  · {g['nome']}  ({g['caminho']})  —  {g['nos']} nós, "
                      f"{g['relacoes']} relações, {g['etapas']} etapas")
        return 0

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

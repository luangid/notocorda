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

Uso:
    .venv/bin/python desktop/notocorda_desktop.py                  # exemplo da cafeteria
    .venv/bin/python desktop/notocorda_desktop.py ../outro-vault/generated/graph.json
    .venv/bin/python desktop/notocorda_desktop.py --listar         # que grafos existem
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
GRAFO_PADRAO = "examples/cafeteria/graph.json"

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
        item = {"caminho": rel, "nome": caminho.parent.name}
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
        """Diálogo nativo para abrir QUALQUER graph.json — isto é uma
        ferramenta, não o leitor de um mapa só.

        Devolve o caminho relativo quando o arquivo mora dentro da raiz servida
        (aí a interface só troca o `?graph=`), e o conteúdo já lido quando ele
        vem de fora — nesse caso o viewer o guarda na sessão do navegador.
        """
        try:
            import webview

            janela = self.janela or (webview.windows[0] if webview.windows else None)
            if janela is None:
                return {"ok": False, "erro": "janela indisponível"}
            escolha = janela.create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                directory=str(BASE),
                file_types=("Grafo (*.json)", "Todos os arquivos (*.*)"),
            )
            if not escolha:
                return {"ok": False, "cancelado": True}

            caminho = Path(escolha[0]).resolve()
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
                "nome": caminho.parent.name,
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
    ap.add_argument("grafo", nargs="?", default=GRAFO_PADRAO,
                    help=f"graph.json a abrir (padrão: {GRAFO_PADRAO})")
    ap.add_argument("--listar", action="store_true", help="lista os grafos disponíveis e sai")
    ap.add_argument("--teste", action="store_true", help="abre e fecha a janela — checagem do ambiente")
    args = ap.parse_args()

    grafo = Path(args.grafo)
    grafo = (grafo if grafo.is_absolute() else Path.cwd() / grafo).resolve()
    if not grafo.exists():
        grafo = (RAIZ / args.grafo).resolve()   # também aceita caminho relativo ao repo
    abrir_mapa(grafo)

    if args.listar:
        for g in listar_grafos():
            if "erro" in g:
                print(f"  ✗ {g['caminho']}: {g['erro']}")
            else:
                print(f"  · {g['caminho']}  —  {g['nos']} nós, {g['relacoes']} relações, {g['etapas']} etapas")
        return 0

    if not grafo.exists():
        print(f"não encontrei {args.grafo}", file=sys.stderr)
        return 1

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

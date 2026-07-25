#!/usr/bin/env python3
"""Fotografa o canvas — teste visual do viewer.

Por que não usar navegador headless: com grafos maiores o headless congela o
laço de animação antes do primeiro desenho e devolve um canvas em branco, o
que parece um bug do app sem ser. Aqui a captura sai da MESMA janela nativa
que o usuário abre, depois da física assentar.

Uso:
    .venv/bin/python desktop/captura.py examples/cafeteria/graph.json /tmp/cafe.png
    .venv/bin/python desktop/captura.py examples/cafeteria/graph.json /tmp/cafe.png --nivel -1
"""
from __future__ import annotations

import argparse
import base64
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import notocorda_desktop as ad  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description="captura o canvas do mapa")
    ap.add_argument("grafo", help="pasta do mapa (ou um graph.json)")
    ap.add_argument("saida", help="arquivo PNG de saída")
    ap.add_argument("--nivel", type=int, default=None, help="nível do seletor a exibir")
    ap.add_argument("--espera", type=float, default=7.0, help="segundos até a física assentar")
    ap.add_argument("--largura", type=int, default=1500, help="largura da janela")
    ap.add_argument("--altura", type=int, default=950, help="altura da janela")
    args = ap.parse_args()

    try:
        import webview
    except ImportError:
        print("pywebview não instalado.", file=sys.stderr)
        return 1

    alvo = Path(args.grafo)
    alvo = (alvo if alvo.is_absolute() else Path.cwd() / alvo).resolve()
    if not alvo.exists():
        alvo = (ad.RAIZ / args.grafo).resolve()
    grafo = ad.resolver_mapa(alvo)   # aceita a pasta do mapa ou o graph.json
    ad.abrir_mapa(grafo)

    servidor, porta = ad.subir_servidor()
    url = ad.montar_url(porta, grafo)
    if args.nivel is not None:
        url += f"&level={args.nivel}"
    janela = webview.create_window("Notocorda — captura", url, js_api=ad.PonteNotocorda(porta),
                                   width=args.largura, height=args.altura)
    resultado = {"ok": False}

    def capturar():
        time.sleep(args.espera)
        try:
            # o ponteiro do mouse pode estar sobre uma célula quando a janela
            # abre, e o foco apaga todo o resto — a foto sairia meio vazia
            janela.evaluate_js("window.mapa.hoverId=null; window.mapa.clearSelection();")
            janela.evaluate_js("window.mapa.fitView()")
            time.sleep(1.5)
            # de novo, e agora sem deixar quadro nenhum entre limpar e fotografar:
            # a janela pode ter passado sob o ponteiro enquanto o fit acontecia
            dados = janela.evaluate_js(
                "window.mapa.hoverId=null; window.mapa.clearSelection(); window.mapa.draw();"
                "window.mapa.canvas.toDataURL('image/png')"
            )
            png = base64.b64decode(dados.split(",", 1)[1])
            Path(args.saida).write_bytes(png)
            estado = janela.evaluate_js(
                "JSON.stringify({nos: window.mapa.visibleNodes().length, z: +window.mapa.cam.z.toFixed(2)})"
            )
            print(f"{args.saida}: {len(png)} bytes · {estado}")
            resultado["ok"] = True
        except Exception as exc:  # noqa: BLE001
            print(f"falhou: {exc}", file=sys.stderr)
        janela.destroy()

    threading.Thread(target=capturar, daemon=True).start()
    try:
        webview.start()
    finally:
        servidor.shutdown()
    return 0 if resultado["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())

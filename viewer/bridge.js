/* Notocorda — ponte entre a interface e o mapa em disco.
 *
 * É o ÚNICO arquivo que sabe se o Mapa Vivo está rodando dentro do app de
 * desktop (Python respondendo por `window.pywebview.api`) ou no navegador.
 * Todo o resto da interface — index.html, app.js, graph-core.js — é idêntico
 * nos dois casos. Quando isto for para a web com login e leitura do git,
 * basta ensinar aqui o caminho HTTP; nenhuma tela muda.
 */
(function (root) {
  'use strict';

  const temPython = () => !!(root.pywebview && root.pywebview.api);

  // A API do pywebview é injetada depois do load; quem chamar cedo espera aqui.
  let prontaResolve;
  const prontidao = new Promise(res => { prontaResolve = res; });
  if (temPython()) prontaResolve('desktop');
  else {
    root.addEventListener('pywebviewready', () => prontaResolve('desktop'));
    // no navegador comum o evento nunca chega — não vale bloquear a interface
    setTimeout(() => prontaResolve(temPython() ? 'desktop' : 'web'), 1200);
  }

  function baixarArquivo(nome, texto) {
    const blob = new Blob([texto], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const NotocordaBridge = {
    get modo() { return temPython() ? 'desktop' : 'web'; },
    pronta() { return prontidao; },

    /** Grava a view. No desktop vai para `views/`; no navegador, baixa. */
    async salvarView(view) {
      if (temPython()) return root.pywebview.api.salvar_view(view);
      const nome = String(view.id || 'view').replace(/^view\./, '') + '.view.json';
      baixarArquivo(nome, JSON.stringify(view, null, 2));
      return { ok: true, caminho: nome, baixado: true };
    },

    /** Abre o documento de autoria no editor do sistema (só no desktop). */
    async abrirDocumento(caminho) {
      if (!caminho) return { ok: false, erro: 'nó sem arquivo-fonte' };
      if (temPython()) return root.pywebview.api.abrir_documento(caminho);
      return { ok: false, erro: 'abrir o arquivo só no app de desktop' };
    },

    /** Revalida o grafo contra o contrato (só no desktop). */
    async validar(caminho) {
      if (temPython()) return root.pywebview.api.validar(caminho);
      return { ok: null, erros: [], avisos: [], eixo: [] };
    },

    /** Grafos que este repositório conhece. No desktop o Python varre a pasta;
     *  no navegador não há listagem de diretório, então sondamos os caminhos
     *  de convenção e ficamos com os que respondem. */
    async grafosDisponiveis() {
      if (temPython()) return root.pywebview.api.listar_grafos();
      const candidatos = [
        'examples/cafeteria/graph.json',
        'generated/graph.json',
      ];
      const achados = await Promise.all(candidatos.map(async rel => {
        try {
          const res = await fetch('../' + rel, { cache: 'no-store' });
          if (!res.ok) return null;
          const g = await res.json();
          const etapas = (g.nodes || []).filter(n => n.spine_kind === 'value-stage');
          return {
            caminho: rel, nome: rel.split('/').slice(-2)[0],
            nos: (g.nodes || []).length, relacoes: (g.edges || []).length,
            etapas: etapas.length, gerado_em: g.generated_at,
          };
        } catch (e) { return null; }
      }));
      return achados.filter(Boolean);
    },

    /** Escolhe um graph.json em disco: diálogo nativo no desktop, seletor do
     *  navegador na web. A resposta tem a mesma forma nos dois casos —
     *  `relativo` quando o arquivo é servido pela raiz do repositório (basta trocar
     *  o `?graph=`), `conteudo` quando veio de fora. */
    async escolherGrafo() {
      if (temPython()) return root.pywebview.api.escolher_grafo();
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json,application/json';
        input.addEventListener('change', () => {
          const f = input.files && input.files[0];
          if (!f) { resolve({ ok: false, cancelado: true }); return; }
          const leitor = new FileReader();
          leitor.onload = () => {
            try {
              const dados = JSON.parse(leitor.result);
              if (!Array.isArray(dados.nodes)) {
                resolve({ ok: false, erro: f.name + ' não parece um graph.json (sem `nodes`)' });
                return;
              }
              resolve({ ok: true, caminho: f.name, relativo: null, nome: f.name.replace(/\.json$/, ''), conteudo: dados });
            } catch (err) { resolve({ ok: false, erro: 'JSON inválido: ' + err.message }); }
          };
          leitor.onerror = () => resolve({ ok: false, erro: 'não consegui ler o arquivo' });
          leitor.readAsText(f);
        });
        input.click();
      });
    },
  };

  root.NotocordaBridge = NotocordaBridge;
}(window));

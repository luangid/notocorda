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

  // A ESTANTE no navegador. No desktop quem guarda é o Python (em
  // ~/.config/notocorda/estante.json, com caminho absoluto e tudo). Aqui só
  // existe o que o HTTP serve, então guardamos o caminho relativo — o
  // bastante para o mapa reaparecer na lista na próxima visita.
  const CHAVE_ESTANTE = 'notocorda.estante';
  const ESTANTE_MAX = 24;

  function estanteWeb() {
    try {
      const itens = JSON.parse(localStorage.getItem(CHAVE_ESTANTE) || '[]');
      return Array.isArray(itens) ? itens.filter(i => i && i.caminho) : [];
    } catch (e) { return []; }
  }
  function gravarEstanteWeb(itens) {
    try { localStorage.setItem(CHAVE_ESTANTE, JSON.stringify(itens.slice(0, ESTANTE_MAX))); }
    catch (e) { /* localStorage cheio ou bloqueado: a estante é conveniência */ }
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

    /** Os mapas oferecidos no "Abrir mapa": a estante (os já abertos) mais o
     *  que se acha por perto. No desktop o Python funde as duas listas e sabe
     *  de mapas fora da pasta servida; no navegador não há listagem de
     *  diretório, então sondamos a estante e os caminhos de convenção, e
     *  ficamos com os que respondem. */
    async grafosDisponiveis() {
      if (temPython()) return root.pywebview.api.listar_grafos();
      const guardados = estanteWeb();
      const convencao = ['examples/cafeteria/graph.json', 'generated/graph.json'];
      const vistos = new Set();
      const pedidos = [];
      guardados.forEach(g => { vistos.add(g.caminho); pedidos.push({ rel: g.caminho, guardado: g }); });
      convencao.forEach(rel => { if (!vistos.has(rel)) pedidos.push({ rel, guardado: null }); });

      const achados = await Promise.all(pedidos.map(async ({ rel, guardado }) => {
        const base = {
          caminho: rel, abs: null, estante: !!guardado, sumiu: false,
          nome: (guardado && guardado.nome) || rel.split('/').slice(-2)[0],
          aberto_em: guardado ? guardado.aberto_em : undefined,
        };
        try {
          const res = await fetch('../' + rel, { cache: 'no-store' });
          if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
          const g = await res.json();
          const etapas = (g.nodes || []).filter(n => n.spine_kind === 'value-stage');
          return Object.assign(base, {
            nos: (g.nodes || []).length, relacoes: (g.edges || []).length,
            etapas: etapas.length, gerado_em: g.generated_at,
          });
        } catch (e) {
          // guardado que não responde continua na lista, marcado — some da
          // lista só quando a pessoa mandar esquecer
          if (!guardado) return null;
          return Object.assign(base, guardado, { sumiu: true, erro: 'não responde neste caminho' });
        }
      }));
      return achados.filter(Boolean);
    },

    /** Reabre um mapa já conhecido. No desktop vale o caminho absoluto — o
     *  Python reancora a pasta servida e devolve o endereço a navegar. No
     *  navegador só existe o relativo, e quem navega é a própria interface. */
    async abrirMapa(item) {
      if (temPython() && item && item.abs) return root.pywebview.api.abrir_mapa(item.abs);
      if (item && item.caminho) return { ok: true, url: null, caminho: item.caminho, nome: item.nome };
      return { ok: false, erro: 'este mapa só abre no app de desktop' };
    },

    /** Guarda o mapa aberto na estante. No desktop o Python já guardou ao
     *  abrir; aqui é o navegador que precisa anotar. */
    guardarMapa(item) {
      if (temPython() || !item || !item.caminho) return;
      // grafo que veio por arquivo não tem endereço próprio: guardá-lo seria
      // guardar um atalho quebrado
      if (item.caminho.indexOf('session:') === 0) return;
      const resto = estanteWeb().filter(i => i.caminho !== item.caminho);
      gravarEstanteWeb([Object.assign({}, item, { aberto_em: new Date().toISOString() })].concat(resto));
    },

    /** Tira o mapa da estante — não apaga nada em disco. */
    async esquecerMapa(item) {
      if (temPython()) return root.pywebview.api.esquecer_mapa((item && item.abs) || '');
      gravarEstanteWeb(estanteWeb().filter(i => i.caminho !== (item && item.caminho)));
      return { ok: true };
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

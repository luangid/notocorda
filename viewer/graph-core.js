/* Notocorda — núcleo puro do visualizador (sem DOM).
 * Carregável no navegador (window.NotocordaCore) e em Node (module.exports).
 * Contrato v0.2: Guia de Implementação do Grafo em Camadas (§4–§8, §13, §15)
 * + schemas/graph.schema.json. O adaptador traduz o graph.json para o
 * modelo interno do engine (layer/tier/bandas) sem alterar a semântica.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotocordaCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Labels dos tipos internos (spine expandida em spine_kind + demais famílias)
  const TYPE_LABELS = {
    'objective': 'objetivo', 'value-stage': 'etapa de valor', 'capability': 'capacidade',
    'invariant': 'invariante', 'event': 'evento', 'obligation': 'obrigação',
    'realization': 'realização', 'system': 'sistema', 'data-asset': 'dado',
    'document': 'evidência', 'problem': 'problema',
  };
  const LAYER_LABELS = {
    essential: 'modelo essencial', operational: 'realização',
    implementation: 'implementação', evidence: 'evidência', problem: 'problema',
  };
  // Vocabulário de relações — Guia §6.4
  const REL_VERBS = {
    'advances': 'avança para', 'requires': 'requer', 'enables': 'habilita',
    'constrains': 'restringe', 'triggers': 'dispara', 'creates': 'cria',
    'realizes': 'realiza', 'supports': 'apoia', 'uses': 'usa',
    'records': 'registra', 'measures': 'mede', 'evidences': 'evidencia',
    'contradicts': 'contradiz', 'affects': 'afeta', 'mitigates': 'mitiga',
    'motivates': 'motiva', 'replaces': 'substitui', 'derived-from': 'derivado de',
    'related-to': 'relacionado a',
  };
  // Status — Guia §5.4
  const STATUS_COLORS = {
    draft: '#cdae5e', active: '#6fae8f', deprecated: '#c1614a', archived: '#8a94a3',
    current: '#6fae8f', proposed: '#5f93c4', pilot: '#cdae5e', rejected: '#c1614a', retired: '#8a94a3',
  };
  const CONFIDENCE_LABELS = { hypothesis: 'hipótese', certified: 'certificado', validated: 'validado' };

  // Tom de apoio do RÓTULO DE TIPO (o texto pequeno acima da célula). Não é
  // cor da caixa: o CONTRATO §3.1 reserva a cor da caixa para estado, e as
  // famílias continuam se distinguindo por forma, tamanho e preenchimento.
  const TYPE_TINT = {
    'value-stage': '#e6dcc4', 'objective': '#b9a9ec', 'capability': '#7fbfa2',
    'invariant': '#d9b463', 'event': '#7fa9d4', 'obligation': '#c9927a',
    'realization': '#7fa9d4', 'system': '#7fbfa2', 'data-asset': '#8fb0c9',
    'document': '#c2b184', 'problem': '#c1614a',
  };

  // família de contrato → camada interna do engine
  const FAMILY_LAYER = {
    spine: 'essential', realization: 'operational', system: 'implementation',
    data: 'implementation', evidence: 'evidence', problem: 'problem',
  };
  const FAMILY_INTERNAL_TYPE = {
    realization: 'realization', system: 'system', data: 'data-asset',
    evidence: 'document', problem: 'problem',
  };
  // Faixa vertical (Y "home") por tipo interno, fora da espinha
  const BAND_Y = { 'realization': 80, 'document': 80, 'problem': 200, 'system': 340, 'data-asset': 450 };

  // ---- adaptação graph.json v0.2 → modelo interno do viewer ----
  function adaptGraph(raw, opts) {
    const areaName = {}; (raw.areas || []).forEach(a => { areaName[a.id] = a.name; });
    const scenById = {}; (raw.scenarios || []).forEach(s => { scenById[s.id] = s; });

    const nodes = (raw.nodes || []).map(n => ({
      id: n.id,
      contractType: n.type,
      type: n.type === 'spine' ? n.spine_kind : (FAMILY_INTERNAL_TYPE[n.type] || n.type),
      spineKind: n.spine_kind || null,
      layer: FAMILY_LAYER[n.type] || 'evidence',
      name: n.name, def: n.definition || '',
      status: n.status, confidence: n.confidence || null,
      scenarios: (n.scenarios && n.scenarios.length) ? n.scenarios : 'all',
      areas: n.areas || [],
      areaNames: (n.areas || []).map(id => areaName[id] || id),
      tags: n.tags || [], aliases: n.aliases || [],
      sourcePath: (n.source && n.source.path) || null,
    }));
    const map = {}; nodes.forEach(n => { map[n.id] = n; });

    // nome legível de qualquer documento (caixa, cenário ou área)
    const docName = id => (map[id] && map[id].name) || (scenById[id] && scenById[id].name) || areaName[id] || id;

    // arestas do canvas: ambos os lados são caixas; cenário herda da ORIGEM (Guia §6.6)
    const edges = [];
    nodes.forEach(n => { n.relations = []; });
    (raw.edges || []).forEach(e => {
      const src = map[e.source]; if (!src) return;
      src.relations.push({ type: e.type, target: e.target, targetName: docName(e.target), isBox: !!map[e.target] });
      if (map[e.target]) edges.push({ source: e.source, target: e.target, type: e.type, scenarios: src.scenarios });
    });

    // níveis do seletor: vêm da view (Guia §8.3, §15); fallback heurístico por status
    const views = raw.views || [];
    const view = (opts && opts.viewId) ? views.find(v => v.id === opts.viewId) || views[0] : views[0];
    let levels;
    if (view && view.scenario_levels && view.scenario_levels.length) {
      levels = view.scenario_levels.slice().sort((a, b) => a.level - b.level).map(sl => {
        const s = sl.scenario ? scenById[sl.scenario] : null;
        return {
          n: sl.level, scenId: sl.scenario,
          name: sl.scenario ? (s ? s.name : sl.scenario) : 'Espinha dorsal',
          kind: sl.scenario ? ((s && s.status === 'current') ? 'as-is' : 'to-be') : 'espinha',
          spineOnly: !sl.scenario,
          baseline: (s && s.baseline) || null,
        };
      });
    } else {
      const cur = (raw.scenarios || []).filter(s => s.status === 'current');
      const rest = (raw.scenarios || []).filter(s => s.status !== 'current');
      levels = [
        ...cur.map((s, i) => ({ n: -1 - i, scenId: s.id, name: s.name, kind: 'as-is', spineOnly: false, baseline: s.baseline || null })).reverse(),
        { n: 0, scenId: null, name: 'Espinha dorsal', kind: 'espinha', spineOnly: true, baseline: null },
        ...rest.map((s, i) => ({ n: i + 1, scenId: s.id, name: s.name, kind: 'to-be', spineOnly: false, baseline: s.baseline || null })),
      ];
    }

    // ordem do eixo de valor: cadeia de `advances` entre etapas.
    // O ciclo é legítimo — o ciclo macro do contrato devolve a última etapa ao
    // planejamento (ZERO §4: `V8 -->|novo ciclo| V3`). Por isso o percurso marca
    // visitados: cada etapa ocupa UMA posição no eixo, e a aresta que volta para
    // uma etapa já posicionada é registrada em `spineReturns` para o viewer
    // desenhá-la como arco de retorno em vez de reta cruzando o eixo.
    const stages = nodes.filter(n => n.type === 'value-stage');
    const stageIds = new Set(stages.map(s => s.id));
    const nextOf = {}, hasPrev = new Set();
    edges.forEach(e => {
      if (e.type === 'advances' && stageIds.has(e.source) && stageIds.has(e.target)) {
        (nextOf[e.source] = nextOf[e.source] || []).push(e.target);
        hasPrev.add(e.target);
      }
    });
    const vsOrder = [], seenStage = new Set();
    const walkStage = id => {
      if (seenStage.has(id)) return;
      seenStage.add(id); vsOrder.push(id);
      (nextOf[id] || []).forEach(walkStage);
    };
    stages.filter(s => !hasPrev.has(s.id)).forEach(s => walkStage(s.id)); // entradas do ciclo
    stages.forEach(s => walkStage(s.id));                                 // ciclo puro / etapas soltas
    const spineReturns = [];
    Object.keys(nextOf).forEach(src => nextOf[src].forEach(dst => {
      if (vsOrder.indexOf(dst) <= vsOrder.indexOf(src)) spineReturns.push({ source: src, target: dst });
    }));
    const returnKeys = new Set(spineReturns.map(r => r.source + '>' + r.target));
    edges.forEach(e => { if (returnKeys.has(e.source + '>' + e.target)) e.isReturn = true; });

    return {
      nodes, edges, map, levels, vsOrder, spineReturns,
      areas: raw.areas || [], scenarios: raw.scenarios || [], views,
      docName,
      diagnostics: raw.diagnostics || { errors: [], warnings: [], gaps: [] },
      meta: { generatedAt: raw.generated_at || null, commit: (raw.source && raw.source.commit) || null },
    };
  }

  // Escala hierárquica de cada caixa. O tamanho carrega significado: a etapa
  // de valor é o esqueleto, o invariante precisa ter presença, e o que está
  // mais longe do eixo vai encolhendo. O app usa isso também para o tom do
  // preenchimento — maior é mais claro (não é cor por tipo, que o CONTRATO
  // §3.1 veda: é variação de preenchimento por hierarquia).
  const ESCALA_TIPO = {
    'value-stage': 1, 'objective': 0.92, 'invariant': 0.84,
    'capability': 0.78, 'event': 0.7, 'obligation': 0.7,
  };
  const FS_MUNDO = 23;      // altura da fonte em unidades de mundo (escala com o zoom)
  const LARG_CHAR = 0.58;   // largura média do caractere em Public Sans

  // Lado inicial de cada família em relação ao eixo: o que sustenta desce,
  // o que decorre sobe. A otimização depois pode mover, mas parte daqui.
  const LADO_TIPO = {
    'capability': 1, 'invariant': 1,
    'event': -1, 'obligation': -1, 'objective': -1,
  };

  // ruído determinístico por id — o mesmo grafo desenha igual toda vez
  function ruido01(texto) {
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10000) / 10000;
  }

  function medirCaixa(n) {
    const escala = n.escala || 1;
    const fs = FS_MUNDO * escala;
    // O nome cabe inteiro: a caixa ganha as linhas de que precisar (o corte em
    // duas linhas engolia metade do rótulo em "…"). O teto de 5 linhas existe
    // só para um nome patológico não virar um caixote na prancha.
    const linhas = wrapText(n.name, n.type === 'value-stage' ? 18 : 16, 5);
    const maior = linhas.reduce((m, l) => Math.max(m, l.length), 0);
    n.linhas = linhas;
    n.fsMundo = fs;
    n.wWorld = maior * fs * LARG_CHAR + fs * 1.5;
    // `hBase` é a caixa de duas linhas — a referência de alinhamento. O que
    // passa disso cresce PARA BAIXO (o desenho ancora no topo), para o eixo e
    // as faixas não subirem junto com o texto.
    n.hBase = 2 * fs * 1.18 + fs * 0.9;
    n.hWorld = Math.max(n.hBase, linhas.length * fs * 1.18 + fs * 0.9);
  }

  // ---- layout: o eixo de valor é a costela central ----
  // As etapas formam o tronco horizontal; tudo o mais se ramifica para os dois
  // lados. A ordem dentro de cada camada e o lado de cada caixa são escolhidos
  // para minimizar cruzamento de arestas (mediana → transposição → troca de
  // lado), tudo determinístico. O resultado já sai assentado: nada precisa
  // ficar se mexendo na tela para encontrar lugar.
  function computeLayout(g, opts) {
    const o = opts || {};
    const espaco = o.spacing || 1;        // multiplicador de espaçamento (controle do usuário)
    const desalinho = o.jitter == null ? 1 : o.jitter;
    const { nodes, edges, map, vsOrder } = g;

    const depCount = {};
    edges.forEach(e => {
      if (['requires', 'enables', 'realizes', 'advances', 'supports'].includes(e.type))
        depCount[e.target] = (depCount[e.target] || 0) + 1;
    });

    const essenciais = nodes.filter(n => n.layer === 'essential');
    const noEixo = n => n.type === 'value-stage';

    // 1. Nível = distância até o eixo, contada pelas relações (não pelo tipo).
    const vizinhos = {};
    essenciais.forEach(n => { vizinhos[n.id] = []; });
    edges.forEach(e => {
      const a = map[e.source], b = map[e.target];
      if (!a || !b || a.layer !== 'essential' || b.layer !== 'essential') return;
      if (!vizinhos[a.id].includes(b.id)) vizinhos[a.id].push(b.id);
      if (!vizinhos[b.id].includes(a.id)) vizinhos[b.id].push(a.id);
    });
    const nivel = {};
    const fila = [];
    essenciais.forEach(n => { if (noEixo(n)) { nivel[n.id] = 0; fila.push(n.id); } });
    while (fila.length) {
      const atual = fila.shift();
      vizinhos[atual].forEach(v => {
        if (nivel[v] == null) { nivel[v] = nivel[atual] + 1; fila.push(v); }
      });
    }
    essenciais.forEach(n => { if (nivel[n.id] == null) nivel[n.id] = 1; });

    // 2. Escala hierárquica e medida das caixas (em unidades de mundo).
    nodes.forEach(n => {
      n.dep = depCount[n.id] || 0;
      if (n.layer === 'essential') {
        const base = ESCALA_TIPO[n.type] != null ? ESCALA_TIPO[n.type] : 0.74;
        n.nivel = nivel[n.id];
        n.grau = (vizinhos[n.id] || []).length;
        // O tamanho soma três coisas: a família (etapa é o esqueleto), a
        // distância do eixo e QUANTAS relações a caixa concentra — um nó com
        // uma única ligação fica pequeno mesmo colado no eixo, e um que reúne
        // oito relações precisa de corpo para as pontas chegarem distinguíveis.
        const porGrau = 0.86 + 0.055 * Math.min(6, n.grau);
        n.escala = Math.max(0.62, Math.min(1.25,
          base * (1 - 0.05 * Math.max(0, n.nivel - 1)) * porGrau));
      } else {
        n.nivel = null;
        n.escala = 0.7;
      }
      medirCaixa(n);
      n.baseR = Math.max(n.wWorld, n.hWorld) / 2;
      n.vx = 0; n.vy = 0; n.alpha = 0; n.talpha = 0; n.yoff = 0; n.fixed = false;
    });

    // 3. Lado inicial por família; o eixo fica em lado 0.
    const lado = {};
    essenciais.forEach(n => {
      lado[n.id] = noEixo(n) ? 0 : (LADO_TIPO[n.type] != null ? LADO_TIPO[n.type] : 1);
    });

    // ---- posicionamento a partir de (ordem por camada, lado) ----
    const camadaDe = n => (noEixo(n) ? '0' : lado[n.id] + ':' + n.nivel);
    const GAP_H = 46 * espaco, GAP_V = 124 * espaco;

    function montarCamadas() {
      const camadas = {};
      essenciais.forEach(n => { (camadas[camadaDe(n)] = camadas[camadaDe(n)] || []).push(n); });
      return camadas;
    }
    // Uma camada larga demais estica o mapa na horizontal; como a tela é quase
    // quadrada, isso derruba o zoom de enquadramento e os rótulos somem. Então
    // a camada se dobra em faixas empilhadas, gastando a altura que sobra.
    let limiteFaixa = 1400;
    function dividirFaixas(arr) {
      const faixas = [[]];
      let soma = 0;
      arr.forEach(n => {
        const larg = n.wWorld + folgaGrau(n) + GAP_H;
        const atual = faixas[faixas.length - 1];
        if (atual.length && soma + larg > limiteFaixa) { faixas.push([n]); soma = larg; }
        else { atual.push(n); soma += larg; }
      });
      return faixas.filter(f => f.length);
    }
    // y de cada faixa: acumulado a partir do eixo, para que uma camada dobrada
    // nunca invada a vizinha.
    function alturasY(camadas) {
      const y = { '0': [0] };
      [-1, 1].forEach(ld => {
        let acumulado = 0;
        let anteriorAltura = camadas['0'] ? Math.max(...camadas['0'].map(n => n.hWorld)) : 40;
        let nv = 1;
        while (camadas[ld + ':' + nv]) {
          const faixas = dividirFaixas(camadas[ld + ':' + nv]);
          const ys = [];
          faixas.forEach((faixa, i) => {
            const altura = Math.max(...faixa.map(n => n.hWorld));
            acumulado += anteriorAltura / 2 + altura / 2 + (i ? GAP_V * 0.62 : GAP_V);
            ys.push(ld * acumulado);
            anteriorAltura = altura;
          });
          y[ld + ':' + nv] = ys;
          nv++;
        }
      });
      return y;
    }
    // Uma caixa com muitas arestas precisa de ar em volta: sem isso as pontas
    // chegam empilhadas e não se enxerga para onde cada relação vai.
    const folgaGrau = n => Math.min(120, Math.max(0, (n.grau || 0) - 2) * 22) * espaco;

    function posicionar(camadas) {
      // o eixo dita a largura de referência das costelas
      if (camadas['0']) {
        const largEixo = camadas['0'].reduce((s, n) => s + n.wWorld + folgaGrau(n) + GAP_H, 0);
        limiteFaixa = Math.max(1100, largEixo * 0.92);
      }
      const y = alturasY(camadas);
      Object.keys(camadas).forEach(chave => {
        const faixas = chave === '0' ? [camadas[chave]] : dividirFaixas(camadas[chave]);
        const ys = y[chave] || [0];
        faixas.forEach((faixa, iFaixa) => {
          // distribui lado a lado respeitando a largura de cada caixa e seu grau
          let largura = 0;
          faixa.forEach((n, i) => { largura += n.wWorld + folgaGrau(n) + (i ? GAP_H : 0); });
          let x = -largura / 2;
          faixa.forEach(n => {
            const folga = folgaGrau(n);
            x += n.wWorld / 2 + folga / 2;
            n.homeX = x;
            n.homeY = ys[Math.min(iFaixa, ys.length - 1)] || 0;
            x += n.wWorld / 2 + folga / 2 + GAP_H;
          });
        });
      });
      // cada camada desliza para ficar sob/sobre seus vizinhos do nível anterior
      Object.keys(camadas).forEach(chave => {
        if (chave === '0') return;
        const arr = camadas[chave];
        const alvos = arr.map(n => {
          const proximos = vizinhos[n.id].filter(v => map[v] && map[v].nivel < n.nivel);
          if (!proximos.length) return null;
          return proximos.reduce((s, v) => s + map[v].homeX, 0) / proximos.length;
        }).filter(v => v != null);
        if (!alvos.length) return;
        const centroAtual = arr.reduce((s, n) => s + n.homeX, 0) / arr.length;
        const centroAlvo = alvos.reduce((s, v) => s + v, 0) / alvos.length;
        const desloca = centroAlvo - centroAtual;
        arr.forEach(n => { n.homeX += desloca; });
      });
    }

    function cruzamentos() {
      const seg = [];
      edges.forEach(e => {
        const a = map[e.source], b = map[e.target];
        if (!a || !b || a.layer !== 'essential' || b.layer !== 'essential') return;
        seg.push([a.homeX, a.homeY, b.homeX, b.homeY, e.source, e.target]);
      });
      const orient = (ax, ay, bx, by, cx, cy) => Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
      let total = 0;
      for (let i = 0; i < seg.length; i++) {
        for (let j = i + 1; j < seg.length; j++) {
          const s = seg[i], t = seg[j];
          if (s[4] === t[4] || s[4] === t[5] || s[5] === t[4] || s[5] === t[5]) continue;
          const d1 = orient(s[0], s[1], s[2], s[3], t[0], t[1]);
          const d2 = orient(s[0], s[1], s[2], s[3], t[2], t[3]);
          const d3 = orient(t[0], t[1], t[2], t[3], s[0], s[1]);
          const d4 = orient(t[0], t[1], t[2], t[3], s[2], s[3]);
          if (d1 !== d2 && d3 !== d4) total++;
        }
      }
      return total;
    }

    // ordem do eixo é dada pelo ciclo — nunca reordenada
    const ordemEixo = {};
    vsOrder.forEach((id, i) => { ordemEixo[id] = i; });

    let camadas = montarCamadas();
    if (camadas['0']) camadas['0'].sort((a, b) => ordemEixo[a.id] - ordemEixo[b.id]);

    // 4. Ordenação por mediana dos vizinhos do nível anterior (Sugiyama).
    const medianaDe = n => {
      const xs = vizinhos[n.id].filter(v => map[v] && map[v].nivel < n.nivel)
        .map(v => map[v].homeX).sort((a, b) => a - b);
      if (!xs.length) return n.homeX || 0;
      const m = Math.floor(xs.length / 2);
      return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
    };
    posicionar(camadas);
    for (let volta = 0; volta < 8; volta++) {
      Object.keys(camadas).forEach(chave => {
        if (chave === '0') return;
        camadas[chave].forEach(n => { n._m = medianaDe(n); });
        camadas[chave].sort((a, b) => (a._m - b._m) || a.name.localeCompare(b.name));
      });
      posicionar(camadas);
    }

    // 5. Transposição: troca vizinhos adjacentes e troca o lado de uma caixa,
    //    aceitando o que reduzir o número de cruzamentos. Determinístico.
    let melhor = cruzamentos();
    for (let volta = 0; volta < 6; volta++) {
      let melhorou = false;
      // 5a. trocas adjacentes dentro da camada
      Object.keys(camadas).forEach(chave => {
        if (chave === '0') return;
        const arr = camadas[chave];
        for (let i = 0; i + 1 < arr.length; i++) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          posicionar(camadas);
          const agora = cruzamentos();
          if (agora < melhor) { melhor = agora; melhorou = true; }
          else { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; posicionar(camadas); }
        }
      });
      // 5b. troca de lado (o nó muda de costela)
      essenciais.forEach(n => {
        if (noEixo(n)) return;
        lado[n.id] = -lado[n.id];
        const tentativa = montarCamadas();
        if (tentativa['0']) tentativa['0'].sort((a, b) => ordemEixo[a.id] - ordemEixo[b.id]);
        Object.keys(tentativa).forEach(c => {
          if (c === '0') return;
          tentativa[c].sort((a, b) => (a._m || a.homeX || 0) - (b._m || b.homeX || 0) || a.name.localeCompare(b.name));
        });
        posicionar(tentativa);
        const agora = cruzamentos();
        if (agora < melhor) { melhor = agora; camadas = tentativa; melhorou = true; }
        else { lado[n.id] = -lado[n.id]; posicionar(camadas); }
      });
      if (!melhorou) break;
    }
    posicionar(camadas);
    g.cruzamentos = cruzamentos();

    // 6. Desalinho proposital: tira o ar de grade sem bagunçar a leitura nem
    //    criar cruzamento novo (a ordem das camadas não muda).
    essenciais.forEach(n => {
      if (!desalinho) return;
      const rx = ruido01(n.id) - 0.5, ry = ruido01(n.id + '~y') - 0.5;
      n.homeX += rx * GAP_H * 0.55 * desalinho;
      n.homeY += ry * (noEixo(n) ? 16 : 26) * desalinho;
    });

    // 7. As camadas de fora da espinha ganham lugar próprio (ver layoutCamadas).
    nodes.forEach(n => { if (n.layer === 'essential') { n.x = n.homeX; n.y = n.homeY; } });
    layoutCamadas(g, GAP_H, GAP_V);
    return g;
  }

  // ---- layout das camadas de fora da espinha -------------------------------
  // A espinha tem Sugiyama; o resto ficava jogado numa faixa por tipo, com x
  // pseudo-aleatório, e a física acomodava como dava — daí o amontoado e as
  // nuvens de área atravessando umas as outras.
  //
  // Aqui cada célula ganha lugar por três critérios, nesta ordem:
  //   ÁREA   → uma coluna por área, e colunas NÃO se sobrepõem (a nuvem sai
  //            legível de graça, sem repulsão na física);
  //   CAMADA → dentro da coluna, uma faixa por família, alinhada entre todas
  //            as colunas (dá para ler "as realizações" na horizontal);
  //   ÂNCORA → dentro da faixa, a ordem segue a posição, no eixo de valor,
  //            daquilo que a célula sustenta — quem realiza a primeira etapa
  //            fica à esquerda de quem realiza a última.
  const FAIXA_ORDEM = { realization: 0, problem: 1, system: 2, 'data-asset': 3, document: 4 };

  function layoutCamadas(g, GAP_H, GAP_V) {
    const fora = g.nodes.filter(n => n.layer !== 'essential');
    if (!fora.length) return;

    // vizinhança não direcionada, para achar a espinha que cada célula toca
    const viz = {};
    g.edges.forEach(e => {
      (viz[e.source] = viz[e.source] || []).push(e.target);
      (viz[e.target] = viz[e.target] || []).push(e.source);
    });
    const ancora = {};
    fora.forEach(n => {
      let soma = 0, achados = 0;
      const vistos = new Set([n.id]);
      let frente = [n.id];
      for (let d = 0; d < 3 && !achados; d++) {
        const proxima = [];
        frente.forEach(id => (viz[id] || []).forEach(o => {
          if (vistos.has(o)) return;
          vistos.add(o); proxima.push(o);
          const on = g.map[o];
          if (on && on.layer === 'essential' && on.homeX != null) { soma += on.homeX; achados++; }
        }));
        frente = proxima;
      }
      ancora[n.id] = achados ? soma / achados : 0;
    });

    // área principal = a mais específica (a de menos membros); célula sem área
    // cai numa coluna própria, no fim
    const tamanhoArea = {};
    fora.forEach(n => (n.areaNames || []).forEach(a => { tamanhoArea[a] = (tamanhoArea[a] || 0) + 1; }));
    const areaDe = n => {
      const as = n.areaNames || [];
      if (!as.length) return '—';
      return as.slice().sort((x, y) => (tamanhoArea[x] - tamanhoArea[y]) || x.localeCompare(y))[0];
    };

    const colunas = {};
    fora.forEach(n => {
      const a = areaDe(n);
      // `areaMain` é a área da COLUNA onde o nó é desenhado — a nuvem se agrupa
      // por ela, não por todas as áreas do nó. Um nó em duas áreas aparece uma
      // vez, na coluna da área mais específica; a outra área não estica a nuvem
      // até aqui (era o que fazia os cascos se cobrirem). As demais áreas do nó
      // seguem visíveis nos chips/inspetor.
      n.areaMain = a === '—' ? null : a;
      (colunas[a] = colunas[a] || []).push(n);
    });

    // Largura das colunas: o bloco inteiro deve caber na largura do EIXO. Se
    // as colunas crescem livres, o mapa fica mais largo que a espinha, o
    // "enquadrar" afasta a câmera e os rótulos somem. Cada área recebe uma
    // fatia proporcional ao que tem para acomodar.
    const GAP = GAP_H * 0.7, LINHA_GAP = GAP_V * 0.3;
    const xs = g.nodes.filter(n => n.layer === 'essential' && n.homeX != null);
    const largEixo = xs.length
      ? Math.max(...xs.map(n => n.homeX + n.wWorld / 2)) - Math.min(...xs.map(n => n.homeX - n.wWorld / 2))
      : 1600;
    const nomes = Object.keys(colunas);
    // Gap folgado entre colunas dá respiro entre as nuvens (agora cada nó está
    // só na sua coluna, então já não há invasão — isto é só estética).
    const GAP_COL = GAP_H * 3.2;
    const peso = {};
    nomes.forEach(a => { peso[a] = Math.sqrt(colunas[a].reduce((s, n) => s + n.wWorld + GAP, 0)); });
    const somaPeso = nomes.reduce((s, a) => s + peso[a], 0);
    const util = Math.max(largEixo, 900) - GAP_COL * (nomes.length - 1);
    const medida = {};
    nomes.forEach(a => {
      const maior = Math.max(...colunas[a].map(n => n.wWorld));
      // Teto na largura: área grande empilha em mais LINHAS (coluna alta e
      // estreita) em vez de espalhar na horizontal. Coluna estreita = casco
      // estreito = áreas não se cobrem (a nuvem de cada uma fica no seu lugar).
      const teto = maior * 2 + GAP * 2;
      medida[a] = { larg: Math.min(teto, Math.max(maior + GAP, util * peso[a] / somaPeso)) };
    });

    // empacota cada faixa de cada coluna em linhas, respeitando a largura
    const faixas = {};   // area -> faixa -> [[nós por linha]]
    Object.keys(colunas).forEach(a => {
      const porFaixa = {};
      colunas[a].forEach(n => {
        const f = FAIXA_ORDEM[n.type] != null ? FAIXA_ORDEM[n.type] : 4;
        (porFaixa[f] = porFaixa[f] || []).push(n);
      });
      faixas[a] = {};
      Object.keys(porFaixa).forEach(f => {
        const ns = porFaixa[f].sort((x, y) => (ancora[x.id] - ancora[y.id]) || x.name.localeCompare(y.name));
        const linhas = [[]];
        let usado = 0;
        ns.forEach(n => {
          const larg = n.wWorld + GAP;
          if (usado + larg > medida[a].larg && linhas[linhas.length - 1].length) { linhas.push([]); usado = 0; }
          linhas[linhas.length - 1].push(n); usado += larg;
        });
        faixas[a][f] = linhas;
      });
    });

    // altura de cada faixa: o máximo entre as colunas, para a leitura
    // horizontal por camada continuar valendo
    const alturaFaixa = {};
    Object.keys(faixas).forEach(a => Object.keys(faixas[a]).forEach(f => {
      const alt = faixas[a][f].reduce((s, linha) => s + Math.max(...linha.map(n => n.hWorld)) + LINHA_GAP, 0);
      alturaFaixa[f] = Math.max(alturaFaixa[f] || 0, alt);
    }));

    // colunas da esquerda para a direita, na ordem do que elas sustentam
    const ordemAreas = Object.keys(colunas).sort((a, b) => {
      if (a === '—') return 1; if (b === '—') return -1;
      const ma = colunas[a].reduce((s, n) => s + ancora[n.id], 0) / colunas[a].length;
      const mb = colunas[b].reduce((s, n) => s + ancora[n.id], 0) / colunas[b].length;
      return ma - mb || a.localeCompare(b);
    });
    let largTotal = ordemAreas.reduce((s, a) => s + medida[a].larg, 0) + GAP_COL * (ordemAreas.length - 1);
    let x = -largTotal / 2;
    const BASE_Y = 470;   // abaixo do último tier da espinha
    ordemAreas.forEach(a => {
      const centro = x + medida[a].larg / 2;
      medida[a].x = centro;
      let y = BASE_Y;
      Object.keys(alturaFaixa).map(Number).sort((p, q) => p - q).forEach(f => {
        const linhas = (faixas[a] || {})[f] || [];
        let yLinha = y;
        linhas.forEach(linha => {
          const alturaLinha = Math.max(...linha.map(n => n.hWorld));
          const largLinha = linha.reduce((s, n) => s + n.wWorld + GAP, 0) - GAP;
          let cx = centro - largLinha / 2;
          linha.forEach(n => {
            n.homeX = cx + n.wWorld / 2;
            n.homeY = yLinha + alturaLinha / 2;
            n.x = n.homeX; n.y = n.homeY;
            cx += n.wWorld + GAP;
          });
          yLinha += alturaLinha + LINHA_GAP;
        });
        y += alturaFaixa[f] + LINHA_GAP * 1.6;
      });
      x += medida[a].larg + GAP_COL;
    });
    g.colunas = ordemAreas.map(a => ({ area: a, x: medida[a].x, largura: medida[a].larg }));
  }

  // Views (Guia §15): layout é um mapa id → {x, y} no próprio arquivo de view.
  function applyView(g, view) {
    if (!view) return g;
    const pos = view.layout && (view.layout.positions || view.layout);
    if (!pos) return g;
    Object.keys(pos).forEach(id => {
      const n = g.map[id]; if (!n) return;
      const p = pos[id];
      if (typeof p.x === 'number') { n.homeX = p.x; n.x = p.x; }
      if (typeof p.y === 'number') { n.homeY = p.y; n.y = p.y; }
    });
    return g;
  }
  function exportView(g, id, name) {
    const layout = {};
    g.nodes.forEach(n => { layout[n.id] = { x: Math.round(n.x), y: Math.round(n.y) }; });
    return { id: id || 'view.sem-nome', type: 'view', status: 'draft', name: name || 'View sem nome', layout };
  }

  // ---- geometria pura ----
  // Quebra em no máximo `maxLines` linhas; o que não couber vira reticências,
  // para que um nome longo apareça cortado de propósito e não por engano.
  function wrapText(t, max, maxLines) {
    const lim = maxLines || 2;
    const w = String(t).split(' '), o = []; let c = '';
    w.forEach(x => { if ((c + ' ' + x).trim().length > max) { if (c) o.push(c); c = x; } else c = (c + ' ' + x).trim(); });
    if (c) o.push(c);
    if (o.length <= lim) return o;
    const cut = o.slice(0, lim);
    cut[lim - 1] = cut[lim - 1].replace(/[,;:.]?$/, '') + '…';
    return cut;
  }
  function convexHull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const n = p.length; if (n < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = n - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi)) inside = !inside;
    }
    return inside;
  }
  function polyArea(poly) {
    let a = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
    return Math.abs(a / 2);
  }
  function d2seg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / l; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  return {
    TYPE_LABELS, TYPE_TINT, REL_VERBS, LAYER_LABELS, STATUS_COLORS, CONFIDENCE_LABELS, BAND_Y,
    adaptGraph, computeLayout, applyView, exportView,
    wrapText, convexHull, pointInPoly, polyArea, d2seg,
  };
}));

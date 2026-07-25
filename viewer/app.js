/* Notocorda — mapa vivo v0 (porte do protótipo "Grafo em Camadas").
 * Consome exclusivamente o plano derivado (graph.json — contrato §7).
 * Parâmetros de URL: ?graph=<url> ?view=<url> ?org=<nome>
 */
'use strict';
const C = window.NotocordaCore;

/* Identidade "prancha de atlas" (2026-07-24). Dois conjuntos de tokens em cada
 * paleta, porque o app tem dois materiais:
 *   MARGEM  (margem/margem2/margem3/text/muted/hairline) — a marginalia: os
 *           painéis, o cabeçalho, o rodapé. É a moldura da prancha impressa.
 *   PRANCHA (papel/papel2/tinta/traco/grid) — a folha: o canvas e as etiquetas
 *           que flutuam sobre ele (convenções, níveis, cartão, editor).
 * `sinal` é o magenta de sinalização das cartas náuticas — a tinta que se
 * reserva a avisos, rotas e luzes. Aqui: foco, seleção e estado ativo. Nunca
 * preenche botão de ação (§ crítica da rodada de identidade).
 * `conv` são as seis convenções de camada, na versão para a prancha; `convUI`
 * na versão para a margem. Cor de camada aparece como CONVENÇÃO (glifo, filete,
 * rótulo) — o preenchimento da caixa continua reservado a estado (CONTRATO §3.1).
 */
const STATUS_ESCURO = { draft:'#9a7526', active:'#2f6e52', deprecated:'#a63d26', archived:'#6f7d80',
  current:'#2f6e52', proposed:'#3e6284', pilot:'#9a7526', rejected:'#a63d26', retired:'#6f7d80' };
const STATUS_CLARO = { draft:'#d7b264', active:'#6fae8f', deprecated:'#d0644a', archived:'#90a0a4',
  current:'#6fae8f', proposed:'#85a9c9', pilot:'#d7b264', rejected:'#d0644a', retired:'#90a0a4' };
const CONV_CLARO = { essencial:'#c6a56a', realizacao:'#6fa98d', sistemas:'#7e9bb8',
  dados:'#85c3d6', evidencias:'#ada694', problemas:'#c1533c' };
const CONV_ESCURO = { essencial:'#8a6a2e', realizacao:'#2f6e52', sistemas:'#3e6284',
  dados:'#2e7e97', evidencias:'#7a7160', problemas:'#a63d26' };

const PALETTES = {
  // Papel de carta emoldurado por margens escuras — o atlas aberto sobre a mesa.
  carta: {
    margem:'#1f2729', margem2:'#263032', margem3:'#303b3e', text:'#e8e1ce', muted:'#93a19e', hairline:'#3a4649',
    papel:'#e7dfc9', papel2:'#f2ebd9', tinta:'#1e2a2d', traco:'#a9a288', grid:'#d2c9af',
    sinal:'#b4356e', sinalM:'#d96a96', perigo:'#c1533c',
    prancaClara: true, conv: CONV_ESCURO, convUI: CONV_CLARO, status: STATUS_ESCURO, statusUI: STATUS_CLARO,
  },
  // Carta batimétrica noturna: prancha em azul-petróleo profundo.
  sonda: {
    margem:'#111a1f', margem2:'#18242a', margem3:'#22313a', text:'#dde7e6', muted:'#8ba0a6', hairline:'#2a3a42',
    papel:'#0f2530', papel2:'#173341', tinta:'#dfeae7', traco:'#3d6274', grid:'#183846',
    sinal:'#d0507f', sinalM:'#e0789f', perigo:'#d0644a',
    prancaClara: false, conv: CONV_CLARO, convUI: CONV_CLARO, status: STATUS_CLARO, statusUI: STATUS_CLARO,
  },
  // Ozalid: a cópia heliográfica de prancheta — tudo claro, tinta azul-ferro.
  ozalid: {
    margem:'#c3cbc6', margem2:'#ced5d0', margem3:'#dbe0da', text:'#16262e', muted:'#55666b', hairline:'#a5b0aa',
    papel:'#eef1e9', papel2:'#f8faf4', tinta:'#1b3f63', traco:'#96a5a4', grid:'#dbe2d8',
    sinal:'#a92f66', sinalM:'#8e2554', perigo:'#9c3823',
    prancaClara: true, margemClara: true,
    conv: CONV_ESCURO, convUI: CONV_ESCURO, status: STATUS_ESCURO, statusUI: STATUS_ESCURO,
  },
};

// Convenções cartográficas: um glifo por camada, o mesmo na legenda da prancha,
// no índice e no cartão. Forma distingue família; cor é a convenção da camada.
const CONV_GRUPOS = [
  ['essencial', 'Modelo essencial'], ['realizacao', 'Realizações'], ['sistemas', 'Sistemas'],
  ['dados', 'Dados'], ['evidencias', 'Evidências'], ['problemas', 'Problemas'],
];

// mistura duas cores hex — t=0 devolve a, t=1 devolve b
function mixHex(a, b, t) {
  const canal = h => { const s = String(h).replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)); };
  const [r1, g1, b1] = canal(a), [r2, g2, b2] = canal(b);
  const m = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return '#' + m(r1, r2) + m(g1, g2) + m(b1, b2);
}

class NotocordaApp {
  constructor(g, opts) {
    this.g = g; this.nodes = g.nodes; this.edges = g.edges; this.map = g.map;
    this.levels = g.levels; this.vsOrder = g.vsOrder;
    this.orgName = opts.orgName; this.graphUrl = opts.graphUrl;
    this.state = {
      palette: opts.palette || 'carta',
      levelIdx: Math.max(0, this.levels.findIndex(l => l.n === 0)),
      readingMode: 'completo', depth: 2,
      areaPanel: false, activeArea: null, showClouds: true, areaHidden: {},
      compare: false,
      editorOpen: false, editorNode: null, editorText: '',
      selected: null, search: '', edgeSentence: null,
      vis: { essencial:true, realizacao:true, sistemas:false, dados:false, evidencias:false, problemas:true },
      revealed: {},
      openGroups: { espinha:true, capacidades:true, atual:true, tobe:false, sistemas:true, dados:false, evidencias:false, problemas:true, areas:true },
      density: 1, spineOp: 0.4, repulsao: 0.7, fluid: 0.5,
      cloudOp: 1, curOp: 1, edgeOp: 1, edgeW: 1, gridOp: 1,
      indexCollapsed: false, inspectorCollapsed: false,
      spacing: 1, multi: new Set(), marquee: null, tool: 'pan', visual: 'prancha',
      fineOpen: false, aparenciaOpen: true,
      trilha: [], cardPos: {},   // notas abertas, em ordem de leitura, e onde foram largadas
      abrirOpen: false,
    };
    this.cam = { x: 0, y: -40, z: 0.66 };
    this.hoverId = null; this._t = 0; this._integrar = false;
    // quem pede menos movimento não leva o pulso do nó selecionado
    this.calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.initDom(); this.applyTheme(); this.setupCanvas(); this.attach();
    this.renderUI();
    this.assentar(70);
    this.last = performance.now();
    this._raf = requestAnimationFrame(now => this.loop(now));
  }
  pal() { return PALETTES[this.state.palette] || PALETTES.carta; }
  // cor de estado: `ui` distingue quem está sobre a margem de quem está na prancha
  statusCor(status, ui) { const p = this.pal(); return (ui ? p.statusUI : p.status)[status] || p.muted; }
  // cor de convenção da camada, nas duas versões
  convCor(grupo, ui) { const p = this.pal(); return (ui ? p.convUI : p.conv)[grupo] || p.muted; }
  // o glifo de convenção como HTML — a mesma peça no índice, na legenda e no cartão
  convGlifo(grupo, ui) { return `<span class="conv conv-${grupo}" style="color:${this.convCor(grupo, ui)}"></span>`; }
  setState(patch) { Object.assign(this.state, patch); this.renderUI(); }
  curLevel() { return this.levels[this.state.levelIdx] || this.levels[0]; }

  // ---- semântica (portada do protótipo, adaptada ao contrato) ----
  inScenario(n) {
    const lv = this.curLevel();
    if (lv.spineOnly) return n.layer === 'essential';
    return n.scenarios === 'all' || n.scenarios.includes(lv.scenId);
  }
  edgeInScenario(e) {
    const lv = this.curLevel();
    if (!lv.scenId) return e.scenarios === 'all';
    return e.scenarios === 'all' || e.scenarios.includes(lv.scenId);
  }
  groupOf(n) {
    if (n.layer === 'essential') return 'essencial';
    if (n.layer === 'problem') return 'problemas';
    if (n.type === 'document') return 'evidencias';
    if (n.type === 'data-asset') return 'dados';
    if (n.layer === 'operational') return 'realizacao';
    return 'sistemas';
  }
  areasOf(n) { return n.areaNames || []; }
  allAreas() {
    if (!this._allAreas) this._allAreas = [...new Set(this.nodes.flatMap(n => this.areasOf(n)))].sort();
    return this._allAreas;
  }
  areaIndex(a) { const i = this.allAreas().indexOf(a); return i < 0 ? 0 : i; }
  // Matizes de área tirados da roda terra-e-água de um mapa topográfico:
  // ocre, verde-mar, azul-aço, ciano de batimetria, recife, oliva… nenhum roxo.
  areaHues = [32, 158, 206, 188, 12, 96, 226, 46, 170, 136];
  areaTint(area, ui) {
    const p = this.pal();
    const hue = this.areaHues[this.areaIndex(area) % this.areaHues.length];
    const claro = ui ? !p.margemClara : p.prancaClara;   // fundo claro pede tinta escura
    return `hsl(${hue},${claro ? 44 : 48}%,${claro ? 38 : 70}%)`;
  }
  // O NOME da área é tinta de rótulo, não cor de mancha: mais escuro e mais
  // saturado que a nuvem, para se destacar de tudo que passa por baixo.
  areaTintaRotulo(area) {
    const p = this.pal();
    const hue = this.areaHues[this.areaIndex(area) % this.areaHues.length];
    return p.prancaClara ? `hsl(${hue},58%,25%)` : `hsl(${hue},52%,80%)`;
  }
  areaList() {
    const m = {};
    this.nodes.forEach(n => { if (this.inScenario(n)) this.areasOf(n).forEach(a => { m[a] = (m[a] || 0) + 1; }); });
    return Object.keys(m).sort().map(name => ({ name, count: m[name] }));
  }
  neighSet(id) {
    const s = new Set([id]);
    this.edges.forEach(e => { if (e.source === id) s.add(e.target); if (e.target === id) s.add(e.source); });
    return s;
  }
  neighSetDepth(id, depth) {
    let front = new Set([id]); const all = new Set([id]);
    for (let d = 0; d < (depth || 1); d++) {
      const nf = new Set();
      this.edges.forEach(e => {
        if (front.has(e.source) && !all.has(e.target)) { nf.add(e.target); all.add(e.target); }
        if (front.has(e.target) && !all.has(e.source)) { nf.add(e.source); all.add(e.source); }
      });
      front = nf; if (!front.size) break;
    }
    return all;
  }
  hiddenNeighbors(n) {
    const seen = new Set(), out = { sistemas: [], dados: [], evidencias: [], problemas: [] };
    this.edges.forEach(e => {
      let o = e.source === n.id ? e.target : (e.target === n.id ? e.source : null);
      if (!o || seen.has(o)) return; seen.add(o);
      const m = this.map[o]; if (!m || !this.inScenario(m)) return;
      const g = this.groupOf(m);
      if (out[g] && !(this.state.vis[g] || this.state.revealed[o])) out[g].push(o);
    });
    return out;
  }
  hiddenCount(n) { const h = this.hiddenNeighbors(n); return h.sistemas.length + h.dados.length + h.evidencias.length + h.problemas.length; }
  revealGroup(n, g) {
    const ids = this.hiddenNeighbors(n)[g] || []; const r = { ...this.state.revealed };
    ids.forEach(id => { r[id] = true; }); this.setState({ revealed: r });
  }
  pathToSpine(id) {
    const nodesP = new Set([id]), edgesP = new Set(); const q = [id], seen = new Set([id]);
    while (q.length) {
      const cur = q.shift(); const cn = this.map[cur];
      this.edges.forEach(e => {
        let o = null; if (e.source === cur) o = e.target; else if (e.target === cur) o = e.source; if (!o) return;
        const on = this.map[o];
        if (on.homeY < cn.homeY - 10) {
          edgesP.add(e.source + '>' + e.target);
          if (!seen.has(o)) { seen.add(o); nodesP.add(o); q.push(o); }
        }
      });
    }
    return { nodesP, edgesP };
  }
  spineRegionOf(n) {
    if (n.type === 'value-stage') return n.name;
    const path = this.pathToSpine(n.id); let vsName = null;
    path.nodesP.forEach(id => { if (this.map[id].type === 'value-stage' && !vsName) vsName = this.map[id].name; });
    return vsName || '—';
  }
  computeCompare() {
    if (!this.state.compare) return null;
    const lv = this.curLevel(); if (lv.kind !== 'to-be' || !lv.baseline) return null;
    const added = new Set(), changed = new Set(), removed = new Set();
    this.nodes.forEach(n => {
      if (n.scenarios !== 'all' && n.scenarios.includes(lv.scenId)) {
        if (!n.scenarios.includes(lv.baseline)) added.add(n.id);
        n.relations.forEach(r => {
          if (r.type === 'replaces') { changed.add(n.id); if (this.map[r.target]) removed.add(r.target); }
        });
      }
    });
    return { added, changed, removed };
  }
  visibleNodes() {
    const mode = this.state.readingMode, cmp = this._cmp;
    return this.nodes.filter(n => {
      if (cmp && cmp.removed.has(n.id)) return true;
      if (!this.inScenario(n)) return false;
      const g = this.groupOf(n);
      if (!(this.state.vis[g] || this.state.revealed[n.id])) return false;
      if (mode === 'vizinhanca' && this.state.selected) return this.neighSetDepth(this.state.selected, this.state.depth).has(n.id);
      return true;
    });
  }

  // ---- interação ----
  s2w(sx, sy) { return { x: (sx - this.W / 2) / this.cam.z + this.cam.x, y: (sy - this.H / 2) / this.cam.z + this.cam.y }; }
  w2s(wx, wy) { return { x: (wx - this.cam.x) * this.cam.z + this.W / 2, y: (wy - this.cam.y) * this.cam.z + this.H / 2 }; }
  mp(e) { const r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  nodeR(n) { return n.baseR * this.state.density * (n.type === 'document' ? 0.7 : 1); }
  hitNode(wx, wy) {
    const vis = this.visibleNodes();
    for (let i = vis.length - 1; i >= 0; i--) {
      const n = vis[i];
      const bw = (n._bw || this.nodeR(n) * 2) / 2 + 4, bh = (n._bh || this.nodeR(n) * 2) / 2 + 4;
      if (Math.abs(wx - n.x) <= bw && Math.abs(wy - (n.y + n.yoff + (n._boff || 0))) <= bh) return n;
    }
    return null;
  }
  // Ponto de controle do arco de retorno do ciclo, em coordenadas de mundo.
  // O afastamento cabe na folga entre o eixo de valor e o primeiro tier de
  // capacidades — a quadrática atinge metade da distância até o controle.
  returnCtrl(a, b) {
    const SAG = 95;
    return { x: (a.x + b.x) / 2, y: (a.y + a.yoff + b.y + b.yoff) / 2 + SAG * 2 };
  }
  hitEdge(wx, wy) {
    const vs = new Set(this.visibleNodes().map(n => n.id)); let best = null, bd = 10 / this.cam.z;
    this.edges.forEach(e => {
      if (!vs.has(e.source) || !vs.has(e.target)) return;
      const a = this.map[e.source], b = this.map[e.target];
      const ax = a.x, ay = a.y + a.yoff, bx = b.x, by = b.y + b.yoff;
      let d;
      if (e.isReturn) {
        const c = this.returnCtrl(a, b);
        d = Infinity; let px = ax, py = ay;
        for (let i = 1; i <= 12; i++) {
          const u = i / 12, iu = 1 - u;
          const qx = iu * iu * ax + 2 * iu * u * c.x + u * u * bx;
          const qy = iu * iu * ay + 2 * iu * u * c.y + u * u * by;
          d = Math.min(d, C.d2seg(wx, wy, px, py, qx, qy)); px = qx; py = qy;
        }
      } else {
        d = C.d2seg(wx, wy, ax, ay, bx, by);
      }
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }
  attach() {
    const c = this.canvas;
    c.addEventListener('mousedown', e => this.onDown(e));
    c.addEventListener('mousemove', e => this.onMove(e));
    c.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    c.addEventListener('mouseleave', () => { this.esconderDica(); this._dicaChave = null; });
    window.addEventListener('mouseup', e => this.onUp(e));
    window.addEventListener('keydown', e => this.onKey(e));
  }
  onDown(e) {
    const m = this.mp(e), w = this.s2w(m.x, m.y), n = this.hitNode(w.x, w.y);
    // Ctrl (⌘ no Mac) é o modificador: sobre a folha vazia abre a janela de
    // seleção; sobre uma célula, acrescenta a nota dela à trilha aberta.
    const mod = e.ctrlKey || e.metaKey;
    this._ds = { mx: m.x, my: m.y, cx: this.cam.x, cy: this.cam.y, mod }; this._moved = false;
    this.esconderDica(); this._dicaChave = null;
    if (n) {
      this._drag = n; n.fixed = true;
      // arrastar uma célula marcada leva o grupo inteiro junto
      this._grupo = this.state.multi.has(n.id)
        ? [...this.state.multi].map(id => this.map[id]).filter(Boolean) : null;
      if (this._grupo) this._grupo.forEach(g => { g.fixed = true; g._ox = g.x - n.x; g._oy = g.y - n.y; });
    } else if (e.ctrlKey || e.metaKey || this.state.tool === 'select') {
      this._marquee = { x0: w.x, y0: w.y, x1: w.x, y1: w.y, add: e.ctrlKey || e.metaKey };
      this.canvas.style.cursor = 'crosshair';
    } else { this._pan = true; this.canvas.style.cursor = 'grabbing'; }
  }
  onMove(e) {
    const m = this.mp(e);
    if (this._ds && (Math.abs(m.x - this._ds.mx) > 3 || Math.abs(m.y - this._ds.my) > 3)) this._moved = true;
    if (this._drag) {
      const w = this.s2w(m.x, m.y), nx = w.x, ny = w.y - this._drag.yoff;
      if (this._grupo) this._grupo.forEach(g => { g.x = nx + g._ox; g.y = ny + g._oy; g.vx = 0; g.vy = 0; });
      else { this._drag.x = nx; this._drag.y = ny; }
      this._drag.vx = 0; this._drag.vy = 0;
    }
    else if (this._marquee) { const w = this.s2w(m.x, m.y); this._marquee.x1 = w.x; this._marquee.y1 = w.y; }
    else if (this._pan) { this.cam.x = this._ds.cx - (m.x - this._ds.mx) / this.cam.z; this.cam.y = this._ds.cy - (m.y - this._ds.my) / this.cam.z; }
    else {
      const w = this.s2w(m.x, m.y), n = this.hitNode(w.x, w.y), id = n ? n.id : null;
      if (id !== this.hoverId) { this.hoverId = id; this.canvas.style.cursor = n ? 'pointer' : 'grab'; }
      this.agendarDica(m, n);
    }
  }

  // ---- dica (tooltip) ---------------------------------------------------
  // Meio segundo parado sobre uma nuvem revela o nome da área — os rótulos
  // das nuvens se apertam quando elas se sobrepõem, e nem sempre o nome cabe
  // na folha. Vale também para a célula cujo rótulo o zoom já engoliu.
  agendarDica(m, n) {
    const areas = n ? [] : this.areasAtScreen(m.x, m.y);
    const chave = n ? 'n:' + n.id : (areas.length ? 'a:' + areas.join('|') : null);
    if (chave === this._dicaChave) { if (this._dicaAberta) this.moverDica(m); return; }
    this._dicaChave = chave;
    this.esconderDica();
    if (!chave) return;
    let html = null;
    if (n) {
      // só quando o rótulo da célula não está legível na prancha
      const fs = (n.fsMundo || 0) * (this.state.density || 1) * this.cam.z;
      if (fs < 8.5) html = `<b>${this.esc(n.name)}</b><div class="tip-meta">${this.esc(C.TYPE_LABELS[n.type] || n.type)}</div>`;
    } else {
      // nuvens EMPILHADAS: a dica nomeia todas as áreas sob o mouse, da mais
      // específica para a mais ampla — é o mesmo empilhamento do desenho.
      const lista = this.areaList();
      html = areas.map(a => {
        const item = lista.find(x => x.name === a);
        return `<b>${this.esc(a)}</b><div class="tip-meta">área · ${item ? item.count : 0} células</div>`;
      }).join('');
    }
    if (!html) return;
    this._dicaT = setTimeout(() => {
      const el = this.$('tip'); el.innerHTML = html; el.style.display = 'block';
      this._dicaAberta = true; this.moverDica(m);
    }, 500);
  }
  moverDica(m) {
    const el = this.$('tip'); if (!this._dicaAberta) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(m.x + 14, Math.max(4, this.W - r.width - 8));
    const y = Math.min(m.y + 18, Math.max(4, this.H - r.height - 8));
    el.style.left = x + 'px'; el.style.top = y + 'px';
  }
  esconderDica() {
    clearTimeout(this._dicaT);
    if (this._dicaAberta) { this.$('tip').style.display = 'none'; this._dicaAberta = false; }
  }
  onUp(e) {
    if (this._marquee) {
      const r = this._marquee;
      const x0 = Math.min(r.x0, r.x1), x1 = Math.max(r.x0, r.x1);
      const y0 = Math.min(r.y0, r.y1), y1 = Math.max(r.y0, r.y1);
      const marcados = new Set(r.add ? this.state.multi : []);
      this.visibleNodes().forEach(n => {
        const y = n.y + n.yoff;
        if (n.x >= x0 && n.x <= x1 && y >= y0 && y <= y1) marcados.add(n.id);
      });
      this._marquee = null; this._drag = null; this._pan = false; this._ds = null;
      // clique seco no vazio com a ferramenta de seleção: solta tudo
      if (!marcados.size && !this._moved) { this.clearSelection(); this.canvas.style.cursor = this.state.tool === 'select' ? 'crosshair' : 'grab'; return; }
      this.setState({ multi: marcados, selected: null });
      this.aviso(marcados.size
        ? marcados.size + ' células marcadas — arraste uma delas para mover o grupo (clique no vazio ou Esc limpa)'
        : 'nenhuma célula na janela de seleção');
      this.canvas.style.cursor = this.state.tool === 'select' ? 'crosshair' : 'grab';
      return;
    }
    if (this._drag) {
      this._drag.fixed = false;
      if (this._grupo) { this._grupo.forEach(g => { g.fixed = false; }); this._grupo = null; }
      if (!this._moved) {
        if (this._ds && this._ds.mod) this.pushCard(this._drag.id);   // Ctrl+clique: soma à trilha
        else this.selectNode(this._drag.id);                          // clique simples: trilha nova
      }
    }
    else if (this._pan && !this._moved) {
      const m = this.mp(e), w = this.s2w(m.x, m.y), edge = this.hitEdge(w.x, w.y);
      if (edge) this.showEdge(edge);
      else { const area = this.areaAtScreen(m.x, m.y); if (area) this.setState({ areaPanel: true, activeArea: area }); else this.clearSelection(); }
    }
    this._drag = null; this._pan = false; this._ds = null;
    this.canvas.style.cursor = this.hoverId ? 'pointer' : 'grab';
  }
  onWheel(e) {
    e.preventDefault();
    this.esconderDica(); this._dicaChave = null;
    const m = this.mp(e), b = this.s2w(m.x, m.y), f = Math.exp(-e.deltaY * 0.0016);
    this.cam.z = Math.max(0.2, Math.min(3.4, this.cam.z * f));
    const a = this.s2w(m.x, m.y); this.cam.x += b.x - a.x; this.cam.y += b.y - a.y;
  }
  onKey(e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); this.setLevel(Math.min(this.levels.length - 1, this.state.levelIdx + 1)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.setLevel(Math.max(0, this.state.levelIdx - 1)); }
    else if (e.key === 'Escape') {
      if (this.state.abrirOpen) this.setState({ abrirOpen: false });
      else if (this.state.editorOpen) this.setState({ editorOpen: false });
      else if (this.state.multi.size) this.setState({ multi: new Set() });
      else this.clearSelection();
    }
  }
  setLevel(i) {
    if (i === this.state.levelIdx) return;
    const dir = i > this.state.levelIdx ? 1 : -1; const lv = this.levels[i];
    this.setState({ levelIdx: i, selected: null, editorOpen: false, revealed: {} });
    this.nodes.forEach(n => {
      if (n.layer !== 'essential' && lv.scenId && n.scenarios !== 'all' && n.scenarios.includes(lv.scenId)) n.yoff = -dir * 40;
    });
    // NÃO reenquadra: a câmera fica onde está para a espinha não saltar na
    // troca de nível (o "enquadrar" continua disponível no rodapé/atalho).
    this.assentar(45);
  }
  // clicar numa célula começa uma trilha nova
  selectNode(id) { this.hoverId = id; this.setState({ selected: id, edgeSentence: null, trilha: [id] }); }
  // abrir uma relação (ou Ctrl+clique numa célula) acrescenta um elo à trilha
  pushCard(id) {
    if (!this.map[id]) return;
    const t = this.state.trilha.slice();
    const i = t.indexOf(id);
    if (i >= 0) t.splice(i, 1);          // já aberta: vai para a ponta, não duplica
    t.push(id);
    this.hoverId = id;
    this.setState({ trilha: t, selected: id, edgeSentence: null });
  }
  closeCard(id) {
    const t = this.state.trilha.filter(x => x !== id);
    const pos = { ...this.state.cardPos }; delete pos[id];
    this.setState({ trilha: t, cardPos: pos, selected: t.length ? t[t.length - 1] : null });
  }
  // Clicar no vazio da folha limpa TUDO que estiver marcado — inclusive as
  // células da janela de seleção, que antes ficavam marcadas para sempre
  // (só o Esc as soltava).
  clearSelection() {
    this.setState({ selected: null, edgeSentence: null, activeArea: null, trilha: [], cardPos: {}, multi: new Set() });
  }
  // pares consecutivos da trilha, para o mapa mostrar o caminho percorrido
  trilhaMarcas() {
    const t = this.state.trilha, nos = new Set(t), pares = new Set();
    for (let i = 1; i < t.length; i++) { pares.add(t[i - 1] + '>' + t[i]); pares.add(t[i] + '>' + t[i - 1]); }
    return { nos, pares };
  }
  showEdge(e) {
    this.setState({
      edgeSentence: { src: this.map[e.source].name, verb: C.REL_VERBS[e.type] || e.type, dst: this.map[e.target].name },
      selected: null,
    });
  }
  focusNode(id) {
    const n = this.map[id]; if (!n) return;
    if (n.layer !== 'essential' && n.scenarios !== 'all') {
      const idx = this.levels.findIndex(lv => lv.scenId && n.scenarios.includes(lv.scenId));
      if (idx >= 0 && idx !== this.state.levelIdx) this.setState({ levelIdx: idx, revealed: {} });
    } else if (this.curLevel().spineOnly && n.layer !== 'essential') {
      const idx = this.levels.findIndex(lv => lv.scenId && (n.scenarios === 'all' || n.scenarios.includes(lv.scenId)));
      if (idx >= 0) this.setState({ levelIdx: idx });
    }
    this.cam.x = n.x; this.cam.y = n.y; this.cam.z = Math.max(this.cam.z, 1.0);
    this.selectNode(id);
  }

  // ---- física + desenho (porte quase literal do protótipo) ----
  loop(now) {
    let dt = (now - this.last) / 1000; this.last = now; dt = Math.min(dt, 0.033);
    this.step(dt); this.draw(); if (this.mini) this.drawMini();
    this._raf = requestAnimationFrame(n2 => this.loop(n2));
  }
  step(dt) {
    this._t += dt;
    this._cmp = this.computeCompare();
    const vis = this.visibleNodes();
    // Todo mundo tem lugar calculado no core (espinha por Sugiyama, demais
    // camadas por coluna de área × faixa × âncora). A física aqui só resolve
    // sobreposição residual — ela não decide mais para onde a célula vai.
    vis.forEach(a => { a.tx = a.homeX != null ? a.homeX : a.x; a.ty = a.homeY; });
    const areaC = {}, tmpA = {};
    vis.forEach(n => { if (n.layer === 'essential' || n.type === 'value-stage') return; this.areasOf(n).forEach(a => { (tmpA[a] = tmpA[a] || []).push(n); }); });
    Object.keys(tmpA).forEach(a => {
      const arr = tmpA[a]; let cx = 0, cy = 0; arr.forEach(n => { cx += n.x; cy += n.y; }); cx /= arr.length; cy /= arr.length;
      let r = 50; arr.forEach(n => { r = Math.max(r, Math.hypot(n.x - cx, n.y - cy) + ((n._bw || this.nodeR(n) * 2) / 2) + 16); });
      areaC[a] = { x: cx, y: cy, r };
    });
    this._areaC = areaC;
    const drag = 0.7 + this.state.fluid * 4.2;
    // O mapa é ESTÁTICO: a acomodação acontece de uma vez em `assentar()`,
    // fora da tela. Sem isso as caixas ficavam num tremor perpétuo que
    // atrapalha a leitura. Aqui só se integra durante o assentamento.
    if (this._integrar) vis.forEach(a => {
      if (a.fixed) return;
      // Espinha e essencial são OUTRO NÍVEL: ficam cravados no lugar de origem
      // (Sugiyama), não entram na física. Assim a espinha não salta ao trocar
      // de nível — só as células de periferia (que mudam por cenário) acomodam.
      if (a.type === 'value-stage' || a.layer === 'essential') { a.x = a.homeX; a.y = a.homeY; a.vx = 0; a.vy = 0; return; }
      const cell = a.layer !== 'essential' && a.type !== 'value-stage';
      let fx = (a.tx - a.x) * (cell ? 0.06 : 0.1), fy = (a.ty - a.y) * (cell ? 0.12 : 0.14);
      const aw = (a._bw || this.nodeR(a) * 2) / 2, ah = (a._bh || this.nodeR(a) * 2) / 2;
      vis.forEach(b => {
        if (a === b) return;
        const bw = (b._bw || this.nodeR(b) * 2) / 2, bh = (b._bh || this.nodeR(b) * 2) / 2;
        const dx = a.x - b.x, dy = a.y - b.y, gx = aw + bw + 26, gy = ah + bh + 20;
        const ox = gx - Math.abs(dx), oy = gy - Math.abs(dy);
        if (ox > 0 && oy > 0) { if (ox < oy) fx += (dx >= 0 ? 1 : -1) * ox * 2.4; else fy += (dy >= 0 ? 1 : -1) * oy * 2.4; }
      });
      a.vx += fx * dt; a.vy += fy * dt;
      const sp = Math.hypot(a.vx, a.vy), damp = 1 / (1 + drag * sp * dt); a.vx *= damp; a.vy *= damp;
      let s = Math.hypot(a.vx, a.vy); if (s > 0) { const ns = Math.max(0, s - 240 * dt); a.vx *= ns / s; a.vy *= ns / s; }
      if (Math.hypot(a.vx, a.vy) < 4 && Math.abs(a.tx - a.x) < 0.6 && Math.abs(a.ty - a.y) < 0.6) { a.vx = 0; a.vy = 0; }
      const mv = 900, s2 = Math.hypot(a.vx, a.vy); if (s2 > mv) { a.vx *= mv / s2; a.vy *= mv / s2; }
      a.x += a.vx * dt; a.y += a.vy * dt;
    });
    const spineOp = this.state.spineOp, cmp = this._cmp, mode = this.state.readingMode;
    const spineFocus = this.curLevel().spineOnly;
    const focusId = this.state.selected || this.hoverId; let neigh = null, path = null;
    // O raio do painel (1–3) vale para o realce de HOVER também — antes o
    // hover ficava cravado em 1 e o seletor parecia não responder.
    if (focusId) { neigh = this.neighSetDepth(focusId, this.state.depth); if (this.state.selected) path = this.pathToSpine(this.state.selected); }
    this._path = path;
    this.nodes.forEach(n => {
      const g = this.groupOf(n); const ghost = cmp && cmp.removed.has(n.id) && !this.inScenario(n);
      let shown = this.inScenario(n) && (this.state.vis[g] || this.state.revealed[n.id]);
      if (mode === 'vizinhanca' && this.state.selected && neigh) shown = shown && neigh.has(n.id);
      let t;
      if (ghost) t = 0.3; else if (!shown) t = 0;
      else if (n.layer === 'essential') t = spineFocus ? 1 : spineOp;
      else t = 0.96;
      // No modo vizinhança COM seleção o recorte já aconteceu acima (shown);
      // sem seleção, o realce de hover continua valendo — senão o modo parece
      // morto até a primeira célula ser escolhida.
      if (neigh && shown && (mode !== 'vizinhanca' || !this.state.selected)) { const on = path ? path.nodesP.has(n.id) : neigh.has(n.id); t = on ? 1 : t * 0.16; }
      if (this.state.activeArea && shown && !focusId) t = this.areasOf(n).includes(this.state.activeArea) ? 1 : t * 0.2;
      // opacidade da "camada atual" (as realizações operacionais): controle de
      // experimentação do painel Aparência — não mexe na espinha nem no fundo.
      if (n.layer === 'operational' && shown) t *= this.state.curOp;
      n.talpha = t; n.alpha += (t - n.alpha) * Math.min(1, dt * 8); n.yoff += (0 - n.yoff) * Math.min(1, dt * 7);
    });
  }
  // Acomoda tudo de uma vez (sem desenhar) e congela. Chamado ao abrir e
  // sempre que a cena muda de conteúdo — nunca a cada quadro.
  assentar(quadros) {
    const q = quadros || 70;
    this._integrar = true;
    for (let i = 0; i < q; i++) this.step(1 / 60);
    this._integrar = false;
    this.nodes.forEach(n => { n.vx = 0; n.vy = 0; });
  }
  fitView() {
    const vis = this.visibleNodes(); if (!vis.length) return;
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    // enquadra a caixa inteira, não o centro — senão as das pontas ficam cortadas
    vis.forEach(n => {
      const hw = (n._bw || this.nodeR(n) * 2) / 2, hh = (n._bh || this.nodeR(n) * 2) / 2;
      a = Math.min(a, n.x - hw); b = Math.min(b, n.y - hh);
      c = Math.max(c, n.x + hw); d = Math.max(d, n.y + hh);
    });
    const pad = 100, w = c - a + pad * 2, h = d - b + pad * 2;
    this.cam.x = (a + c) / 2; this.cam.y = (b + d) / 2;
    this.cam.z = Math.max(0.24, Math.min(1.3, Math.min(this.W / w, this.H / h)));
  }
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  draw() {
    const ctx = this.ctx; if (!ctx) return;
    const p = this.pal(), z = this.cam.z;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.W, this.H);
    ctx.fillStyle = p.papel; ctx.fillRect(0, 0, this.W, this.H);
    this.drawGrid(p); this.drawClouds(p); this.drawRegions(p);
    const focusId = this.state.selected || this.hoverId; const path = this._path;
    const lv = this.curLevel();
    // Três pesos de traço, como as três ordens de linha de uma carta: o eixo em
    // tinta cheia, a ligação com a periferia em meia-tinta, o resto em traço
    // leve. O sinal NÃO entra aqui — ele é reservado ao foco (regra da paleta).
    const meiaTinta = mixHex(p.tinta, p.papel, 0.45);
    const tr = this.trilhaMarcas(); this._trilhaNos = tr.nos;
    this.edges.forEach(e => {
      if (lv.scenId && !this.edgeInScenario(e)) return;
      const a = this.map[e.source], b = this.map[e.target];
      if (a.alpha < 0.02 || b.alpha < 0.02) return;
      const s = this.w2s(a.x, a.y + a.yoff), t = this.w2s(b.x, b.y + b.yoff);
      const spine = (e.type === 'advances');
      const inc = focusId && (path ? path.edgesP.has(e.source + '>' + e.target) : (e.source === focusId || e.target === focusId));
      let al = Math.min(a.alpha, b.alpha); ctx.save();
      const aE = a.layer === 'essential', bE = b.layer === 'essential'; const cat = aE && bE ? 'ss' : ((aE || bE) ? 'sp' : 'pp');
      let col = cat === 'ss' ? p.tinta : (cat === 'sp' ? meiaTinta : p.traco), lw = 1.2, dash = null, arrow = true;
      if (spine) { col = p.tinta; lw = 3 * Math.max(.7, Math.min(1.2, z)); }
      else if (e.type === 'realizes') { lw = 2.4; }
      else if (e.type === 'requires' || e.type === 'enables') { lw = 1.4; }
      else if (e.type === 'triggers' || e.type === 'creates') { lw = 1.7; }
      else if (['supports', 'uses', 'records', 'derived-from', 'related-to'].includes(e.type)) { lw = 1; dash = [5, 4]; al *= 0.8; }
      else if (['evidences', 'measures'].includes(e.type)) { lw = 1; dash = [1.5, 4]; al *= 0.55; }
      else if (e.type === 'affects' || e.type === 'contradicts') { col = p.perigo; lw = 1.5; dash = [3, 4]; }
      else if (e.type === 'mitigates' || e.type === 'motivates') { lw = 1.2; dash = [5, 4]; al *= 0.85; }
      else if (e.type === 'replaces') { dash = [6, 5]; }
      else if (e.type === 'constrains') { dash = [5, 4]; al *= 0.85; arrow = false; }
      if (inc) { col = p.sinal; lw += 0.8; al = Math.min(1, al + 0.45); dash = dash || [7, 6]; }
      // elo da trilha aberta: o caminho que as notas percorreram fica firme
      if (tr.pares.has(e.source + '>' + e.target)) { col = p.sinal; lw = Math.max(lw, 2.6); al = 1; dash = null; }
      // painel Aparência: opacidade e grossura das arestas para experimentação
      ctx.globalAlpha = al * this.state.edgeOp; ctx.strokeStyle = col; ctx.lineWidth = lw * this.state.edgeW;
      if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = -((this._t) * 26) % 1000; } else ctx.lineDashOffset = 0;
      // Fechamento de ciclo (ex.: "avaliar e evoluir" devolve ao planejamento):
      // arco por baixo do eixo, para não atravessar as etapas intermediárias.
      let ctrlS = null, ang;
      if (e.isReturn) {
        const c = this.returnCtrl(a, b); ctrlS = this.w2s(c.x, c.y);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(ctrlS.x, ctrlS.y, t.x, t.y); ctx.stroke();
        ang = Math.atan2(t.y - ctrlS.y, t.x - ctrlS.x);
      } else {
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
        ang = Math.atan2(t.y - s.y, t.x - s.x);
      }
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      if (ctrlS && z > 0.28) {
        const mx = 0.25 * s.x + 0.5 * ctrlS.x + 0.25 * t.x, my = 0.25 * s.y + 0.5 * ctrlS.y + 0.25 * t.y;
        const r = Math.max(8, Math.min(12, 11 * z));
        ctx.globalAlpha = al; ctx.fillStyle = p.papel;
        ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = col; ctx.font = `600 ${Math.max(11, Math.min(16, 14 * z))}px 'IBM Plex Mono',monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('↺', mx, my + 0.5);
        ctx.strokeStyle = col; ctx.lineWidth = lw;
      }
      if (arrow) {
        const br = (Math.max(b._bw || this.nodeR(b) * 2, b._bh || this.nodeR(b) * 2) / 2) * z + 4;
        const hx = t.x - Math.cos(ang) * br, hy = t.y - Math.sin(ang) * br;
        ctx.globalAlpha = Math.min(1, al + 0.1); ctx.beginPath(); ctx.moveTo(hx, hy);
        ctx.lineTo(hx - Math.cos(ang - 0.42) * 8, hy - Math.sin(ang - 0.42) * 8);
        ctx.lineTo(hx - Math.cos(ang + 0.42) * 8, hy - Math.sin(ang + 0.42) * 8);
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      ctx.restore();
    });
    const order = this.nodes.slice().sort((n1, n2) => (n1.type === 'value-stage' ? 1 : 0) - (n2.type === 'value-stage' ? 1 : 0));
    order.forEach(n => { if (n.alpha < 0.02) return; this.drawNode(ctx, p, n, z); });
    this.drawAreaLabels(p);
    if (this._marquee) {
      const a = this.w2s(this._marquee.x0, this._marquee.y0), b = this.w2s(this._marquee.x1, this._marquee.y1);
      ctx.save();
      ctx.fillStyle = p.sinal; ctx.globalAlpha = 0.1;
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.globalAlpha = 0.85; ctx.strokeStyle = p.sinal; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.restore();
    }
  }
  // Visualização "Grafo": bolha dimensionada pela hierarquia, com o nome fora
  // — a leitura à la Obsidian. O arranjo das caixas é o mesmo; muda o desenho.
  drawNodeBolha(ctx, p, n, z) {
    const s = this.w2s(n.x, n.y + n.yoff);
    const escala = this.state.density || 1;
    const rMundo = 15 * (n.escala || 0.8) * 1.7 * escala;
    const r = rMundo * z;
    n._bw = rMundo * 2; n._bh = rMundo * 2;
    const isSel = this.state.selected === n.id, isHov = this.hoverId === n.id;
    const marcado = this.state.multi && this.state.multi.has(n.id);
    const ess = n.layer === 'essential', problem = n.layer === 'problem';
    const fundo = ess && !this.curLevel().spineOnly;
    const norm = Math.max(0, Math.min(1, ((n.escala || 1) - 0.62) / 0.63));
    let fill = fundo ? p.papel2 : mixHex(p.tinta, p.papel2, (1 - norm) * 0.4);
    let border = fundo ? p.traco : this.convCor(this.groupOf(n));
    if (problem) { fill = p.perigo; border = p.perigo; }
    if (isHov && !isSel) border = p.sinal;
    if (isSel || marcado) border = p.sinal;
    ctx.save(); ctx.globalAlpha = n.alpha;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = border; ctx.lineWidth = (isSel || marcado) ? 2.4 : 1.2; ctx.stroke();
    if (marcado) {
      ctx.setLineDash([4, 3]); ctx.strokeStyle = p.sinal; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(s.x, s.y, r + 4, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    const fs = Math.min(15, Math.max(0, 13 * escala * z * (0.7 + 0.5 * norm)));
    if (fs >= 5.5) {
      const linhas = C.wrapText(n.name, 18, 2);
      ctx.font = `${n.type === 'value-stage' ? 600 : 500} ${fs}px 'IBM Plex Sans',sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = isSel ? p.sinal : p.tinta;
      ctx.globalAlpha = n.alpha * (isSel || isHov ? 1 : 0.88);
      linhas.forEach((l, i) => ctx.fillText(l, s.x, s.y + r + 5 + i * fs * 1.15));
    }
    ctx.restore();
  }
  drawNode(ctx, p, n, z) {
    if (this.state.visual === 'grafo') { this.drawNodeBolha(ctx, p, n, z); return; }
    const s = this.w2s(n.x, n.y + n.yoff);
    const isSel = this.state.selected === n.id, isHov = this.hoverId === n.id;
    const marcado = this.state.multi && this.state.multi.has(n.id);
    const spine = n.type === 'value-stage', problem = n.layer === 'problem';
    const path = this._path, onPath = path && path.nodesP.has(n.id);
    const cmp = this._cmp; let cmpCol = null;
    if (cmp) { if (cmp.added.has(n.id)) cmpCol = '#4f8f6e'; else if (cmp.changed.has(n.id)) cmpCol = p.sinal; else if (cmp.removed.has(n.id)) cmpCol = p.perigo; }
    // A caixa tem tamanho no MUNDO: afastar o mapa encolhe a caixa junto, como
    // qualquer outro desenho. (Antes a fonte tinha piso em pixels de tela, então
    // a caixa inchava ao afastar e as vizinhas se sobrepunham.)
    const escala = this.state.density || 1;
    const w = n.wWorld * escala * z, h = n.hWorld * escala * z;
    const fs = n.fsMundo * escala * z;
    // A caixa cresce PARA BAIXO: o topo fica onde ficaria a caixa de duas
    // linhas, e o excedente desce. `_boff` é o quanto o centro desceu — o
    // acerto de contas com o hit-test, as nuvens e a física.
    const hBase = (n.hBase || n.hWorld) * escala * z;
    const topo = s.y - hBase / 2, cy = topo + h / 2;
    n._bw = n.wWorld * escala; n._bh = n.hWorld * escala;
    n._boff = ((n.hWorld - (n.hBase || n.hWorld)) / 2) * escala;
    const lines = n.linhas || C.wrapText(n.name, spine ? 18 : 16, 5);
    ctx.font = `${spine ? 600 : 500} ${fs}px 'IBM Plex Sans',sans-serif`;
    const ess = n.layer === 'essential';
    const grupo = this.groupOf(n);
    const naTrilha = this._trilhaNos && this._trilhaNos.has(n.id);
    // TINTA = NÍVEL EM FOCO. O que pertence ao nível aberto é bloco de tinta;
    // o nível de trás (a espinha, quando se está num cenário) fica apagado.
    // Amarrar o bloco à família "essencial" deixava o As-Is inteiro branco.
    const fundo = ess && !this.curLevel().spineOnly;
    // o foco alcançando o nível de trás o acende, mas em cinza claro — ele não
    // pode assumir a mesma presença de quem está no nível aberto
    const aceso = isSel || isHov || naTrilha || onPath;
    const norm = Math.max(0, Math.min(1, ((n.escala || 1) - 0.55) / 0.45));
    let fill, border, txt, bw;
    if (fundo) {
      if (aceso) { fill = mixHex(p.tinta, p.papel, 0.74); border = p.tinta; txt = p.tinta; bw = 1.4; }
      else { fill = p.papel2; border = p.traco; txt = mixHex(p.tinta, p.papel, 0.3); bw = spine ? 1.4 : 1; }
    } else {
      // gradiente de hierarquia: quanto maior a caixa, mais cheia de tinta.
      // Não é cor por tipo (CONTRATO §3.1) — a camada entra pelo filete.
      fill = mixHex(p.tinta, p.papel2, (1 - norm) * 0.34);
      txt = p.papel; border = p.papel; bw = spine ? 2 : 1.4;
    }
    // problema é cor de estado e precisa saltar: fica claro com traço de perigo
    if (problem) { fill = p.papel2; border = p.perigo; txt = p.perigo; bw = 1.6; }
    const claro = fundo || problem;   // caixa de fundo claro pede texto escuro
    if (onPath || naTrilha) { border = p.sinal; bw = Math.max(bw, 1.9); }
    if (isHov && !isSel) { border = problem ? p.perigo : (claro ? p.tinta : p.sinal); }
    if (isSel) { border = p.sinal; txt = claro ? p.sinal : p.papel; bw = Math.max(bw, 2.4); }
    if (cmpCol) { border = cmpCol; if (!isSel && claro) txt = cmpCol; }
    ctx.save(); ctx.globalAlpha = n.alpha; ctx.lineJoin = 'round';
    if (isSel) {
      const pr = this.calmo ? 1 : Math.sin(this._t * 3.2) * 0.5 + 0.5;
      ctx.save(); ctx.globalAlpha = n.alpha * (0.32 + 0.3 * pr); ctx.strokeStyle = p.sinal; ctx.lineWidth = 1.4;
      const pd = 5 + pr * 4; this.roundRect(ctx, s.x - w / 2 - pd, topo - pd, w + pd * 2, h + pd * 2, 6); ctx.stroke(); ctx.restore();
    }
    this.roundRect(ctx, s.x - w / 2, topo, w, h, 3);
    ctx.globalAlpha = n.alpha * (spine ? 0.98 : (ess ? 0.96 : 0.92)); ctx.fillStyle = fill; ctx.fill();
    // Filete de convenção: a mesma cor do glifo da camada na legenda e no
    // índice, entrando pela borda da célula. É o que costura mapa e margem.
    if (w > 15) {
      const fw = Math.max(2.2, Math.min(4.5, 3.2 * z));
      ctx.save(); this.roundRect(ctx, s.x - w / 2, topo, w, h, 3); ctx.clip();
      ctx.globalAlpha = n.alpha * (ess ? 0.9 : 1); ctx.fillStyle = this.convCor(grupo);
      ctx.fillRect(s.x - w / 2, topo, fw, h); ctx.restore();
    }
    ctx.globalAlpha = n.alpha; ctx.strokeStyle = border; ctx.lineWidth = bw; ctx.stroke();
    // Rótulo com nível de detalhe: abaixo de ~6px o texto vira borrão, então
    // some e fica só a forma — a leitura volta assim que você aproxima.
    const lineH = fs * 1.18;
    if (fs >= 5) {
      // o rótulo do nível de trás não acompanha o esmaecimento até o ilegível
      ctx.globalAlpha = Math.min(1, fundo ? Math.max(n.alpha, 0.7) : n.alpha); ctx.fillStyle = txt;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const bloco = lines.length * lineH;
      lines.forEach((l, i) => ctx.fillText(l, s.x, cy - bloco / 2 + lineH * (i + 0.5)));
    }
    // rótulo de tipo na cor da convenção da camada — o índice usa a mesma
    if (fs >= 8 && (z > 0.5 || isHov || isSel)) {
      ctx.globalAlpha = n.alpha * 0.9; ctx.fillStyle = this.convCor(grupo);
      ctx.font = `500 ${Math.max(7.5, Math.min(9.5, fs * 0.62))}px 'IBM Plex Mono',monospace`;
      ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
      ctx.fillText((C.TYPE_LABELS[n.type] || n.type).toUpperCase(), s.x, topo - 3);
    }
    if (fs >= 7) {
      const rp = Math.max(1.6, Math.min(3.4, fs * 0.24));
      ctx.globalAlpha = n.alpha; ctx.beginPath();
      ctx.arc(s.x + w / 2 - rp * 1.6, topo + rp * 1.6, rp, 0, 7);
      ctx.fillStyle = this.statusCor(n.status); ctx.fill();
    }
    if (marcado) {
      ctx.globalAlpha = n.alpha * 0.95; ctx.strokeStyle = p.sinal; ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      this.roundRect(ctx, s.x - w / 2 - 3, topo - 3, w + 6, h + 6, 4); ctx.stroke();
      ctx.setLineDash([]);
    }
    const hid = (fs >= 9 && (z > 0.55 || isHov || isSel)) ? this.hiddenCount(n) : 0;
    if (hid > 0) {
      ctx.globalAlpha = n.alpha * 0.92; const bx = s.x + w / 2 - 6, by = topo + h + 1;
      this.roundRect(ctx, bx - 8, by, 22, 14, 2); ctx.fillStyle = p.papel2; ctx.fill();
      ctx.strokeStyle = p.traco; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = p.tinta; ctx.font = `500 9px 'IBM Plex Mono',monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+' + hid, bx + 3, by + 7);
    }
    ctx.restore();
  }
  // Graticule de carta: malha fina quieta, meridianos a cada 4 células com
  // traço mais firme, e coordenada escrita SÓ nos maiores (antes numerava
  // todas as linhas, o que ruidava a folha inteira).
  drawGrid(p) {
    const ctx = this.ctx, z = this.cam.z, step = 48 * z; if (step < 10) return;
    const go = this.state.gridOp; if (go <= 0.01) return;   // painel Aparência
    const MAIOR = 4;
    const i0x = Math.floor((this.cam.x - this.W / 2 / z) / 48), i1x = Math.ceil((this.cam.x + this.W / 2 / z) / 48);
    const i0y = Math.floor((this.cam.y - this.H / 2 / z) / 48), i1y = Math.ceil((this.cam.y + this.H / 2 / z) / 48);
    ctx.save(); ctx.lineWidth = 1;
    for (let i = i0x; i <= i1x; i++) {
      const maior = i % MAIOR === 0, x = Math.round(this.w2s(i * 48, 0).x) + 0.5;
      ctx.strokeStyle = maior ? p.traco : p.grid; ctx.globalAlpha = (maior ? 0.34 : 0.55) * go;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.H); ctx.stroke();
    }
    for (let j = i0y; j <= i1y; j++) {
      const maior = j % MAIOR === 0, y = Math.round(this.w2s(0, j * 48).y) + 0.5;
      ctx.strokeStyle = maior ? p.traco : p.grid; ctx.globalAlpha = (maior ? 0.34 : 0.55) * go;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke();
    }
    if (step > 13) {
      ctx.fillStyle = p.tinta; ctx.globalAlpha = 0.3 * go; ctx.font = "400 8.5px 'IBM Plex Mono',monospace";
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      for (let i = i0x; i <= i1x; i++) if (i % MAIOR === 0) ctx.fillText(i * 48, this.w2s(i * 48, 0).x + 3, 3);
      // a coluna de ordenadas começa abaixo da faixa de abscissas, senão os
      // dois números colidem no canto da folha
      for (let j = i0y; j <= i1y; j++) {
        if (j % MAIOR !== 0) continue;
        const y = this.w2s(0, j * 48).y; if (y < 16) continue;
        ctx.fillText(j * 48, 3, y + 2);
      }
    }
    ctx.restore();
  }
  // Faixas da prancha: nome da banda na margem direita da folha, discreto,
  // como o rótulo de uma seção de carta.
  drawRegions(p) {
    const ctx = this.ctx; const lv = this.curLevel();
    const bands = [['Eixo de valor', -300], ['Capacidades', -150],
      [lv.spineOnly ? '' : (lv.kind === 'to-be' ? 'Projeção operacional' : 'Operação atual'), 45], ['Sistemas & dados', 290]];
    ctx.save(); ctx.font = "500 10.5px 'IBM Plex Sans',sans-serif"; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = p.tinta; ctx.globalAlpha = 0.34;
    bands.forEach(([lbl, wy]) => { const s = this.w2s(this.cam.x, wy); ctx.fillText(lbl, this.W - 14, s.y); });
    ctx.restore();
  }
  // `lw` maior serve para desenhar o mesmo ícone como halo, por baixo
  drawAreaIcon(ctx, area, x, y, s, col, lw) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw || 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const key = (area || '').toLowerCase();
    if (/dire/.test(key)) { ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, s * 0.42, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 7); ctx.fill(); }
    else if (/document/.test(key)) { ctx.strokeRect(x - s * 0.62, y - s, s * 1.24, s * 2); [-0.4, 0, 0.4].forEach(f => { ctx.beginPath(); ctx.moveTo(x - s * 0.35, y + s * f); ctx.lineTo(x + s * 0.35, y + s * f); ctx.stroke(); }); }
    else if (/financ/.test(key)) { ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - s * 0.55); ctx.lineTo(x, y + s * 0.55); ctx.stroke(); }
    else if (/market/.test(key)) { ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.4); ctx.lineTo(x + s * 0.35, y - s); ctx.lineTo(x + s * 0.35, y + s); ctx.lineTo(x - s, y + s * 0.4); ctx.closePath(); ctx.stroke(); }
    else if (/opera/.test(key)) { ctx.beginPath(); ctx.arc(x, y, s * 0.55, 0, 7); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); } }
    else if (/pessoa/.test(key)) { ctx.beginPath(); ctx.arc(x, y - s * 0.35, s * 0.42, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + s * 0.95, s * 0.85, Math.PI * 1.18, Math.PI * 1.82); ctx.stroke(); }
    else if (/transform|digital/.test(key)) { ctx.beginPath(); ctx.moveTo(x + s * 0.35, y - s); ctx.lineTo(x - s * 0.55, y + s * 0.15); ctx.lineTo(x - s * 0.02, y + s * 0.15); ctx.lineTo(x - s * 0.35, y + s); ctx.lineTo(x + s * 0.55, y - s * 0.15); ctx.lineTo(x + s * 0.02, y - s * 0.15); ctx.closePath(); ctx.stroke(); }
    else if (/suprim|log/.test(key)) { ctx.strokeRect(x - s * 0.8, y - s * 0.62, s * 1.6, s * 1.3); ctx.beginPath(); ctx.moveTo(x - s * 0.8, y - s * 0.1); ctx.lineTo(x + s * 0.8, y - s * 0.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - s * 0.1); ctx.lineTo(x, y + s * 0.68); ctx.stroke(); }
    else if (/jur/.test(key)) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s * 0.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s * 0.85, y - s * 0.55); ctx.lineTo(x + s * 0.85, y - s * 0.55); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x, y, s * 0.85, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // Camada fora de tela para montar as nuvens: precisamos do `destination-out`
  // (que morde os nós estranhos) sem apagar o graticule que já está na prancha.
  _ensureCloudLayer() {
    if (!this._cloudEl) { this._cloudEl = document.createElement('canvas'); this._cloudCtx = this._cloudEl.getContext('2d'); }
    const el = this._cloudEl;
    if (el.width !== this.canvas.width || el.height !== this.canvas.height) { el.width = this.canvas.width; el.height = this.canvas.height; }
    return { el, ctx: this._cloudCtx };
  }
  // Retângulos de tela de cada célula visível, e por área: quem é membro e
  // quem é ESTRANHO (não pertence e cai por cima). O estranho vira mordida.
  _cloudGeom() {
    const z = this.cam.z;
    // Membros pelo ALVO (talpha), não pelo alpha animado: na troca de nível os
    // nós entram um a um conforme o alpha sobe passando de 0.05, e isso fazia o
    // casco crescer e o rótulo saltar a cada quadro (a "vibração"). Com o alvo,
    // a forma da nuvem já nasce final e fica firme enquanto os nós aparecem.
    const vis = this.visibleNodes().filter(n => (n.talpha == null ? n.alpha : n.talpha) > 0.05);
    // Posição SEM yoff/_boff: são animações de entrada, e a nuvem que as segue
    // treme as quinas a cada quadro na troca de nível — mesma regra do talpha,
    // a forma nasce final e os nós deslizam para dentro dela.
    const rect = n => {
      const s = this.w2s(n.x, n.y);
      return { id: n.id, cx: s.x, cy: s.y,
        hw: ((n._bw || this.nodeR(n) * 2) / 2) * z, hh: ((n._bh || this.nodeR(n) * 2) / 2) * z };
    };
    const rects = vis.map(rect);
    // A espinha (value-stage) E o modelo essencial (capacidades, invariantes)
    // NUNCA são mordidos: são OUTRO NÍVEL, não moram numa área — a aguada da
    // nuvem passa por baixo deles sem deixar buraco. Só os nós de PERIFERIA que
    // pertencem a OUTRA área (e cruzam esta) é que abrem o vão/dente.
    const semMordida = new Set(vis.filter(n => n.layer === 'essential' || n.type === 'value-stage').map(n => n.id));
    const areas = {};
    // Agrupa por TODAS as áreas do nó (areasOf): um nó que pertence a duas
    // áreas entra nas duas nuvens, então os cascos se sobrepõem e o nó
    // compartilhado cai na INTERSEÇÃO — a sobreposição é o sinal de "pertence
    // às duas". A espinha e o essencial não entram em nuvem; o essencial vira
    // mordida onde cruzar, mas a espinha (value-stage) passa por baixo intacta.
    vis.forEach((n, i) => {
      // A espinha (value-stage) e o modelo essencial NÃO entram nas nuvens —
      // eles vivem no eixo, não numa área. Ficam de fora e viram mordida onde
      // um casco passar por cima, para a espinha continuar legível. (Mesma
      // convenção da física em step(): área é coisa de realização/periferia.)
      if (n.layer === 'essential' || n.type === 'value-stage') return;
      this.areasOf(n).forEach(a => {
        (areas[a] = areas[a] || { members: [], ids: new Set(), aSum: 0 });
        areas[a].members.push(rects[i]); areas[a].ids.add(n.id);
        // opacidade da nuvem acompanha o alpha animado dos membros: a FORMA já
        // nasce final (talpha), mas a cor entra em fade junto com as caixas.
        areas[a].aSum += Math.min(1, n.alpha / 0.9);
      });
    });
    // Cada área vira um ou mais COMPONENTES ESPACIAIS (enclaves, como numa
    // carta): membros próximos formam uma bolha; um membro que mora longe —
    // tipicamente o nó de duas áreas, desenhado na coluna da outra — ganha uma
    // bolha satélite da mesma cor em volta de si, em vez de esticar o casco da
    // área através do mapa (era isso que criava as nuvens atravessadas).
    // A fusão é ANISOTRÓPICA, casada com o layout de colunas: estreita na
    // horizontal (MENOR que o vão entre colunas, GAP_COL = GAP_H·3.2 ≈ 147·
    // espaço — colunas vizinhas nunca fundem) e generosa na vertical (MAIOR
    // que o salto entre as faixas por tipo dentro da coluna — realizações e
    // problemas da mesma coluna ficam na mesma bolha, como na prancha).
    const espaco = this.state.spacing || 1;
    const MERGE_X = 120 * espaco * z, MERGE_Y = 760 * espaco * z;
    Object.keys(areas).forEach(a => {
      const A = areas[a];
      A.count = A.members.length;
      A.fade = Math.max(0, Math.min(1, A.aSum / Math.max(1, A.count)));
      A.clusters = this._spatialClusters(A.members, MERGE_X, MERGE_Y).map(members => {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        members.forEach(r => { x0 = Math.min(x0, r.cx - r.hw); y0 = Math.min(y0, r.cy - r.hh); x1 = Math.max(x1, r.cx + r.hw); y1 = Math.max(y1, r.cy + r.hh); });
        const pad = 70;
        // estranho = quem não é da ÁREA (outro enclave dela não morde o irmão)
        const foreign = rects.filter(r => !A.ids.has(r.id) && !semMordida.has(r.id)
          && r.cx + r.hw > x0 - pad && r.cx - r.hw < x1 + pad && r.cy + r.hh > y0 - pad && r.cy - r.hh < y1 + pad);
        return { members, foreign };
      });
    });
    return areas;
  }
  // Union-find por proximidade: dois retângulos caem no mesmo componente se a
  // folga borda-a-borda entre eles é menor que o limiar em CADA eixo. O que
  // sobra separado vira enclave — bolha própria, mesma cor, sem ponte
  // atravessando o vazio.
  _spatialClusters(members, mergeX, mergeY) {
    const n = members.length, pai = Array.from({ length: n }, (_, i) => i);
    const find = i => { while (pai[i] !== i) { pai[i] = pai[pai[i]]; i = pai[i]; } return i; };
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = members[i], b = members[j];
      const dx = Math.max(0, Math.abs(a.cx - b.cx) - a.hw - b.hw);
      const dy = Math.max(0, Math.abs(a.cy - b.cy) - a.hh - b.hh);
      if (dx < mergeX && dy < mergeY) pai[find(i)] = find(j);
    }
    const por = {};
    members.forEach((m, i) => { const r = find(i); (por[r] = por[r] || []).push(m); });
    return Object.values(por);
  }
  // Contorno ORGÂNICO de um enclave: varre o cluster em bandas horizontais e
  // abraça, banda a banda, só o que existe ali — cada linha de células com a
  // sua largura, em vez do casco convexo que fazia toda coluna virar uma
  // pílula uniforme. Nos vãos verticais (entre a faixa de realizações e o
  // problema lá embaixo) a nuvem ESTRANGULA numa cintura, como um istmo numa
  // carta; as pontas fecham em calota elíptica. O polígono sai denso e cru —
  // quem arredonda é o Chaikin do _dentBoundary, na sequência.
  _outlineOrganico(members, infl) {
    const PASSO = 14, CAP = 26;
    let y0 = 1e9, y1 = -1e9;
    members.forEach(m => { y0 = Math.min(y0, m.cy - m.hh); y1 = Math.max(y1, m.cy + m.hh); });
    y0 -= infl; y1 += infl;
    const bandas = [];
    const nB = Math.max(2, Math.ceil((y1 - y0) / PASSO));
    for (let i = 0; i <= nB; i++) {
      const y = y0 + (y1 - y0) * (i / nB);
      let l = 1e9, r = -1e9;
      members.forEach(m => {
        if (y < m.cy - m.hh - infl || y > m.cy + m.hh + infl) return;
        l = Math.min(l, m.cx - m.hw - infl); r = Math.max(r, m.cx + m.hw + infl);
      });
      bandas.push({ y, l, r, oca: r < l });
    }
    // vão entre linhas: interpola as bordas e aperta o meio — quanto maior o
    // vão, mais funda a cintura (sem nunca fechar a passagem de todo)
    for (let i = 0; i < bandas.length; i++) {
      if (!bandas[i].oca) continue;
      let p = i - 1; while (p >= 0 && bandas[p].oca) p--;
      let q = i; while (q < bandas.length && bandas[q].oca) q++;
      if (p < 0 || q >= bandas.length) { const v = bandas[p < 0 ? q : p]; bandas[i].l = v.l; bandas[i].r = v.r; continue; }
      const bp = bandas[p], bq = bandas[q], t = (i - p) / (q - p);
      const l = bp.l + (bq.l - bp.l) * t, r = bp.r + (bq.r - bp.r) * t;
      const gap = bq.y - bp.y;
      const pinch = Math.min(0.42, Math.max(0, (gap - 3 * PASSO) / 480) * 0.6);
      const cx = (l + r) / 2, w = Math.max(24, ((r - l) / 2) * (1 - pinch * Math.sin(Math.PI * t)));
      bandas[i].l = cx - w; bandas[i].r = cx + w;
    }
    // degrau entre linhas de larguras muito diferentes: relaxa as bordas para
    // FORA (média com as vizinhas, nunca por cima de uma caixa) — a transição
    // vira rampa em vez de quina
    for (let it = 0; it < 2; it++) {
      for (let i = 1; i < bandas.length - 1; i++) {
        bandas[i].l = Math.min(bandas[i].l, (bandas[i - 1].l + bandas[i + 1].l) / 2);
        bandas[i].r = Math.max(bandas[i].r, (bandas[i - 1].r + bandas[i + 1].r) / 2);
      }
    }
    // calotas elípticas nas pontas, para o topo e o pé fecharem redondos
    const calota = (base, dir) => {
      const out = [];
      for (let j = 1; j <= 3; j++) {
        const d = (CAP * j) / 3;
        const f = Math.sqrt(Math.max(0, 1 - (d / CAP) * (d / CAP)));
        const cx = (base.l + base.r) / 2, w = ((base.r - base.l) / 2) * (0.4 + 0.6 * f);
        out.push({ y: base.y + dir * d, l: cx - w, r: cx + w });
      }
      return out;
    };
    const todas = calota(bandas[0], -1).reverse().concat(bandas, calota(bandas[bandas.length - 1], 1));
    const poly = [];
    todas.forEach(b => poly.push([b.r, b.y]));
    for (let i = todas.length - 1; i >= 0; i--) poly.push([todas[i].l, todas[i].y]);
    return poly;
  }
  // subdivide um polígono em pontos ~a cada `passo` px, para o contorno poder
  // ser amassado ponto a ponto (o casco cru tem poucos vértices).
  _densify(hull, passo) {
    const out = [], n = hull.length;
    for (let i = 0; i < n; i++) {
      const a = hull[i], b = hull[(i + 1) % n];
      const seg = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / passo));
      for (let s = 0; s < seg; s++) { const t = s / seg; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  // Suavização de Chaikin (corta cantos): cada passada troca cada vértice por
  // dois pontos a 1/4 e 3/4 da aresta, arredondando dentes e o contorno todo.
  _chaikin(pts, iters) {
    let p = pts;
    for (let it = 0; it < iters; it++) {
      const q = [], n = p.length;
      for (let i = 0; i < n; i++) {
        const a = p[i], b = p[(i + 1) % n];
        q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      p = q;
    }
    return p;
  }
  // empurra para dentro (na direção do centro) cada ponto que caiu num obstáculo
  _projectOut(bnd, obst, ctr) {
    for (let k = 0; k < bnd.length; k++) {
      let px = bnd[k][0], py = bnd[k][1];
      for (const o of obst) {
        if (px <= o.minx || px >= o.maxx || py <= o.miny || py >= o.maxy) continue;
        let dx = ctr[0] - px, dy = ctr[1] - py; const dl = Math.hypot(dx, dy);
        if (dl < 1e-3) continue; dx /= dl; dy /= dl;
        let t = Infinity;
        if (dx > 1e-6) t = Math.min(t, (o.maxx - px) / dx); else if (dx < -1e-6) t = Math.min(t, (o.minx - px) / dx);
        if (dy > 1e-6) t = Math.min(t, (o.maxy - py) / dy); else if (dy < -1e-6) t = Math.min(t, (o.miny - py) / dy);
        if (t !== Infinity && t > 0) { px += dx * t; py += dy * t; }
      }
      bnd[k] = [px, py];
    }
    return bnd;
  }
  // "Amassa" o contorno: cada nó estranho que toca a borda empurra os pontos do
  // contorno PARA DENTRO (na direção do centro da área) até saírem do retângulo
  // do intruso — um dente côncavo que abraça o nó por fora. Densifica, empurra,
  // suaviza (Chaikin) e empurra de novo, para o dente ficar REDONDO em vez de
  // poligonal. Como é o mesmo contorno usado no preenchimento E no pontilhado,
  // os dois recuam juntos. Sem estranhos, só arredonda o casco todo.
  _dentBoundary(hull, foreign, pad, ctr) {
    if (!foreign.length) return this._chaikin(hull, 2);
    const obst = foreign.map(r => ({ minx: r.cx - r.hw - pad, maxx: r.cx + r.hw + pad, miny: r.cy - r.hh - pad, maxy: r.cy + r.hh + pad }));
    let bnd = this._densify(hull, 9);
    bnd = this._projectOut(bnd, obst, ctr);
    bnd = this._chaikin(bnd, 2);
    bnd = this._projectOut(bnd, obst, ctr);   // reafirma a folga depois de suavizar
    return bnd;
  }
  // contorno suave de um casco (mesma curva do casco antigo, uma nuvem só)
  smoothHull(ctx, h) {
    const n = h.length; if (n < 2) { ctx.beginPath(); return; }
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.beginPath(); const m0 = mid(h[n - 1], h[0]); ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const cur = h[i], nx = mid(h[i], h[(i + 1) % n]); ctx.quadraticCurveTo(cur[0], cur[1], nx[0], nx[1]); }
    ctx.closePath();
  }
  drawClouds(p) {
    this._areaShapes = []; this._rotulos = [];
    if (!this.state.showClouds && !this.state.activeArea) return;
    const geom = this._cloudGeom();
    const areasK = Object.keys(geom); if (!areasK.length) return;
    const ctx = this.ctx, dpr = this.dpr, z = this.cam.z;
    const off = this._ensureCloudLayer(), octx = off.ctx;
    // Uma área = um ou mais ENCLAVES (bolhas por componente espacial, vindas
    // de _cloudGeom): cada bolha é o casco coeso dos membros PRÓXIMOS entre si,
    // AMASSADO onde um nó estranho toca a borda (dente côncavo). O nó que mora
    // longe — coluna de outra área — ganha bolha satélite da mesma cor, e a
    // sobreposição dela com a nuvem hospedeira é o sinal de pertencimento
    // duplo. O rótulo vai só no enclave maior, com a contagem da área inteira.
    // INFL = raio de PERTENCIMENTO (quanto a nuvem estende além da caixa do
    // membro). MORDE = raio de AFASTAMENTO (quanto ela recua de um intruso).
    // Afastamento é de propósito MAIOR que pertencimento, para sobrar um vão de
    // papel entre onde acaba a área da célula e onde começa a área vizinha.
    const INFL_X = 18, MORDE = 26 + 6 * z;
    const rotulos = [];
    areasK.forEach(area => {
      // área desligada no menu de nuvens não desenha (a em foco sempre aparece)
      if (this.state.areaHidden[area] && this.state.activeArea !== area) return;
      const A = geom[area];
      const active = this.state.activeArea === area, dim = this.state.activeArea && !active;
      const fade = (A.fade == null ? 1 : A.fade) * this.state.cloudOp;
      const principal = A.clusters.reduce((m, c) => (c.members.length > m.members.length ? c : m), A.clusters[0]);
      A.clusters.forEach(cl => {
        let mcx = 0, mcy = 0;
        cl.members.forEach(r => { mcx += r.cx; mcy += r.cy; });
        mcx /= cl.members.length; mcy /= cl.members.length;
        const hull0 = this._outlineOrganico(cl.members, INFL_X);
        if (hull0.length < 3) return;
        // amassa o contorno em volta dos estranhos que tocam a borda
        const hull = this._dentBoundary(hull0, cl.foreign, MORDE, [mcx, mcy]);
        // estranhos que sobraram DENTRO do contorno amassado (intrusos no miolo)
        // ainda viram buraco; os de borda já saíram pelo dente.
        const dentro = cl.foreign.filter(r => C.pointInPoly(r.cx, r.cy, hull));
        // corpo na camada de fora: enche o contorno, fura só o miolo, colore
        octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, off.el.width, off.el.height);
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.globalCompositeOperation = 'source-over'; octx.fillStyle = '#fff';
        this.smoothHull(octx, hull); octx.fill();
        octx.globalCompositeOperation = 'destination-out';
        dentro.forEach(r => { this.roundRect(octx, r.cx - r.hw - MORDE, r.cy - r.hh - MORDE, (r.hw + MORDE) * 2, (r.hh + MORDE) * 2, 18); octx.fill(); });
        octx.globalCompositeOperation = 'source-in';
        octx.setTransform(1, 0, 0, 1, 0, 0);
        octx.fillStyle = this.areaTint(area); octx.fillRect(0, 0, off.el.width, off.el.height);
        octx.globalCompositeOperation = 'source-over';
        // Cada nuvem está no seu lugar agora, então a cor pode voltar a preencher
        // sem encardir — e a borda tracejada fecha a área como numa carta.
        const fillA = (active ? 0.24 : (dim ? 0.04 : 0.13)) * fade;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = fillA; ctx.drawImage(off.el, 0, 0); ctx.restore();
        ctx.save();
        ctx.globalAlpha = (active ? 0.8 : (dim ? 0.16 : 0.5)) * fade;
        ctx.strokeStyle = this.areaTintaRotulo(area); ctx.lineWidth = active ? 1.8 : 1.2;
        ctx.setLineDash(active ? [] : [8, 5]); this.smoothHull(ctx, hull); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        // Estranho ENCRAVADO no miolo (totalmente dentro de uma área que não é a
        // dele): além do buraco, um anel tracejado na cor da área fecha o vão como
        // um enclave numa carta — deixa claro que a célula não pertence ali.
        if (dentro.length) {
          ctx.save();
          ctx.globalAlpha = (active ? 0.7 : (dim ? 0.14 : 0.42)) * fade;
          ctx.strokeStyle = this.areaTintaRotulo(area); ctx.lineWidth = 1.1;
          ctx.setLineDash([5, 4]);
          dentro.forEach(r => { this.roundRect(ctx, r.cx - r.hw - MORDE, r.cy - r.hh - MORDE, (r.hw + MORDE) * 2, (r.hh + MORDE) * 2, 16); ctx.stroke(); });
          ctx.setLineDash([]); ctx.restore();
        }
        this._areaShapes.push({ area, hull, foreign: dentro, count: A.count });
        if (cl === principal) {
          let cx = 0, cy = 1e9; hull.forEach(pt => { cx += pt[0]; cy = Math.min(cy, pt[1]); }); cx /= hull.length;
          rotulos.push({ area, tint: this.areaTint(area), cx, y: cy - 8, n: A.count, active, dim, fade });
        }
      });
    });
    // Os rótulos NÃO são desenhados aqui: as nuvens ficam no fundo (a aguada),
    // mas o nome precisa ir por cima das arestas e dos nós — senão a formiga
    // marchante das ligações tracejadas passa por cima do texto e ele "pisca".
    // Guardamos a colocação e `drawAreaLabels` os pinta no fim do quadro.
    this._rotulos = rotulos;
  }
  // Rótulos das áreas, desenhados por ÚLTIMO (acima das arestas e dos nós) para
  // não serem apagados pela animação das ligações. Colocação gulosa, como num
  // mapa impresso: nuvens sobrepostas empilhariam os nomes, então quem colide
  // sobe até achar folga — e o nome nunca fica ilegível.
  drawAreaLabels(p) {
    const rotulos = this._rotulos; if (!rotulos || !rotulos.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "italic 600 13px 'Fraunces',Georgia,serif"; ctx.textBaseline = 'bottom';
    const ir = 6, gp = 7, ALT = 17;
    rotulos.forEach(r => { r.txt = r.area + ' · ' + r.n; r.w = ir * 2 + gp + ctx.measureText(r.txt).width; });
    rotulos.sort((a, b) => a.y - b.y || a.area.localeCompare(b.area));
    const postos = [];
    rotulos.forEach(r => {
      for (let i = 0; i < 30; i++) {
        const bate = postos.some(o => Math.abs(o.y - r.y) < ALT && Math.abs(o.cx - r.cx) < (o.w + r.w) / 2 + 10);
        if (!bate) break;
        r.y -= ALT;
      }
      postos.push(r);
      // Halo na cor do papel por baixo do nome — o mesmo recurso que uma carta
      // usa para o topônimo continuar legível sobre relevo, água ou malha.
      const tinta = this.areaTintaRotulo(r.area);
      const fade = r.fade == null ? 1 : r.fade;
      const sx = r.cx - r.w / 2, tx = sx + ir * 2 + gp;
      ctx.globalAlpha = (r.dim ? 0.3 : 0.85) * fade;
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.strokeStyle = p.papel; ctx.textAlign = 'left';
      ctx.strokeText(r.txt, tx, r.y);
      this.drawAreaIcon(ctx, r.area, sx + ir, r.y - 6, ir, p.papel, 3.6);
      ctx.globalAlpha = (r.active ? 1 : (r.dim ? 0.45 : 0.95)) * fade;
      ctx.fillStyle = tinta;
      this.drawAreaIcon(ctx, r.area, sx + ir, r.y - 6, ir, tinta);
      ctx.fillText(r.txt, tx, r.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // Todas as áreas cujo casco cobre o ponto — a PILHA de nuvens sob o mouse —
  // sem contar quem está em cima de uma mordida (nó estranho). Ordena da mais
  // específica (menos membros) para a mais ampla: a primeira é a "dona" do
  // clique, e a dica nomeia a pilha inteira.
  areasAtScreen(sx, sy) {
    if (!this._areaShapes) return [];
    const perto = (r, pad) => Math.abs(sx - r.cx) <= r.hw + pad && Math.abs(sy - r.cy) <= r.hh + pad;
    const pilha = {};
    this._areaShapes.forEach(A => {
      if (pilha[A.area] != null) return;
      if (!C.pointInPoly(sx, sy, A.hull)) return;
      if (A.foreign.some(r => perto(r, 6))) return;
      pilha[A.area] = A.count;
    });
    return Object.keys(pilha).sort((a, b) => pilha[a] - pilha[b] || a.localeCompare(b));
  }
  areaAtScreen(sx, sy) { return this.areasAtScreen(sx, sy)[0] || null; }
  drawMini() {
    const ctx = this.mini.getContext('2d'); const r = this.mini.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    if (this.mini.width !== r.width * dpr) { this.mini.width = r.width * dpr; this.mini.height = r.height * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const p = this.pal(); ctx.clearRect(0, 0, r.width, r.height); ctx.fillStyle = p.papel; ctx.fillRect(0, 0, r.width, r.height);
    const vis = this.visibleNodes(); if (!vis.length) return;
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    this.nodes.forEach(n => { a = Math.min(a, n.x); b = Math.min(b, n.y); c = Math.max(c, n.x); d = Math.max(d, n.y); });
    const pad = 40, w = c - a + pad * 2, h = d - b + pad * 2, sc = Math.min(r.width / w, r.height / h), ox = (r.width - w * sc) / 2, oy = (r.height - h * sc) / 2;
    const mx = x => ox + (x - a + pad) * sc, my = y => oy + (y - b + pad) * sc;
    vis.forEach(n => {
      const spine = n.type === 'value-stage'; ctx.globalAlpha = spine ? 0.95 : 0.66;
      ctx.fillStyle = this.state.selected === n.id ? p.sinal : n.layer === 'problem' ? p.perigo
        : spine ? p.tinta : this.convCor(this.groupOf(n));
      ctx.beginPath(); ctx.arc(mx(n.x), my(n.y), spine ? 2.6 : 1.7, 0, 7); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.strokeStyle = p.sinal; ctx.lineWidth = 1;
    const tl = this.s2w(0, 0), br = this.s2w(this.W, this.H);
    ctx.strokeRect(mx(tl.x), my(tl.y), (br.x - tl.x) * sc, (br.y - tl.y) * sc);
    this._miniT = { a, b, pad, sc, ox, oy };
  }

  // ---- editor (pré-visualização do arquivo de autoria — formato Guia §5–§6) ----
  genMarkdown(n) {
    const wl = (id, name) => `"[[${id}|${name}]]"`;
    let fm = `---\nid: ${n.id}\ntype: ${n.contractType}\n`;
    if (n.spineKind) fm += `spine_kind: ${n.spineKind}\n`;
    fm += `status: ${n.status}\n`;
    if (n.confidence) fm += `confidence: ${n.confidence}\n`;
    if (n.areas && n.areas.length) fm += `areas:\n` + n.areas.map((id, i) => `  - ${wl(id, n.areaNames[i] || id)}`).join('\n') + '\n';
    if (n.scenarios !== 'all') fm += `scenarios:\n` + n.scenarios.map(id => `  - ${wl(id, this.g.docName(id))}`).join('\n') + '\n';
    fm += `---\n`;
    const rels = n.relations.map(r => `- \`${r.type}\` → [[${r.target}|${r.targetName || r.target}]]`).join('\n');
    return `${fm}\n# ${n.name}\n\n## Definição\n\n${n.def || '(a escrever)'}\n\n## Relações\n\n${rels || '- (nenhuma declarada)'}\n`;
  }

  // ---- abrir outro mapa -------------------------------------------------
  // O visualizador é ferramenta, não o leitor de um mapa só: qualquer
  // graph.json válido abre aqui. Trocar de mapa recarrega a página com outro
  // `?graph=` — estado de prancha é por mapa, e recarregar é o jeito honesto
  // de zerar câmera, trilha e níveis.
  async listarGrafos() {
    const lista = this.$('abrir-lista');
    lista.innerHTML = '<div style="padding:10px 12px; font-size:11.5px; opacity:.6;">procurando…</div>';
    this.$('abrir-modo').textContent = this._modo === 'desktop' ? 'desktop' : 'navegador';
    // no desktop escolhe-se a PASTA da documentação (o Python compila o que
    // faltar); no navegador não há compilador, então só resta o arquivo pronto
    this.$('btn-escolher').textContent =
      this._modo === 'desktop' ? 'Escolher pasta do mapa…' : 'Escolher arquivo…';
    let grafos = [];
    try { grafos = await NotocordaBridge.grafosDisponiveis(); } catch (e) { grafos = []; }
    const atual = (this.graphUrl || '').replace(/^\.\.\//, '');
    lista.innerHTML = grafos.length ? grafos.map(g => {
      const resumo = g.erro ? g.erro : `${g.nos} nós · ${g.etapas || 0} etapas`;
      return `<button class="abrir-row ${g.caminho === atual ? 'atual' : ''}" data-act="abrir-grafo"
        data-caminho="${this.esc(g.caminho)}" data-nome="${this.esc(g.nome || '')}">
        <span style="flex:1; min-width:0;">
          <span class="abrir-nome">${this.esc(g.nome || g.caminho)}</span>
          <span class="abrir-cam">${this.esc(g.caminho)}</span>
        </span>
        <span class="abrir-meta">${this.esc(resumo)}</span></button>`;
    }).join('') : '<div style="padding:10px 12px; font-size:11.5px; opacity:.6;">nenhum graph.json encontrado por aqui — use "Escolher arquivo…".</div>';
  }
  async escolherArquivo() {
    const r = await NotocordaBridge.escolherGrafo();
    if (!r || r.cancelado) return;
    if (!r.ok) { this.aviso(r.erro || 'não consegui abrir o arquivo'); return; }
    if (r.relativo) { this.trocarGrafo({ url: '../' + r.relativo, org: r.nome }); return; }
    // arquivo de fora da raiz servida (ou do navegador): viaja pela sessão
    try {
      sessionStorage.setItem('notocorda.grafo', JSON.stringify(r.conteudo));
      sessionStorage.setItem('notocorda.grafo.origem', r.caminho || r.nome || 'arquivo');
    } catch (e) { this.aviso('grafo grande demais para a sessão do navegador'); return; }
    this.trocarGrafo({ url: 'session:', org: r.nome });
  }
  trocarGrafo({ url, org }) {
    const qs = new URLSearchParams(location.search);
    qs.set('graph', url);
    if (org) qs.set('org', org);
    qs.delete('level'); qs.delete('view'); qs.delete('trilha');
    qs.set('paleta', this.state.palette);
    location.assign(location.pathname + '?' + qs.toString());
  }

  // abre o arquivo de autoria no editor do sistema (só no desktop; na web a
  // ponte devolve erro e o rodapé avisa)
  async abrirFonte(caminho) {
    if (!caminho) { this.aviso('esta célula não declara arquivo-fonte'); return; }
    const r = await NotocordaBridge.abrirDocumento(caminho);
    this.aviso(r && r.ok ? 'abrindo ' + r.caminho : (r && r.erro) || 'não consegui abrir o arquivo');
  }

  // ---- DOM ----
  $(id) { return document.getElementById(id); }
  initDom() {
    this.root = this.$('app'); this.graphEl = this.$('board'); this.canvas = this.$('canvas'); this.mini = null;
    this.$('org-name').textContent = this.orgName;
    // Salvar view: no desktop grava em views/; no navegador, baixa o arquivo.
    // Posição é sempre da view, nunca do documento de negócio (CONTRATO §3.7).
    this.$('btn-save-view').addEventListener('click', async () => {
      const v = C.exportView(this.g, 'view.' + this.orgName.toLowerCase(), 'Prancha ' + this.orgName);
      const r = await NotocordaBridge.salvarView(v);
      if (r && r.ok) this.aviso((r.baixado ? 'view baixada: ' : 'view salva em ') + r.caminho);
      else this.aviso('não consegui salvar a view' + (r && r.erro ? ': ' + r.erro : ''));
    });
    NotocordaBridge.pronta().then(modo => { this._modo = modo; });
    // Arrastar a nota pelo cabeçalho. A posição é escrita direto no elemento
    // durante o gesto (sem re-render) e só vai para o estado ao soltar.
    this.$('cards-layer').addEventListener('mousedown', ev => {
      const alvo = ev.target.closest('.nota');
      // tocar numa nota da pilha já a traz para a frente, mesmo sem arrastar
      if (alvo) {
        this.$('cards-layer').querySelectorAll('.nota').forEach(el => { if (el !== alvo) el.style.zIndex = 30; });
        alvo.style.zIndex = 60;
      }
      const alca = ev.target.closest('[data-drag]'); if (!alca) return;
      if (ev.target.closest('button')) return;
      const nota = alca.closest('.nota'); if (!nota) return;
      ev.preventDefault();
      const r = nota.getBoundingClientRect(), pai = this.graphEl.getBoundingClientRect();
      this._notaDrag = { id: alca.dataset.drag, el: nota, dx: ev.clientX - r.left, dy: ev.clientY - r.top, pai };
      // a nota que se pega vem para cima da pilha
      this.$('cards-layer').querySelectorAll('.nota').forEach(el => { el.style.zIndex = 30; });
      nota.style.zIndex = 60;
    });
    window.addEventListener('mousemove', ev => {
      const d = this._notaDrag; if (!d) return;
      const x = Math.max(-40, Math.min(d.pai.width - 80, ev.clientX - d.pai.left - d.dx));
      const y = Math.max(0, Math.min(d.pai.height - 40, ev.clientY - d.pai.top - d.dy));
      d.el.style.left = x + 'px'; d.el.style.top = y + 'px';
      d._fim = { x, y };
    });
    window.addEventListener('mouseup', () => {
      const d = this._notaDrag; if (!d) return;
      this._notaDrag = null;
      if (d._fim) this.state.cardPos = { ...this.state.cardPos, [d.id]: d._fim };
    });
    this.$('btn-palette').addEventListener('click', () => {
      const keys = Object.keys(PALETTES); const i = keys.indexOf(this.state.palette);
      this.setState({ palette: keys[(i + 1) % keys.length] }); this.applyTheme();
    });
    document.body.addEventListener('click', e => {
      if (this.state.abrirOpen && !e.target.closest('#abrir-menu')
        && !e.target.closest('[data-act="toggle-abrir"]')) this.setState({ abrirOpen: false });
      const el = e.target.closest('[data-act]'); if (!el) return;
      this.dispatch(el.dataset.act, el.dataset);
    });
    document.body.addEventListener('dblclick', e => {
      const el = e.target.closest('[data-dbl]'); if (!el) return;
      this.dispatch(el.dataset.dbl, el.dataset);
    });
    this.$('index-search').addEventListener('input', e => this.setState({ search: e.target.value }));
    // Passar o olho pelo verbete do índice já acende a célula na prancha — é o
    // que liga as duas metades da página.
    this.$('index-groups').addEventListener('mouseover', e => {
      const el = e.target.closest('.ig-item[data-id]'); if (!el) return;
      this.hoverId = el.dataset.id;
    });
    this.$('index-groups').addEventListener('mouseleave', () => {
      if (!this.state.selected) this.hoverId = null;
    });
    const rngSpacing = this.$('rng-spacing');
    if (rngSpacing) rngSpacing.addEventListener('input', e => {
      this.state.spacing = parseFloat(e.target.value);
      C.computeLayout(this.g, { spacing: this.state.spacing });
      this.nodes.forEach(n => { if (n.layer === 'essential') { n.x = n.homeX; n.y = n.homeY; } });
      this.assentar(40); this.renderUI();
    });
    ['density', 'spineOp', 'repulsao', 'cloudOp', 'curOp', 'edgeOp', 'edgeW', 'gridOp'].forEach(k => {
      const el = this.$('rng-' + k); if (el) el.addEventListener('input', e => this.setState({ [k]: parseFloat(e.target.value) }));
    });
    // navegar clicando no mapa de situação (antes era um onclick no HTML)
    this.$('minimap').addEventListener('click', ev => {
      if (!this._miniT) return;
      const r = ev.currentTarget.getBoundingClientRect(), { a, b, pad, sc, ox, oy } = this._miniT;
      this.cam.x = (ev.clientX - r.left - ox) / sc + a - pad;
      this.cam.y = (ev.clientY - r.top - oy) / sc + b - pad;
    });
    this.$('editor-text').addEventListener('input', e => { this.state.editorText = e.target.value; });
  }
  dispatch(act, d) {
    const st = this.state;
    switch (act) {
      case 'toggle-index': this.setState({ indexCollapsed: !st.indexCollapsed }); break;
      case 'toggle-inspector': this.setState({ inspectorCollapsed: !st.inspectorCollapsed }); break;
      case 'toggle-group': this.setState({ openGroups: { ...st.openGroups, [d.key]: !st.openGroups[d.key] } }); break;
      case 'toggle-vis': this.setState({ vis: { ...st.vis, [d.key]: !st.vis[d.key] } }); break;
      case 'focus-node': this.focusNode(d.id); break;
      case 'push-card': this.pushCard(d.id); break;
      case 'close-card': this.closeCard(d.id); break;
      case 'open-source': this.abrirFonte(d.path); break;
      case 'open-file': this.focusNode(d.id); this.setState({ editorOpen: true, editorNode: d.id, editorText: this.genMarkdown(this.map[d.id]) }); break;
      case 'set-level': this.setLevel(parseInt(d.idx, 10)); break;
      case 'set-mode': this.setState({ readingMode: d.mode }); break;
      case 'set-tool':
        this.setState({ tool: d.tool });
        this.canvas.style.cursor = d.tool === 'select' ? 'crosshair' : 'grab';
        break;
      case 'set-visual': this.setState({ visual: d.visual }); break;
      case 'set-depth': this.setState({ depth: parseInt(d.depth, 10) }); break;
      case 'toggle-compare': this.setState({ compare: !st.compare }); break;
      case 'toggle-fine': this.setState({ fineOpen: !st.fineOpen }); break;
      case 'toggle-aparencia': this.setState({ aparenciaOpen: !st.aparenciaOpen }); break;
      case 'reset-aparencia': {
        this.setState({ cloudOp: 1, curOp: 1, spineOp: 0.4, edgeOp: 1, edgeW: 1, gridOp: 1 });
        ['cloudOp:1', 'curOp:1', 'spineOp:0.4', 'edgeOp:1', 'edgeW:1', 'gridOp:1'].forEach(kv => {
          const [k, v] = kv.split(':'); const el = this.$('rng-' + k); if (el) el.value = v;
        });
        break;
      }
      case 'toggle-abrir': this.setState({ abrirOpen: !st.abrirOpen }); if (this.state.abrirOpen) this.listarGrafos(); break;
      case 'abrir-grafo': this.trocarGrafo({ url: '../' + d.caminho, org: d.nome }); break;
      case 'escolher-arquivo': this.escolherArquivo(); break;
      case 'toggle-area-panel': this.setState({ areaPanel: !st.areaPanel }); break;
      case 'toggle-area-cloud': {
        // se estava tudo ligado e o mestre é showClouds, garante o mestre on
        const h = { ...st.areaHidden, [d.area]: !st.areaHidden[d.area] };
        this.setState({ areaHidden: h, showClouds: true });
        break;
      }
      case 'toggle-clouds-all': {
        const areas = this.areaList();
        const todasOn = st.showClouds && areas.every(a => !st.areaHidden[a.name]);
        this.setState({ showClouds: true, areaHidden: todasOn ? Object.fromEntries(areas.map(a => [a.name, true])) : {} });
        break;
      }
      case 'select-area': this.setState({ areaPanel: true, activeArea: st.activeArea === d.area ? null : d.area }); break;
      case 'clear-selection': this.clearSelection(); break;
      case 'clear-edge': this.setState({ edgeSentence: null }); break;
      case 'open-editor': {
        const id = d.id || st.selected;
        if (id && this.map[id]) this.setState({ editorOpen: true, editorNode: id, editorText: this.genMarkdown(this.map[id]) });
        break;
      }
      case 'close-editor': this.setState({ editorOpen: false }); break;
      case 'reveal': { const n = this.map[d.id]; if (n) this.revealGroup(n, d.group); break; }
      case 'zoom-in': this.cam.z = Math.min(3.4, this.cam.z * 1.2); break;
      case 'zoom-out': this.cam.z = Math.max(0.2, this.cam.z / 1.2); break;
      case 'fit': this.fitView(); break;
    }
  }
  applyTheme() {
    const p = this.pal(), s = document.documentElement.style;
    const tok = {
      '--margem': p.margem, '--margem-2': p.margem2, '--margem-3': p.margem3,
      '--tinta-margem': p.text, '--muted': p.muted, '--hairline': p.hairline,
      '--papel': p.papel, '--papel-2': p.papel2, '--tinta': p.tinta, '--traco': p.traco, '--graticule': p.grid,
      '--sinal': p.sinal, '--sinal-m': p.sinalM, '--perigo': p.perigo,
    };
    CONV_GRUPOS.forEach(([g]) => { tok['--conv-' + g] = p.convUI[g]; });
    Object.keys(tok).forEach(k => s.setProperty(k, tok[k]));
  }
  setupCanvas() {
    this.ctx = this.canvas.getContext('2d');
    const resize = () => {
      const r = this.graphEl.getBoundingClientRect();
      this.dpr = window.devicePixelRatio || 1; this.W = r.width; this.H = r.height;
      this.canvas.width = r.width * this.dpr; this.canvas.height = r.height * this.dpr;
      this.canvas.style.width = r.width + 'px'; this.canvas.style.height = r.height + 'px';
    };
    resize(); new ResizeObserver(resize).observe(this.graphEl);
    setTimeout(() => this.fitView(), 60);
  }
  esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // ---- notas da trilha ------------------------------------------------
  // Cada célula aberta ganha uma nota sobre a prancha. Abrir uma relação de
  // dentro de uma nota empilha a próxima em cascata: a trilha é o caminho de
  // leitura, e ela aparece realçada no mapa (ver drawNode/draw).
  cardW() { return Math.min(496, Math.max(320, this.W - 60)); }
  cardH() { return Math.min(620, Math.max(220, this.H - 60)); }
  // Cascata a partir do centro-esquerda da folha: começa depois da caixa de
  // convenções (para não cobri-la) e desce à direita, deixando à mostra a
  // lombada de cada nota anterior — é a trilha ficando visível.
  cardPos(id, i) {
    const salvo = this.state.cardPos[id]; if (salvo) return salvo;
    const x0 = this.W > 760 ? 214 : 16;
    return { x: Math.min(x0 + i * 58, Math.max(16, this.W - 130)), y: Math.min(18 + i * 32, Math.max(18, this.H - 120)) };
  }
  renderCards() {
    const esc = this.esc, layer = this.$('cards-layer');
    const trilha = this.state.trilha.filter(id => this.map[id]);
    if (!trilha.length) { layer.innerHTML = ''; return; }
    const w = this.cardW(), h = this.cardH();
    layer.innerHTML = trilha.map((id, i) => {
      const n = this.map[id], grupo = this.groupOf(n), cor = this.convCor(grupo);
      const pos = this.cardPos(id, i), entradas = this.edges.filter(e => e.target === n.id);
      const anterior = i > 0 ? this.map[trilha[i - 1]] : null;
      const saidas = n.relations.map(r =>
        `<button class="rel-row" data-act="push-card" data-id="${r.target}" data-de="${n.id}">
          <span class="rel-verb" style="background:${cor}26;color:${cor}">${C.REL_VERBS[r.type] || r.type}</span>
          <span class="rel-name">${esc(r.targetName || r.target)}</span></button>`).join('')
        || '<span class="none-lbl">— nenhuma</span>';
      const entrando = entradas.map(e => {
        const src = this.map[e.source]; if (!src) return '';
        return `<button class="rel-row" data-act="push-card" data-id="${e.source}" data-de="${n.id}">
          <span class="rel-name" style="flex:1">${esc(src.name)}</span>
          <span class="rel-verb-in">${C.REL_VERBS[e.type] || e.type}</span></button>`;
      }).join('') || '<span class="none-lbl">— nenhuma</span>';
      return `<article class="nota" data-card="${n.id}" style="left:${pos.x}px; top:${pos.y}px; width:${w}px; max-height:${h}px; z-index:${30 + i}; border-top:3px solid ${cor}">
        <header class="nota-hdr" data-drag="${n.id}">
          <span class="conv conv-${grupo}" style="color:${cor}"></span>
          <span class="mono nota-tipo" style="color:${cor}">${esc(C.TYPE_LABELS[n.type] || n.type)}</span>
          <span class="mono nota-camada">· ${esc(C.LAYER_LABELS[n.layer] || n.layer)}</span>
          <span class="nota-ord">${i + 1}/${trilha.length}</span>
          <button class="collapse-btn" data-act="close-card" data-id="${n.id}" title="Fechar esta nota"
            style="border-color:var(--traco); color:var(--tinta); font-size:15px; line-height:1;">×</button>
        </header>
        ${anterior ? `<div class="nota-trilha">↳ vindo de <span style="opacity:.9">${esc(anterior.name)}</span></div>` : ''}
        <h2 class="display nota-nome">${esc(n.name)}</h2>
        <div class="nota-corpo">
          <div style="padding:8px 14px 12px; font-size:13px; line-height:1.55;">${esc(n.def || '— sem definição escrita')}</div>
          <div style="padding:0 14px 12px; display:flex; flex-wrap:wrap; gap:6px;">
            <span class="card-chip"><span class="st-dot" style="background:${this.statusCor(n.status)}"></span> ${esc(n.status)}</span>
            <span class="card-chip">${esc(C.CONFIDENCE_LABELS[n.confidence] || n.confidence || 'sem confiança')}</span>
            <span class="card-chip">${n.relations.length} saída · ${entradas.length} entrada</span>
          </div>
          <div style="padding:0 14px;">
            ${n.areaNames && n.areaNames.length && n.layer !== 'essential' && n.type !== 'value-stage' ? `<div class="card-sec">Áreas</div>
            <div style="margin-bottom:12px; display:flex; flex-direction:column; gap:5px;">
              ${n.areaNames.map(a => `<span style="display:flex; align-items:center; gap:8px; font-size:12.5px;">
                <span style="width:10px; height:10px; border-radius:6px; flex:none; background:${this.areaTint(a, true)}"></span>
                <span class="hidro">${esc(a)}</span></span>`).join('')}
            </div>` : ''}
            <div class="card-sec">Relações de saída</div>
            <div style="margin-bottom:12px;">${saidas}</div>
            <div class="card-sec">Relações de entrada</div>
            <div style="margin-bottom:12px;">${entrando}</div>
            <div class="card-sec">Arquivo-fonte</div>
            <button class="mono" data-act="open-source" data-path="${esc(n.sourcePath || '')}"
              style="width:100%; text-align:left; font-size:10.5px; color:var(--tinta); opacity:.75; background:transparent; border:1px solid var(--traco); border-radius:2px; padding:7px 9px; cursor:pointer; word-break:break-all;">${esc(n.sourcePath || '—')}</button>
            <button data-act="open-editor" data-id="${n.id}"
              style="width:100%; margin:10px 0 4px; padding:9px; border:1px solid var(--tinta); border-radius:2px; background:transparent; color:var(--tinta); cursor:pointer; font-size:12.5px; font-weight:500;">Abrir documento →</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }
  // recado curto no rodapé; volta sozinho ao estado normal
  aviso(msg) {
    const el = this.$('foot-path'); if (!el) return;
    el.textContent = msg;
    clearTimeout(this._avisoT);
    this._avisoT = setTimeout(() => this.renderUI(), 4500);
  }

  renderUI() {
    const st = this.state, p = this.pal(), esc = this.esc;
    const lv = this.curLevel();
    // header
    const selN = st.selected ? this.map[st.selected] : null;
    this.$('breadcrumb').textContent = `Prancha ${lv.name.toLowerCase()} · nível ${(lv.n > 0 ? '+' : '') + lv.n}`
      + (selN ? `  ›  ${this.spineRegionOf(selN)}` : '');

    // --- índice de topônimos: uma seção por convenção, verbete + caminho ---
    this.$('index-aside').style.display = st.indexCollapsed ? 'none' : 'flex';
    this.$('index-rail').style.display = st.indexCollapsed ? 'flex' : 'none';
    const asIsIds = new Set(this.levels.filter(l => l.n < 0).map(l => l.scenId));
    const search = st.search.trim().toLowerCase();
    const match = n => !search || n.name.toLowerCase().includes(search) || n.id.includes(search);
    const groupsDef = [
      { key: 'espinha', title: 'Espinha', g: 'essencial', match: n => n.type === 'value-stage' || n.type === 'objective' },
      { key: 'capacidades', title: 'Capacidades & regras', g: 'essencial', match: n => n.layer === 'essential' && n.type !== 'value-stage' && n.type !== 'objective' },
      { key: 'atual', title: 'Operação atual', g: 'realizacao', match: n => n.layer === 'operational' && n.scenarios !== 'all' && n.scenarios.some(s => asIsIds.has(s)) },
      { key: 'tobe', title: 'Projeções To-Be', g: 'realizacao', match: n => n.layer === 'operational' && n.scenarios !== 'all' && !n.scenarios.some(s => asIsIds.has(s)) },
      { key: 'sistemas', title: 'Sistemas', g: 'sistemas', match: n => n.layer === 'implementation' && n.type !== 'data-asset' },
      { key: 'dados', title: 'Dados', g: 'dados', match: n => n.type === 'data-asset' },
      { key: 'evidencias', title: 'Evidências', g: 'evidencias', match: n => n.layer === 'evidence' },
      { key: 'problemas', title: 'Problemas', g: 'problemas', match: n => n.layer === 'problem' },
    ];
    let idx = '';
    groupsDef.forEach(gd => {
      const items = this.nodes.filter(n => gd.match(n) && match(n)); if (!items.length && search) return;
      const open = st.openGroups[gd.key] || !!search;
      const alert = items.some(n => n.status === 'proposed' || n.layer === 'problem');
      idx += `<div class="ig"><button class="ig-head" data-act="toggle-group" data-key="${gd.key}">
        <span class="caret" style="transform:rotate(${open ? 90 : 0}deg)">▸</span>${this.convGlifo(gd.g, true)}
        <span class="ig-title">${esc(gd.title)}</span>${alert ? '<span class="dot-alert"></span>' : ''}
        <span class="leaders"></span><span class="mono-count">${items.length}</span></button>`;
      if (open) {
        idx += '<div>';
        items.forEach(n => {
          idx += `<button class="ig-item ${st.selected === n.id ? 'sel' : ''}" data-act="focus-node" data-dbl="open-file" data-id="${n.id}">
            <span class="st-dot" style="background:${this.statusCor(n.status, true)}"></span>
            <span class="ig-item-txt"><span class="ig-item-title">${esc(n.name)}</span>
            <span class="ig-item-meta">${esc(n.sourcePath || n.id)}</span></span></button>`;
        });
        idx += '</div>';
      }
      idx += '</div>';
    });
    const areas = this.allAreas();
    if (areas.length) {
      const open = st.openGroups.areas;
      idx += `<div class="ig"><button class="ig-head" data-act="toggle-group" data-key="areas">
        <span class="caret" style="transform:rotate(${open ? 90 : 0}deg)">▸</span>
        <span class="conv" style="width:12px;height:12px;border:1px dashed var(--muted);border-radius:7px"></span>
        <span class="ig-title">Áreas</span><span class="leaders"></span><span class="mono-count">${areas.length}</span></button>`;
      if (open) {
        idx += '<div>';
        areas.forEach(a => {
          idx += `<button class="ig-item ${st.activeArea === a ? 'sel' : ''}" data-act="select-area" data-area="${esc(a)}">
            <span class="st-dot" style="background:${this.areaTint(a, true)}"></span>
            <span class="ig-item-txt"><span class="ig-item-title hidro">${esc(a)}</span></span></button>`;
        });
        idx += '</div>';
      }
      idx += '</div>';
    }
    this.$('index-groups').innerHTML = idx;

    // --- caixa de convenções: a mesma peça na prancha (só leitura de contagem)
    // e na mesa de instrumentos (interativa, com o interruptor de cada camada).
    const gcount = {};
    this.nodes.forEach(n => { if (this.inScenario(n)) gcount[this.groupOf(n)] = (gcount[this.groupOf(n)] || 0) + 1; });
    this.$('legend-box-rows').innerHTML = CONV_GRUPOS.map(([g, name]) => `
      <button class="leg-row ${st.vis[g] ? '' : 'off'}" data-act="toggle-vis" data-key="${g}">
        ${this.convGlifo(g)}<span class="leg-name">${name}</span>
        <span class="mono-count">${gcount[g] || 0}</span>
      </button>`).join('');
    this.$('insp-legend').innerHTML = CONV_GRUPOS.map(([g, name]) => `
      <button class="conv-row ${st.vis[g] ? '' : 'off'}" data-act="toggle-vis" data-key="${g}"
        aria-pressed="${!!st.vis[g]}" title="${st.vis[g] ? 'Ocultar' : 'Mostrar'} ${name.toLowerCase()}">
        ${this.convGlifo(g, true)}<span class="conv-nome">${name}</span>
        <span class="mono-count">${gcount[g] || 0}</span><span class="conv-tog">${st.vis[g] ? '●' : '○'}</span>
      </button>`).join('');

    // nuvens de área: uma linha por área, mesmo interruptor das camadas. A
    // nuvem "ligada" é a que aparece na prancha; desligar tira só a mancha.
    const areasN = this.areaList();
    this.$('insp-clouds-bloco').style.display = areasN.length ? 'block' : 'none';
    if (areasN.length) {
      const on = a => st.showClouds && !st.areaHidden[a];
      this.$('insp-clouds').innerHTML = areasN.map(a => `
        <button class="conv-row ${on(a.name) ? '' : 'off'}" data-act="toggle-area-cloud" data-area="${esc(a.name)}"
          aria-pressed="${on(a.name)}" title="${on(a.name) ? 'Ocultar' : 'Mostrar'} a nuvem de ${a.name.toLowerCase()}">
          <span style="width:11px; height:11px; border-radius:6px; flex:none; background:${this.areaTint(a.name, true)}; opacity:${on(a.name) ? 1 : .35}"></span>
          <span class="conv-nome hidro">${esc(a.name)}</span>
          <span class="mono-count">${a.count}</span><span class="conv-tog">${on(a.name) ? '●' : '○'}</span>
        </button>`).join('');
      const todasOn = st.showClouds && areasN.every(a => !st.areaHidden[a.name]);
      const tog = this.$('clouds-all-tog'); if (tog) tog.textContent = todasOn ? 'todas ●' : 'todas ○';
    }

    // barra de níveis (To-Be no topo)
    let lb = '';
    this.levels.slice().reverse().forEach(l => {
      const i = this.levels.indexOf(l);
      lb += `<button class="lvl-row ${i === st.levelIdx ? 'sel' : ''}" data-act="set-level" data-idx="${i}">
        <span class="lvl-badge">${l.n > 0 ? '+' + l.n : l.n}</span>
        <span class="lvl-name">${esc(l.name)}</span></button>`;
    });
    this.$('level-bar-rows').innerHTML = lb;

    // painel de áreas — nome em itálico, como a hidrografia de uma carta
    this.$('area-panel').style.display = st.areaPanel && this.areaList().length ? 'block' : 'none';
    this.$('area-panel-rows').innerHTML = this.areaList().map(a => `
      <button class="lvl-row ${st.activeArea === a.name ? 'sel' : ''}" data-act="select-area" data-area="${esc(a.name)}">
        <span class="st-dot" style="background:${this.areaTint(a.name)}"></span>
        <span class="lvl-name hidro">${esc(a.name)}</span><span class="mono-count">${a.count}</span></button>`).join('');

    // sentença de aresta
    const es = st.edgeSentence;
    this.$('edge-sentence').style.display = es ? 'flex' : 'none';
    if (es) {
      this.$('edge-src').textContent = es.src; this.$('edge-verb').textContent = es.verb; this.$('edge-dst').textContent = es.dst;
    }

    // editor
    this.$('editor-panel').style.display = st.editorOpen ? 'flex' : 'none';
    if (st.editorOpen && st.editorNode && this.map[st.editorNode]) {
      const n = this.map[st.editorNode];
      this.$('editor-title').textContent = n.name;
      this.$('editor-status').style.background = this.statusCor(n.status);
      this.$('editor-path').textContent = n.sourcePath || n.id;
      if (this.$('editor-text').value !== st.editorText) this.$('editor-text').value = st.editorText;
    }

    this.$('abrir-menu').style.display = st.abrirOpen ? 'block' : 'none';

    // --- mesa de instrumentos ---
    this.$('inspector-aside').style.display = st.inspectorCollapsed ? 'none' : 'flex';
    this.$('inspector-rail').style.display = st.inspectorCollapsed ? 'flex' : 'none';
    // O detalhe da célula mora no cartão flutuante (independente deste painel),
    // então aqui fica sempre a configuração da prancha.
    this.$('btn-clear-sel').style.display = 'none';
    this.renderCards();
    this.$('visual-btns').innerHTML = [['prancha', 'Prancha'], ['grafo', 'Grafo']].map(([k, l]) =>
      `<button class="seg ${st.visual === k ? 'sel' : ''}" data-act="set-visual" data-visual="${k}">${l}</button>`).join('');
    this.$('tool-btns').innerHTML = [['pan', 'Navegar'], ['select', 'Selecionar']].map(([k, l]) =>
      `<button class="seg ${st.tool === k ? 'sel' : ''}" data-act="set-tool" data-tool="${k}">${l}</button>`).join('');
    this.$('mode-btns').innerHTML = [['completo', 'Completo'], ['vizinhanca', 'Vizinhança']].map(([k, l]) =>
      `<button class="seg ${st.readingMode === k ? 'sel' : ''}" data-act="set-mode" data-mode="${k}">${l}</button>`).join('');
    this.$('depth-btns').innerHTML = [1, 2, 3].map(d =>
      `<button class="seg ${st.depth === d ? 'sel' : ''}" data-act="set-depth" data-depth="${d}">${d}</button>`).join('');
    // O recorte de vizinhança precisa de uma célula escolhida — sem ela o modo
    // não teria o que recortar, e o painel explica em vez de parecer quebrado.
    const hint = this.$('mode-hint');
    if (hint) {
      const semSel = st.readingMode === 'vizinhanca' && !st.selected;
      hint.style.display = semSel ? 'block' : 'none';
      if (semSel) hint.textContent = 'Clique numa célula: o mapa recorta só a vizinhança dela, no raio de passos escolhido (1–3).';
    }
    const cmpAvail = lv.kind === 'to-be' && lv.baseline;
    this.$('compare-sec').style.display = cmpAvail ? 'block' : 'none';
    if (cmpAvail) {
      this.$('btn-compare').className = 'cmp-btn' + (st.compare ? ' on' : '');
      this.$('compare-state').textContent = st.compare ? 'ativo' : '—';
    }
    // ajustes finos: recolhidos por padrão, com o valor de cada régua à vista
    this.$('fine-body').style.display = st.fineOpen ? 'block' : 'none';
    this.$('fine-caret').style.transform = `rotate(${st.fineOpen ? 90 : 0}deg)`;
    this.$('fine-hint').textContent = st.fineOpen ? '' : '3';
    const fmt = v => (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
    if (st.fineOpen) {
      this.$('val-spacing').textContent = fmt(st.spacing) + '×';
      this.$('val-density').textContent = fmt(st.density) + '×';
      this.$('val-repulsao').textContent = fmt(st.repulsao);
    }
    // painel Aparência (sempre montado; controla só o desenho, não o dado)
    this.$('aparencia-body').style.display = st.aparenciaOpen ? 'block' : 'none';
    this.$('aparencia-caret').style.transform = `rotate(${st.aparenciaOpen ? 90 : 0}deg)`;
    if (st.aparenciaOpen) {
      const pct = v => Math.round(v * 100) + '%';
      this.$('val-cloudOp').textContent = pct(st.cloudOp);
      this.$('val-curOp').textContent = pct(st.curOp);
      this.$('val-spineOp').textContent = pct(st.spineOp);
      this.$('val-edgeOp').textContent = pct(st.edgeOp);
      this.$('val-edgeW').textContent = fmt(st.edgeW) + '×';
      this.$('val-gridOp').textContent = pct(st.gridOp);
    }
    this.mini = this.$('minimap');

    // rodapé — o carimbo de edição da prancha
    const visN = this.visibleNodes(); const visIds = new Set(visN.map(n => n.id));
    const visE = this.edges.filter(e => visIds.has(e.source) && visIds.has(e.target));
    const gaps = (this.g.diagnostics.gaps || []).length;
    this.$('foot-stats').textContent = `${visN.length} nós · ${visE.length} relações` + (gaps ? ` · ${gaps} lacunas` : '');
    this.$('foot-meta').textContent = this.g.meta.generatedAt ? ('ed. ' + this.g.meta.generatedAt.slice(0, 10)) : '';
    this.$('foot-path').textContent = selN ? (selN.sourcePath || selN.id) : `nível ${(lv.n > 0 ? '+' : '') + lv.n} · ${lv.name}`;
  }
}

(async function boot() {
  const qs = new URLSearchParams(location.search);
  const graphUrl = qs.get('graph') || '../examples/cafeteria/graph.json';
  let raw;
  try {
    if (graphUrl.startsWith('session:')) {
      // grafo aberto por arquivo: viajou pela sessão, não tem URL própria
      const guardado = sessionStorage.getItem('notocorda.grafo');
      if (!guardado) throw new Error('a sessão não tem mais o grafo aberto — escolha o arquivo de novo');
      raw = JSON.parse(guardado);
    } else {
      const res = await fetch(graphUrl);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      raw = await res.json();
    }
  } catch (err) {
    document.getElementById('boot-error').style.display = 'flex';
    document.getElementById('boot-error-msg').textContent = graphUrl.startsWith('session:')
      ? `${err.message}`
      : `Não consegui carregar ${graphUrl} (${err.message}). Sirva a raiz do repositório por HTTP — ex.: python3 -m http.server — e abra /viewer/.`;
    return;
  }
  const g = NotocordaCore.computeLayout(NotocordaCore.adaptGraph(raw));
  const viewUrl = qs.get('view');
  if (viewUrl) {
    try { NotocordaCore.applyView(g, await (await fetch(viewUrl)).json()); } catch (e) { console.warn('view não carregada:', e); }
  }
  window.mapa = new NotocordaApp(g, {
    orgName: (qs.get('org') || '').toUpperCase(), graphUrl,
    palette: PALETTES[qs.get('paleta')] ? qs.get('paleta') : undefined,
  });
  if (qs.has('level')) {
    const want = parseInt(qs.get('level'), 10);
    const idx = g.levels.findIndex(l => l.n === want);
    if (idx >= 0) window.mapa.setLevel(idx);
  }
  // ?trilha=id1,id2 reabre um caminho de leitura inteiro — é o deep-link das notas
  if (qs.has('trilha')) qs.get('trilha').split(',').filter(Boolean).forEach(id => window.mapa.pushCard(id.trim()));
  // ?abrir=1 já mostra o seletor de mapas (útil para abrir a ferramenta "vazia")
  if (qs.has('abrir')) { window.mapa.setState({ abrirOpen: true }); window.mapa.listarGrafos(); }
})();

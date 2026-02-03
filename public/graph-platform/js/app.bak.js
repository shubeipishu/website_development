/* --- START OF FILE js/app.js --- */

class GraphApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('main');

        this.nodes = []; this.edges = []; this.nodeIdSeq = 0;
        this.view = { x: 0, y: 0, scale: 1.0 };

        // --- 交互状态核心 ---
        this.selNodes = new Set(); this.selEdges = new Set();
        this.undoStack = []; this.redoStack = [];

        // drag.type 可能的值: 'node' (移动点), 'box' (框选), 'connect' (连线), 'pan' (平移)
        this.drag = { active: false, type: null, start: null, startNode: null, offsets: new Map() };

        this.snapEnabled = true; this.snapLines = []; this.panelOpen = true;
        this.visMode = null;
        this.visData = null;
        this.connData = null;
        this.colData = null;
        this.edgeColData = null;
        this.misData = null;
        this.hamData = null;

        this.diamPath = null; this.selDistPath = null;
        this.mousePos = { x: 0, y: 0 }; this.clipboard = null;

        // 物理引擎
        this.physics = { active: false };
        this.animating = false;
        this.themeTransition = { active: false, startTime: 0, duration: 300, from: 'light', to: 'dark' };

        // 微交互动画状态
        this.hoverNode = null;
        this.hoverEdge = null;
        this.ripples = [];
        this.deletingNodes = [];
        this.deletingEdges = [];
        this.creatingNodes = [];

        // 框选实时预览状态
        this.previewSelNodes = null;
        this.previewSelEdges = null;

        this.config = {
            radius: 16,
            colors: {
                node: '#6366f1', sel: '#f87171',
                edge: '#9ca3af', selEdge: '#f87171',
                grid: '#e5e7eb',
                diamPath: '#d946ef', distPath: '#16a34a', cut: '#f59e0b',
                tempEdge: '#6366f1'
            }
        };
        this.currentGenType = null;

        // --- Worker Management ---
        this.worker = null;
        this.isCalculating = false;
        this.restartWorker();

        this.init();
    }

    restartWorker() {
        if (this.worker) {
            this.worker.terminate();
        }
        try {
            this.worker = new Worker('js/worker.js');
            this.worker.onmessage = (e) => this.handleWorkerMessage(e);
            this.worker.onerror = (e) => {
                console.warn("Worker error, falling back to main thread:", e);
                this.worker = null;
            };
        } catch (error) {
            console.warn("Failed to initialize Web Worker, falling back to main thread:", error);
            this.worker = null;
        }
        this.isCalculating = false;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.renderLatexUI();
        this.renderGenSidebar();
        this.loadTheme();

        // 鼠标交互
        this.canvas.addEventListener('mousedown', e => this.handleDown(e));
        window.addEventListener('mousemove', e => this.handleMove(e));
        window.addEventListener('mouseup', e => this.handleUp(e));
        this.canvas.addEventListener('wheel', e => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('dblclick', e => this.handleDblClick(e));
        this.canvas.addEventListener('contextmenu', e => this.handleRightClick(e));
        document.addEventListener('click', () => document.getElementById('context-menu').style.display = 'none');

        // 键盘交互
        document.addEventListener('keydown', e => this.handleKey(e));
        document.addEventListener('keyup', e => this.handleKeyUp(e));

        this.loop();
    }

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        this.isCalculating = false;

        if (type === 'result') {
            this.setVal('val-max-deg', data.degrees.max);
            this.setVal('val-min-deg', data.degrees.min);
            this.setVal('val-avg-deg', typeof data.degrees.avg === 'number' ? data.degrees.avg.toFixed(2) : '-');

            this.setVal('val-v-conn', data.connectivity.kappa);
            this.setVal('val-e-conn', data.connectivity.lambda);
            this.connData = {
                cutNodes: new Set(data.connectivity.cutNodes),
                cutEdges: data.connectivity.cutEdges
            };

            this.setVal('val-chi-edge', data.edgeColoring.chi);
            this.edgeColData = data.edgeColoring.mapping;

            this.hamData = data.hamiltonian;
            const btnPath = document.getElementById('btn-vis-ham-path');
            const valPath = document.getElementById('val-ham-path');
            const btnCycle = document.getElementById('btn-vis-ham-cycle');
            const valCycle = document.getElementById('val-ham-cycle');

            if (this.hamData.msg.includes('skip')) {
                valPath.innerText = "Slow"; btnPath.classList.add('disabled');
                valCycle.innerText = "Slow"; btnCycle.classList.add('disabled');
            } else {
                btnPath.classList.remove('disabled');
                btnCycle.classList.remove('disabled');

                if (this.hamData.path) {
                    valPath.innerText = "Yes"; valPath.style.color = '#10b981';
                } else {
                    valPath.innerText = "No"; valPath.style.color = '#ef4444';
                }

                if (this.hamData.cycle) {
                    valCycle.innerText = "Yes"; valCycle.style.color = '#10b981';
                } else {
                    valCycle.innerText = "No"; valCycle.style.color = '#ef4444';
                }
            }

            this.renderMat(data.matrices.adj, 'adj-mat');
            this.renderMat(data.matrices.lap, 'lap-mat');
            this.renderEigen(data.eigen.adj, 'adj');
            this.renderEigen(data.eigen.lap, 'lap');

            document.querySelectorAll('.stat-val').forEach(el => el.classList.remove('loading'));

            if (this.visMode) this.updVis(this.visMode, false);
        }
    }

    setVal(id, val) { const el = document.getElementById(id); if (el) { el.innerText = val; el.style.color = ''; } }

    updateData() {
        const V = this.nodes.length;
        this.setVal('val-v', V);
        this.setVal('val-e', this.edges.length);

        if (V === 0) { this.resetStats(); return; }

        this.updateFastStats();

        if (this.isCalculating) this.restartWorker();

        const nodesClean = this.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        const edgesClean = this.edges.map(e => ({ s: e.s, t: e.t }));

        ['val-v-conn', 'val-e-conn', 'val-chi-edge', 'val-max-deg', 'val-min-deg', 'val-avg-deg', 'val-ham-path', 'val-ham-cycle'].forEach(id => {
            document.getElementById(id).classList.add('loading');
        });

        this.isCalculating = true;
        if (this.worker) {
            this.worker.postMessage({ cmd: 'compute_all', nodes: nodesClean, edges: edgesClean });
        } else {
            // Fallback: Run on main thread
            // Use setTimeout to allow UI to update (e.g. show loading spinners) before freezing
            setTimeout(() => {
                if (typeof computeGraphStats === 'function') {
                    const result = computeGraphStats(nodesClean, edgesClean);
                    this.handleWorkerMessage({ data: { type: 'result', data: result } });
                } else {
                    console.error("Graph algorithms library not loaded.");
                    this.isCalculating = false;
                }
            }, 50);
        }
    }

    updateFastStats() {
        const V = this.nodes.length;
        const m = new Map();
        this.nodes.forEach((n, i) => m.set(n.id, i));
        const adj = Array(V).fill(0).map(() => Array(V).fill(0));
        const validEdges = this.edges.filter(e => m.has(e.s) && m.has(e.t));
        validEdges.forEach(e => {
            const u = m.get(e.s), v = m.get(e.t);
            adj[u][v] = 1; adj[v][u] = 1;
        });
        try { this.calcDiameter(adj, V, m); } catch (e) { }
        try { this.calcColor(adj, V); } catch (e) { }
        try { this.calcMIS(adj, V); } catch (e) { }
        this.updateSelectionStats();
    }

    renderEigen(vals, id) {
        const el = document.getElementById(id + '-eigen');
        if (!el) return;
        if (!vals || vals.length === 0) { el.innerHTML = ''; return; }
        const groups = [];
        let currentVal = vals[0], count = 1;
        for (let i = 1; i < vals.length; i++) {
            if (Math.abs(vals[i] - currentVal) < 0.001) count++;
            else { groups.push({ val: currentVal, count: count }); currentVal = vals[i]; count = 1; }
        }
        groups.push({ val: currentVal, count: count });
        let html = '';
        groups.forEach(g => {
            let valStr = Math.abs(Math.round(g.val) - g.val) < 0.001 ? Math.round(g.val).toString() : g.val.toFixed(2);
            if (valStr === '-0') valStr = '0';
            html += `<div class="eigen-pill"><span class="eigen-val">${valStr}</span>${g.count > 1 ? `<span class="eigen-mult">×${g.count}</span>` : ''}</div>`;
        });
        el.innerHTML = html;
    }

    calcColor(adj, N) { const cIdx = this.solveColorDSatur(adj, N); this.colData = {}; cIdx.forEach((c, i) => { this.colData[this.nodes[i].id] = c; }); document.getElementById('val-chi').innerText = Math.max(...cIdx); if (this.visMode === 'coloring') this.updVis('coloring', false); }
    solveColorDSatur(adj, N) { let c = Array(N).fill(0), d = adj.map(r => r.reduce((a, b) => a + b, 0)), s = Array(N).fill(0), u = new Set(); for (let i = 0; i < N; i++)u.add(i); while (u.size > 0) { let ms = -1, p = -1; for (let x of u) { if (s[x] > ms) { ms = s[x]; p = x; } else if (s[x] === ms) { if (d[x] > (p === -1 ? -1 : d[p])) p = x; } } u.delete(p); let nc = new Set(); for (let v = 0; v < N; v++)if (adj[p][v] && c[v] !== 0) nc.add(c[v]); let k = 1; while (nc.has(k)) k++; c[p] = k; for (let v = 0; v < N; v++)if (adj[p][v] && c[v] === 0) { let sc = new Set(); for (let z = 0; z < N; z++)if (adj[v][z] && c[z] !== 0) sc.add(c[z]); s[v] = sc.size; } } return c; }
    calcMIS(adj, N) { let comp = Array(N).fill(0).map(() => []); for (let i = 0; i < N; i++)for (let j = i + 1; j < N; j++)if (!adj[i][j]) { comp[i].push(j); comp[j].push(i); } let maxC = []; const BK = (R, P, X) => { if (!P.length && !X.length) { if (R.length > maxC.length) maxC = R.slice(); return; } let u = (P.length ? P[0] : X[0]), Pnu = P.filter(v => !comp[u].includes(v)); for (let v of Pnu) { BK([...R, v], P.filter(x => comp[v].includes(x)), X.filter(x => comp[v].includes(x))); P = P.filter(x => x !== v); X.push(v); } }; BK([], Array.from({ length: N }, (_, i) => i), []); this.misData = {}; const ms = new Set(maxC); this.nodes.forEach((n, i) => { this.misData[n.id] = ms.has(i); }); document.getElementById('val-alpha').innerText = maxC.length; if (this.visMode === 'mis') this.updVis('mis', false); }
    calcDiameter(adj, V, idMap) { let max = 0, path = [], conn = true; for (let i = 0; i < V; i++) { let d = Array(V).fill(-1), p = Array(V).fill(null), q = [i]; d[i] = 0; let r = 0; while (q.length) { let u = q.shift(); r++; if (d[u] > max) { max = d[u]; let t = [], c = u; while (c !== null) { t.unshift(c); c = p[c]; } path = t; } for (let v = 0; v < V; v++)if (adj[u][v] && d[v] === -1) { d[v] = d[u] + 1; p[v] = u; q.push(v); } } if (r < V) conn = false; } const b = document.getElementById('btn-vis-diameter'); if (!conn) { document.getElementById('val-diam').innerText = "∞"; this.diamPath = null; if (b) b.classList.add('disabled'); } else { document.getElementById('val-diam').innerText = max; const inv = new Map(); idMap.forEach((v, k) => inv.set(v, k)); this.diamPath = path.map(i => inv.get(i)); if (b) b.classList.remove('disabled'); } }
    bfsDist(s, e) { let q = [s], vis = new Map(); vis.set(s, null); while (q.length) { let u = q.shift(); if (u === e) { let p = [], c = e; while (c !== null) { p.unshift(c); c = vis.get(c); } return { found: true, d: p.length - 1, p: p }; } this.edges.forEach(g => { let v = null; if (g.s === u) v = g.t; else if (g.t === u) v = g.s; if (v !== null && !vis.has(v)) { vis.set(v, u); q.push(v); } }); } return { found: false }; }

    renderMath(id, tex) { const el = document.getElementById(id); if (el && window.katex) katex.render(tex, el, { throwOnError: false }); }
    renderLatexUI() { if (!window.katex) return; this.renderMath('lbl-v', '|V|'); this.renderMath('lbl-e', '|E|'); this.renderMath('lbl-max-deg', '\\Delta'); this.renderMath('lbl-min-deg', '\\delta'); this.renderMath('lbl-avg-deg', '\\bar{d}'); this.renderMath('lbl-diam', '\\text{diam}(G)'); this.renderMath('lbl-chi', '\\chi(G)'); this.renderMath('lbl-chi-edge', '\\chi\'(G)'); this.renderMath('lbl-alpha', '\\alpha(G)'); this.renderMath('lbl-dist', '\\text{dist}(u,v)'); this.renderMath('lbl-kappa', '\\kappa'); this.renderMath('lbl-lambda', '\\lambda'); this.renderMath('lbl-mat-a', 'A'); this.renderMath('lbl-mat-l', 'L'); }

    renderDescWithLatex(id, text) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        const parts = text.split('$');
        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                if (part) el.appendChild(document.createTextNode(part));
            } else {
                const span = document.createElement('span');
                if (window.katex) katex.render(part, span, { throwOnError: false });
                else span.innerText = part;
                el.appendChild(span);
            }
        });
    }

    renderGenSidebar() {
        const sb = document.getElementById('gen-sidebar-list');
        sb.innerHTML = ''; let firstItem = null;
        GRAPH_CONFIG.forEach(cat => {
            const catEl = document.createElement('div'); catEl.className = 'gen-category-title'; catEl.innerText = cat.category; sb.appendChild(catEl);
            cat.items.forEach(item => { if (!firstItem) firstItem = item; const el = document.createElement('div'); el.className = 'gen-item'; el.dataset.id = item.id; el.innerHTML = `<span>${item.name}</span>`; el.onclick = () => this.selectGenType(item); sb.appendChild(el); });
        });
        if (firstItem) this.selectGenType(firstItem);
    }

    selectGenType(item) {
        this.currentGenType = item;
        document.querySelectorAll('.gen-item').forEach(el => el.classList.toggle('selected', el.dataset.id === item.id));
        document.getElementById('gen-display-name').innerText = item.name;

        this.renderDescWithLatex('gen-display-desc', item.desc);

        const texBadge = document.getElementById('gen-display-tex');
        if (window.katex) katex.render(item.latex, texBadge, { throwOnError: false });

        const container = document.getElementById('gen-input-container'); container.innerHTML = '';
        if (item.params.length === 0) {
            container.innerHTML = '<div style="color:#9ca3af; font-style:italic; font-size:14px;">该图无需额外参数配置。</div>';
        } else {
            item.params.forEach(p => {
                const group = document.createElement('div'); group.className = 'gen-input-group';
                const label = document.createElement('label'); label.className = 'gen-input-label'; label.innerText = p.label;
                const input = document.createElement('input'); input.type = 'number'; input.className = 'gen-input'; input.id = `gen-p-${p.id}`; input.value = p.def; input.min = p.min || 0; if (p.max) input.max = p.max;
                group.appendChild(label); group.appendChild(input); container.appendChild(group);
            });
        }
    }

    showGenerator() { const m = document.getElementById('gen-modal'), b = document.getElementById('modal-backdrop'); if (!m.classList.contains('active')) { m.classList.add('active'); b.classList.add('active'); } }
    hideGenerator() { document.getElementById('gen-modal').classList.remove('active'); document.getElementById('modal-backdrop').classList.remove('active'); }

    generateGraph() {
        if (!this.currentGenType) return;
        const type = this.currentGenType.id;
        const getVal = (pid) => { const el = document.getElementById(`gen-p-${pid}`); return el ? parseInt(el.value) : 0; };

        let n = getVal('n'), m = getVal('m'), r = getVal('r');
        let rows = getVal('rows'), cols = getVal('cols'), h = getVal('h'), prob = getVal('p');

        const isAppend = document.getElementById('gen-append').checked;
        this.saveState(); let startId = 0;
        if (!isAppend) { this.nodes = []; this.edges = []; this.nodeIdSeq = 0; this.resetStats(); } else { startId = this.nodeIdSeq; }
        let tmpNodes = []; let tmpEdges = []; const R = 120;

        // --- Graph Generation Logic ---

        if (['Kn', 'Cn', 'Wn', 'Star'].includes(type)) {
            for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI - Math.PI / 2; tmpNodes.push({ id: i, x: R * Math.cos(a), y: R * Math.sin(a) }); }
            if (type === 'Kn') for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) tmpEdges.push({ s: i, t: j });
            else if (type === 'Cn') for (let i = 0; i < n; i++) tmpEdges.push({ s: i, t: (i + 1) % n });
            else if (type === 'Wn') { tmpNodes.push({ id: n, x: 0, y: 0 }); for (let i = 0; i < n; i++) { tmpEdges.push({ s: i, t: (i + 1) % n }); tmpEdges.push({ s: n, t: i }); } }
            else if (type === 'Star') { tmpNodes = []; tmpNodes.push({ id: 0, x: 0, y: 0 }); for (let i = 1; i <= n; i++) { const a = ((i - 1) / n) * 2 * Math.PI - Math.PI / 2; tmpNodes.push({ id: i, x: R * Math.cos(a), y: R * Math.sin(a) }); tmpEdges.push({ s: 0, t: i }); } }

        } else if (type === 'Pn') {
            const w = R * 2, sx = -w / 2;
            for (let i = 0; i < n; i++) {
                tmpNodes.push({ id: i, x: sx + (i / (n - 1 || 1)) * w, y: 0 });
                if (i > 0) tmpEdges.push({ s: i - 1, t: i });
            }

        } else if (type === 'Knm') {
            const sy = 60, h1 = (n - 1) * sy, h2 = (m - 1) * sy, x1 = -150, x2 = 150;
            for (let i = 0; i < n; i++) tmpNodes.push({ id: i, x: x1, y: -h1 / 2 + i * sy });
            for (let j = 0; j < m; j++) tmpNodes.push({ id: n + j, x: x2, y: -h2 / 2 + j * sy });
            for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) tmpEdges.push({ s: i, t: n + j });

        } else if (type === 'Petersen') {
            const r2 = R * 0.5;
            for (let i = 0; i < 5; i++) { const a = (i / 5) * 2 * Math.PI - Math.PI / 2; tmpNodes.push({ id: i, x: R * Math.cos(a), y: R * Math.sin(a) }); tmpNodes.push({ id: i + 5, x: r2 * Math.cos(a), y: r2 * Math.sin(a) }); }
            for (let i = 0; i < 5; i++) { tmpEdges.push({ s: i, t: (i + 1) % 5 }); tmpEdges.push({ s: i + 5, t: (i + 2) % 5 + 5 }); tmpEdges.push({ s: i, t: i + 5 }); }

        } else if (type === 'Turan') {
            const parts = Array.from({ length: r }, () => []);
            for (let i = 0; i < n; i++) parts[i % r].push(i);
            for (let p = 0; p < r; p++) {
                const pa = (p / r) * 2 * Math.PI - Math.PI / 2, px = R * 0.8 * Math.cos(pa), py = R * 0.8 * Math.sin(pa);
                const pn = parts[p].length, cR = 30 + pn * 2;
                parts[p].forEach((nid, idx) => { const sa = (idx / pn) * 2 * Math.PI + pa; tmpNodes.push({ id: nid, x: px + (pn > 1 ? cR : 0) * Math.cos(sa), y: py + (pn > 1 ? cR : 0) * Math.sin(sa) }); });
            }
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((i % r) !== (j % r)) tmpEdges.push({ s: i, t: j });

        } else if (type === 'Grid') {
            const dx = 50, dy = 50;
            const sx = -(cols - 1) * dx / 2, sy = -(rows - 1) * dy / 2;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const id = r * cols + c;
                    tmpNodes.push({ id: id, x: sx + c * dx, y: sy + r * dy });
                    if (c < cols - 1) tmpEdges.push({ s: id, t: id + 1 });
                    if (r < rows - 1) tmpEdges.push({ s: id, t: id + cols });
                }
            }

        } else if (type === 'Hypercube') {
            const nDim = n; const count = Math.pow(2, nDim);
            for (let i = 0; i < count; i++) {
                const a = (i / count) * 2 * Math.PI;
                tmpNodes.push({ id: i, x: R * 1.5 * Math.cos(a), y: R * 1.5 * Math.sin(a) });
                for (let j = i + 1; j < count; j++) {
                    const diff = i ^ j;
                    if (diff !== 0 && (diff & (diff - 1)) === 0) tmpEdges.push({ s: i, t: j });
                }
            }

        } else if (type === 'BinTree') {
            const total = Math.pow(2, h) - 1;
            const levelH = 60;
            const baseW = R * Math.pow(2, Math.max(0, h - 3));

            // Simple recursive positioning
            const build = (idx, lvl, x, w) => {
                if (lvl > h) return;
                const y = (lvl - 1) * levelH - ((h - 1) * levelH) / 2;
                tmpNodes.push({ id: idx, x: x, y: y });
                const l = 2 * idx + 1, r = 2 * idx + 2;
                if (l < total) {
                    tmpEdges.push({ s: idx, t: l });
                    build(l, lvl + 1, x - w / 2, w / 2);
                }
                if (r < total) {
                    tmpEdges.push({ s: idx, t: r });
                    build(r, lvl + 1, x + w / 2, w / 2);
                }
            };
            build(0, 1, 0, baseW);
            // Sort nodes by ID to ensure correct array indexing if needed, though not strictly required for display
            tmpNodes.sort((a, b) => a.id - b.id);

        } else if (type === 'Gnp') {
            const pVal = prob / 100.0;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * 2 * Math.PI - Math.PI / 2;
                tmpNodes.push({ id: i, x: R * Math.cos(a), y: R * Math.sin(a) });
                for (let j = i + 1; j < n; j++) {
                    if (Math.random() < pVal) tmpEdges.push({ s: i, t: j });
                }
            }

        } else if (type === 'Grotzsch') {
            tmpNodes.push({ id: 0, x: 0, y: 0 }); // Center
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * 2 * Math.PI - Math.PI / 2;
                tmpNodes.push({ id: i + 1, x: R * 0.6 * Math.cos(a), y: R * 0.6 * Math.sin(a) }); // Inner
                tmpNodes.push({ id: i + 6, x: R * 1.2 * Math.cos(a), y: R * 1.2 * Math.sin(a) }); // Outer
            }
            for (let i = 0; i < 5; i++) {
                tmpEdges.push({ s: 0, t: i + 1 });
                tmpEdges.push({ s: i + 1, t: (i + 1) % 5 + 1 });
                tmpEdges.push({ s: i + 1, t: i + 6 });
                tmpEdges.push({ s: i + 6, t: (i + 2) % 5 + 6 });
            }

        } else if (type === 'Heawood') {
            for (let i = 0; i < 14; i++) {
                const a = (i / 14) * 2 * Math.PI - Math.PI / 2;
                tmpNodes.push({ id: i, x: R * 1.2 * Math.cos(a), y: R * 1.2 * Math.sin(a) });
                tmpEdges.push({ s: i, t: (i + 1) % 14 }); // Cycle
                if (i % 2 === 0) tmpEdges.push({ s: i, t: (i + 5) % 14 }); // Chords (0-5, 2-7...)
            }
        }

        // --- End Generation ---

        let targetX = 0, targetY = 0;
        const dpr = window.devicePixelRatio || 1;
        let screenW = this.canvas.width / dpr;
        let screenH = this.canvas.height / dpr;
        const panel = document.getElementById('panel-drawer');
        if (panel && !panel.classList.contains('closed')) {
            screenW -= 380;
        }
        const screenCx = screenW / 2;
        const screenCy = screenH / 2;
        const worldCx = (screenCx - this.view.x) / this.view.scale;
        const worldCy = (screenCy - this.view.y) / this.view.scale;

        if (isAppend) {
            const jitterX = (Math.random() - 0.5) * 120;
            const jitterY = (Math.random() - 0.5) * 120;
            targetX = worldCx + jitterX;
            targetY = worldCy + jitterY;
        } else {
            targetX = worldCx;
            targetY = worldCy;
        }
        tmpNodes.forEach(n => { n.x += targetX; n.y += targetY; n.id += startId; }); tmpEdges.forEach(e => { e.s += startId; e.t += startId; }); this.nodes = this.nodes.concat(tmpNodes); this.edges = this.edges.concat(tmpEdges); this.nodeIdSeq = startId + tmpNodes.length;
        this.updateData(); this.clearSel(); tmpNodes.forEach(n => this.selNodes.add(n.id)); tmpEdges.forEach(e => this.selEdges.add(e)); this.updateSelectionStats(); this.hideGenerator(); if (!isAppend) this.resetView();
    }

    calcSnap(id, tx, ty) {
        if (!this.snapEnabled) return { x: tx, y: ty, lines: [] };
        const t = 8 / this.view.scale;
        let bx = tx, by = ty, lines = [], snapped = { x: false, y: false };
        const connected = [], others = [];
        this.edges.forEach(e => { if (e.s === id) connected.push(this.nodes.find(n => n.id === e.t)); else if (e.t === id) connected.push(this.nodes.find(n => n.id === e.s)); });
        this.nodes.forEach(n => { if (n.id !== id) others.push(n); });
        const checkList = [...connected, ...others];
        for (let n of checkList) { if (!snapped.x && Math.abs(tx - n.x) < t) { bx = n.x; snapped.x = true; lines.push({ x1: n.x, y1: Math.min(ty, n.y) - 50, x2: n.x, y2: Math.max(ty, n.y) + 50 }); break; } }
        for (let n of checkList) { if (!snapped.y && Math.abs(ty - n.y) < t) { by = n.y; snapped.y = true; lines.push({ x1: Math.min(tx, n.x) - 50, y1: n.y, x2: Math.max(tx, n.x) + 50, y2: n.y }); break; } }
        if (connected.length >= 2) {
            for (let i = 0; i < connected.length; i++) {
                for (let j = i + 1; j < connected.length; j++) {
                    const n1 = connected[i], n2 = connected[j], mx = (n1.x + n2.x) / 2, my = (n1.y + n2.y) / 2;
                    if (Math.hypot(tx - mx, ty - my) < t * 1.5) return { x: mx, y: my, lines: [{ x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y }] };
                    const dx = n2.x - n1.x, dy = n2.y - n1.y, len2 = dx * dx + dy * dy; if (len2 === 0) continue;
                    const proj = ((tx - n1.x) * dx + (ty - n1.y) * dy) / len2;
                    if (proj > 0 && proj < 1) { const px = n1.x + proj * dx, py = n1.y + proj * dy; if (Math.hypot(tx - px, ty - py) < t) { bx = px; by = py; lines = [{ x1: n1.x - dx * 0.2, y1: n1.y - dy * 0.2, x2: n2.x + dx * 0.2, y2: n2.y + dy * 0.2 }]; } }
                }
            }
        }
        return { x: bx, y: by, lines: lines };
    }
    resize() { const dpr = window.devicePixelRatio || 1; const rect = this.container.getBoundingClientRect(); this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr; this.canvas.style.width = rect.width + 'px'; this.canvas.style.height = rect.height + 'px'; }
    resetView() {
        const startX = this.view.x, startY = this.view.y, startScale = this.view.scale;
        const targetX = 0, targetY = 0, targetScale = 1.0;
        const startTime = performance.now(), duration = 400;
        this.animating = true;

        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 2.5);
            this.view.x = startX + (targetX - startX) * ease;
            this.view.y = startY + (targetY - startY) * ease;
            this.view.scale = startScale + (targetScale - startScale) * ease;
            document.getElementById('zoom-indicator').innerText = Math.round(this.view.scale * 100) + '%';
            if (progress < 1) requestAnimationFrame(step);
            else this.animating = false;
        };
        requestAnimationFrame(step);
    }
    visualize(t) {
        if (!this.nodes.length) return;
        if (this.visMode === t) { this.exitVis(); return; }
        if (t === 'diameter' && !this.diamPath) return;
        if (t === 'dist' && !this.selDistPath) return;
        if (t === 'ham-path' && (!this.hamData || !this.hamData.path)) return;
        if (t === 'ham-cycle' && (!this.hamData || !this.hamData.cycle)) return;

        const isSwitching = this.visMode !== null;
        this.visMode = t;
        document.querySelectorAll('.link-btn').forEach(b => b.classList.remove('active-vis'));
        const activeBtn = document.getElementById(`btn-vis-${t}`);
        if (activeBtn) activeBtn.classList.add('active-vis');
        const banner = document.getElementById('vis-banner');
        const content = document.getElementById('vis-content');
        if (isSwitching) {
            content.classList.add('fading');
            setTimeout(() => { this.updVis(t, false); content.classList.remove('fading'); }, 200);
        } else {
            this.updVis(t, false);
            banner.classList.add('show');
        }
    }
    exitVis() { this.visMode = null; this.visData = null; document.getElementById('vis-banner').classList.remove('show'); document.querySelectorAll('.link-btn').forEach(b => b.classList.remove('active-vis')); }

    handleRightClick(e) {
        e.preventDefault();
        if (this.visMode) this.exitVis();
        const menu = document.getElementById('context-menu');
        const mw = this.toWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);
        const node = this.findNode(mw), edge = !node ? this.findEdge(mw) : null;

        if (node) {
            if (!this.selNodes.has(node.id)) { this.clearSel(); this.selNodes.add(node.id); this.updateSelectionStats(); }
        } else if (edge) {
            if (!this.selEdges.has(edge)) { this.clearSel(); this.selEdges.add(edge); this.updateSelectionStats(); }
        }

        let html = '';
        const hasSel = this.selNodes.size > 0 || this.selEdges.size > 0;
        if (hasSel) {
            html += `<div class="ctx-item" onclick="app.copySelection()"><i class="fas fa-copy"></i> <span class="ctx-text">复制 (Copy)</span> <span class="ctx-shortcut">Ctrl+C</span></div>`;
            html += `<div class="ctx-item" onclick="app.duplicateSelection()"><i class="fas fa-clone"></i> <span class="ctx-text">副本 (Duplicate)</span> <span class="ctx-shortcut">Ctrl+D</span></div>`;
            html += `<div class="ctx-item" onclick="app.cutSelection()"><i class="fas fa-cut"></i> <span class="ctx-text">剪切 (Cut)</span> <span class="ctx-shortcut">Ctrl+X</span></div>`;
            html += `<div class="ctx-sep"></div>`;
            html += `<div class="ctx-item" onclick="app.deleteSelectionAction()"><i class="fas fa-trash-alt"></i> <span class="ctx-text">删除 (Delete)</span> <span class="ctx-shortcut">Del</span></div>`;
        }
        if (this.clipboard) {
            if (hasSel) html += `<div class="ctx-sep"></div>`;
            html += `<div class="ctx-item" onclick="app.pasteFromMenu()"><i class="fas fa-paste"></i> <span class="ctx-text">粘贴 (Paste)</span> <span class="ctx-shortcut">Ctrl+V</span></div>`;
        }

        if (html !== '') html += `<div class="ctx-sep"></div>`;
        html += `<div class="ctx-item" onclick="app.exportToTikZ()"><i class="fas fa-code"></i> <span class="ctx-text">导出 TikZ</span></div>`;

        if (html === '') return;

        menu.innerHTML = html; menu.style.display = 'block';
        const rect = menu.getBoundingClientRect();
        let mx = e.clientX, my = e.clientY;
        if (mx + rect.width > window.innerWidth) mx -= rect.width;
        if (my + rect.height > window.innerHeight) my -= rect.height;
        menu.style.left = mx + 'px'; menu.style.top = my + 'px';
    }

    togglePhysics() { this.physics.active = !this.physics.active; const b = document.getElementById('btn-physics'); if (this.physics.active) { b.classList.add('physics-on'); b.setAttribute('data-tooltip', '物理布局: 开'); b.innerHTML = '<i class="fas fa-atom fa-spin"></i>'; } else { b.classList.remove('physics-on'); b.setAttribute('data-tooltip', '物理布局: 关'); b.innerHTML = '<i class="fas fa-atom"></i>'; } }

    applyPhysics() {
        if (!this.physics.active || this.nodes.length < 2) return;
        const idealLen = 150; const k_spring = 0.005; const repulsion = 8000; const dt = 0.5; const centerForce = 0.0005;
        const forces = this.nodes.map(() => ({ x: 0, y: 0 }));
        const dpr = window.devicePixelRatio || 1;
        const cx = this.canvas.width / (2 * dpr * this.view.scale) - this.view.x / this.view.scale;
        const cy = this.canvas.height / (2 * dpr * this.view.scale) - this.view.y / this.view.scale;

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n1 = this.nodes[i], n2 = this.nodes[j];
                let dx = n1.x - n2.x, dy = n1.y - n2.y;
                let d2 = dx * dx + dy * dy; if (d2 < 0.1) { dx = Math.random(); dy = Math.random(); d2 = 1; }
                const d = Math.sqrt(d2); const f = repulsion / d2;
                const fx = (dx / d) * f, fy = (dy / d) * f;
                forces[i].x += fx; forces[i].y += fy; forces[j].x -= fx; forces[j].y -= fy;
            }
            forces[i].x -= (this.nodes[i].x - cx) * centerForce;
            forces[i].y -= (this.nodes[i].y - cy) * centerForce;
        }
        this.edges.forEach(e => {
            const ni = this.nodes.findIndex(n => n.id === e.s), nj = this.nodes.findIndex(n => n.id === e.t);
            if (ni === -1 || nj === -1) return;
            const n1 = this.nodes[ni], n2 = this.nodes[nj];
            const dx = n2.x - n1.x, dy = n2.y - n1.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d === 0) return;
            const f = k_spring * (d - idealLen);
            const fx = (dx / d) * f, fy = (dy / d) * f;
            forces[ni].x += fx; forces[ni].y += fy; forces[nj].x -= fx; forces[nj].y -= fy;
        });
        this.nodes.forEach((n, i) => {
            if (this.drag.active && this.drag.type === 'node' && this.selNodes.has(n.id)) return;
            let vx = forces[i].x * dt, vy = forces[i].y * dt;
            const maxV = 15;
            const v = Math.hypot(vx, vy);
            if (v > maxV) { vx = (vx / v) * maxV; vy = (vy / v) * maxV; }
            n.x += vx; n.y += vy;
        });
    }

    // --- Export Modal Logic ---
    showExportModal() {
        const m = document.getElementById('export-modal');
        const b = document.getElementById('modal-backdrop');
        if (!m.classList.contains('active')) {
            m.classList.add('active');
            b.classList.add('active');
            m.style.display = 'flex'; // Ensure flex display
            this.switchExportTab('png'); // Default to PNG
        }
    }

    hideExportModal() {
        const m = document.getElementById('export-modal');
        const b = document.getElementById('modal-backdrop');
        m.classList.remove('active');
        b.classList.remove('active');
        setTimeout(() => m.style.display = 'none', 300); // Wait for transition
    }

    switchExportTab(type) {
        this.currentExportType = type;
        document.querySelectorAll('#export-modal .gen-item').forEach(el => el.classList.remove('selected'));
        document.getElementById(`tab-${type}`).classList.add('selected');

        document.getElementById('export-body-png').style.display = type === 'png' ? 'block' : 'none';
        document.getElementById('export-body-tikz').style.display = type === 'tikz' ? 'block' : 'none';

        if (type === 'png') {
            document.getElementById('export-title').innerText = "导出 PNG 图片";
            document.getElementById('export-desc').innerText = "导出当前画布为高清图片。";
        } else {
            document.getElementById('export-title').innerText = "导出 LaTeX / TikZ";
            document.getElementById('export-desc').innerText = "生成可直接用于论文的 TikZ 代码。";
        }
    }

    doExport() {
        if (this.currentExportType === 'png') {
            const scale = parseInt(document.getElementById('exp-png-scale').value);
            const bg = document.getElementById('exp-png-bg').value;
            this.exportCanvasImage(scale, bg);
        } else {
            const scale = parseFloat(document.getElementById('exp-tikz-scale').value);
            const preamble = document.getElementById('exp-tikz-preamble').checked;
            const vertexStyle = document.getElementById('exp-tikz-vertex-style').value.trim();
            const edgeStyle = document.getElementById('exp-tikz-edge-style').value.trim();
            this.exportToTikZ(scale, preamble, vertexStyle || null, edgeStyle || null);
        }
        this.hideExportModal();
    }

    exportCanvasImage(scale = 2, bgType = 'theme') {
        if (this.nodes.length === 0) return;

        // 1. 计算包围盒
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.nodes.forEach(n => {
            minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
        });
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // 2. 创建临时 Canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * scale;
        tempCanvas.height = height * scale;
        const ctx = tempCanvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        // 3. 确定背景色
        let bgColor;
        if (bgType === 'transparent') bgColor = null;
        else if (bgType === 'white') bgColor = '#ffffff';
        else if (bgType === 'dark') bgColor = '#1f2937';
        else { // theme
            bgColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1f2937' : '#ffffff';
        }

        if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(minX - padding, minY - padding, width, height);
        }

        // 4. 绘制图
        // 获取当前主题颜色，或者根据背景色强制使用特定颜色
        let theme = this.getThemeColors();
        if (bgType === 'white') {
            // 强制亮色主题配色
            theme = { nodeStroke: '#fff', nodeText: '#fff', badgeBg: '#fff', badgeBorder: '#333', badgeText: '#000', selBoxFill: 'rgba(59, 130, 246, 0.2)' };
            // 修正：在白色背景上，节点文字应该是黑色，节点填充应该是白色，边框黑色？
            // 不，原来的设计是节点有填充色。
            // 让我们使用默认的 Light 主题配置，但确保节点文字可见
            theme.nodeStroke = '#fff';
            theme.nodeText = '#fff'; // 节点内部文字通常是白色的（因为节点有深色填充）
            theme.badgeBg = '#fff';
            theme.badgeBorder = '#e5e7eb';
        } else if (bgType === 'dark') {
            theme.nodeStroke = '#f9fafb';
            theme.nodeText = '#f9fafb';
        }

        // Edges
        ctx.lineWidth = 2;
        this.edges.forEach(e => {
            const n1 = this.nodes.find(n => n.id === e.s);
            const n2 = this.nodes.find(n => n.id === e.t);
            if (!n1 || !n2) return;
            ctx.strokeStyle = this.config.colors.edge; // 使用配置的边颜色，而不是主题边框色
            ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
        });

        // Nodes
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        this.nodes.forEach(n => {
            // Node Fill
            ctx.fillStyle = this.config.colors.node; // 使用配置的节点颜色
            ctx.beginPath(); ctx.arc(n.x, n.y, this.config.radius, 0, Math.PI * 2); ctx.fill();

            // Node Stroke
            ctx.strokeStyle = theme.nodeStroke;
            ctx.lineWidth = 2; ctx.stroke();

            // Node Text
            ctx.fillStyle = theme.nodeText;
            ctx.fillText(n.id, n.x, n.y);
        });

        // 5. 导出
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `graph_export_${new Date().getTime()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    exportToTikZ(userScale = 1.0, includePreamble = true, vertexStyle = null, edgeStyle = null) {
        if (this.nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.nodes.forEach(n => {
            minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
        });

        // 基础比例：将像素坐标转换为 TikZ 坐标 (假设 100px ≈ 2cm)
        const baseScale = 0.02;
        const finalScale = baseScale * userScale;

        // 获取用户自定义样式或使用默认值
        const vStyle = vertexStyle || "circle, draw, fill=blue!20, minimum size=8mm, inner sep=1pt";
        const eStyle = edgeStyle || "draw, thick";

        let tikz = "% Generated by Graph Platform\n";
        if (includePreamble) {
            tikz += "\\documentclass[tikz,border=10pt]{standalone}\n";
            tikz += "\\begin{document}\n\n";
        }

        // 将样式定义放在 tikzpicture 环境的选项中
        tikz += "\\begin{tikzpicture}[\n";
        tikz += "    auto,\n";
        tikz += "    swap,\n";
        tikz += `    vertex/.style={${vStyle}},\n`;
        tikz += `    edge/.style={${eStyle}}\n`;
        tikz += "]\n";

        tikz += "    % Vertices\n";

        const nodeStrs = this.nodes.map(n => {
            const x = ((n.x - minX) * finalScale).toFixed(2);
            const y = (-(n.y - minY) * finalScale).toFixed(2); // TikZ y轴向上
            return `    \\node[vertex] (v${n.id}) at (${x},${y}) {${n.id}};`;
        });
        tikz += nodeStrs.join("\n") + "\n\n";

        tikz += "    % Edges\n";
        const edgeStrs = this.edges.map(e => `    \\path[edge] (v${e.s}) -- (v${e.t});`);
        tikz += edgeStrs.join("\n") + "\n";

        tikz += "\\end{tikzpicture}\n";
        if (includePreamble) {
            tikz += "\n\\end{document}\n";
        }

        navigator.clipboard.writeText(tikz).then(() => {
            alert("TikZ 代码已复制到剪贴板！");
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert("复制失败，请查看控制台输出。");
        });
    }

    applyTikZPreset(type, value) {
        if (!value) return;
        if (type === 'vertex') {
            document.getElementById('exp-tikz-vertex-style').value = value;
        } else if (type === 'edge') {
            document.getElementById('exp-tikz-edge-style').value = value;
        }
    }

    saveGraph() { const data = { version: "5.5", timestamp: new Date().toISOString(), nodes: this.nodes, edges: this.edges, nextId: this.nodeIdSeq }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `graph_${new Date().getTime()}.json`; a.click(); URL.revokeObjectURL(url); }
    loadGraph(input) { const file = input.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (data.nodes && data.edges) { this.saveState(); this.nodes = data.nodes; this.edges = data.edges; this.nodeIdSeq = data.nextId || (this.nodes.length > 0 ? Math.max(...this.nodes.map(n => n.id)) + 1 : 0); this.clearSel(); this.resetView(); this.updateData(); alert("Data Loaded"); } } catch (err) { alert("Invalid File"); } input.value = ''; }; reader.readAsText(file); }
    copySelection() { if (this.selNodes.size === 0 && this.selEdges.size === 0) return; const nA = [], eA = []; let minX = Infinity, minY = Infinity; this.selNodes.forEach(id => { const n = this.nodes.find(x => x.id === id); if (n) { nA.push({ ...n }); minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); } }); const ns = new Set(this.selNodes); this.edges.forEach(e => { if (ns.has(e.s) && ns.has(e.t)) eA.push({ ...e }) }); if (nA.length === 0) return; nA.forEach(n => { n.x -= minX; n.y -= minY }); this.clipboard = { nodes: nA, edges: eA }; }
    pasteFromMenu() { this.pasteAt(this.toWorld(parseInt(document.getElementById('context-menu').style.left), parseInt(document.getElementById('context-menu').style.top))); }
    pasteAt(pos) {
        if (!this.clipboard) return;
        this.saveState(); this.clearSel();
        const idMap = new Map();
        this.clipboard.nodes.forEach(n => {
            const newId = this.nodeIdSeq++;
            idMap.set(n.id, newId);
            const newNode = { id: newId, x: pos.x + n.x, y: pos.y + n.y };
            this.nodes.push(newNode);
            this.selNodes.add(newId);
            this.creatingNodes.push({ node: newNode, startTime: performance.now(), duration: 300 });
        });
        this.clipboard.edges.forEach(e => {
            if (idMap.has(e.s) && idMap.has(e.t)) this.edges.push({ s: idMap.get(e.s), t: idMap.get(e.t) });
        });
        this.updateData(); this.updateSelectionStats();
    }
    cutSelection() { this.copySelection(); this.deleteSelectionAction(); }
    duplicateSelection() { if (this.selNodes.size > 0) { this.copySelection(); const fId = this.selNodes.values().next().value; const n = this.nodes.find(x => x.id === fId); this.pasteAt({ x: n.x + 30, y: n.y + 30 }); } }

    deleteSelectionAction() {
        this.saveState();

        // 1. 删除被选中的边
        if (this.selEdges.size > 0) {
            this.edges = this.edges.filter(e => !this.selEdges.has(e));
        }

        // 2. 删除被选中的点（同时级联删除连接在这些点上的边）
        if (this.selNodes.size > 0) {
            this.nodes = this.nodes.filter(n => !this.selNodes.has(n.id));
            this.edges = this.edges.filter(e => !this.selNodes.has(e.s) && !this.selNodes.has(e.t));
        }

        // 3. 重建索引、清空选区并更新统计数据
        this.reindex();
        this.clearSel();
        this.updateData();
    }

    selectAll() { this.clearSel(); this.nodes.forEach(n => this.selNodes.add(n.id)); this.edges.forEach(e => this.selEdges.add(e)); this.updateSelectionStats(); }
    togglePanel() { this.panelOpen = !this.panelOpen; const d = document.getElementById('panel-drawer'), i = document.getElementById('toggle-icon'); if (this.panelOpen) { d.classList.remove('closed'); i.className = 'fas fa-chevron-right'; } else { d.classList.add('closed'); i.className = 'fas fa-chevron-left'; } }
    toggleSnap() { this.snapEnabled = !this.snapEnabled; const b = document.getElementById('btn-snap'); if (this.snapEnabled) { b.classList.add('toggle-on'); b.setAttribute('data-tooltip', '智能吸附: 开'); b.style.color = '#10b981'; } else { b.classList.remove('toggle-on'); b.setAttribute('data-tooltip', '智能吸附: 关'); b.style.color = '#64748b'; } }

    loadTheme() {
        const savedTheme = localStorage.getItem('graph-platform-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const btn = document.getElementById('btn-theme');
        if (savedTheme === 'dark') {
            btn.innerHTML = '<i class="fas fa-sun"></i>';
            btn.setAttribute('data-tooltip', '切换为亮色主题');
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            btn.setAttribute('data-tooltip', '切换为暗色主题');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // Start transition
        this.themeTransition = {
            active: true,
            startTime: performance.now(),
            duration: 300,
            from: currentTheme,
            to: newTheme
        };

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('graph-platform-theme', newTheme);
        const btn = document.getElementById('btn-theme');
        if (newTheme === 'dark') {
            btn.innerHTML = '<i class="fas fa-sun"></i>';
            btn.setAttribute('data-tooltip', '切换为亮色主题');
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            btn.setAttribute('data-tooltip', '切换为暗色主题');
        }
    }

    toWorld(sx, sy) { return { x: (sx - this.view.x) / this.view.scale, y: (sy - this.view.y) / this.view.scale }; }

    getThemeColors() {
        // Define base colors for both themes
        const themes = {
            light: {
                nodeStroke: '#d1d5db', nodeText: '#fff', badgeBg: '#fff', badgeBorder: '#333', badgeText: '#000', selBoxFill: 'rgba(59, 130, 246, 0.2)'
            },
            dark: {
                nodeStroke: '#f9fafb', nodeText: '#f9fafb', badgeBg: '#374151', badgeBorder: '#9ca3af', badgeText: '#f9fafb', selBoxFill: 'rgba(59, 130, 246, 0.2)'
            }
        };

        const targetTheme = document.documentElement.getAttribute('data-theme') || 'light';

        if (!this.themeTransition.active) {
            return themes[targetTheme === 'dark' ? 'dark' : 'light'];
        }

        const now = performance.now();
        const progress = Math.min((now - this.themeTransition.startTime) / this.themeTransition.duration, 1);

        // Sync with CSS ease-in-out
        // CSS ease-in-out is approximately 0.42, 0, 0.58, 1
        // Sine easing (0.5 - 0.5 * cos(pi*t)) is a very close match and smooth
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * progress);

        if (progress >= 1) {
            this.themeTransition.active = false;
            return themes[targetTheme === 'dark' ? 'dark' : 'light'];
        }

        const from = themes[this.themeTransition.from];
        const to = themes[this.themeTransition.to];

        // Helper to interpolate hex colors
        const lerpColor = (c1, c2, t) => {
            // Simple hex parsing (assuming #RRGGBB or #RGB) - simplified for known colors
            const parse = (c) => {
                if (c.startsWith('rgba')) return [59, 130, 246]; // Special case for selBoxFill
                let hex = c.slice(1);
                if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
                return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
            };
            const rgb1 = parse(c1), rgb2 = parse(c2);
            const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
            const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
            const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
            return `rgb(${r},${g},${b})`;
        };

        return {
            nodeStroke: lerpColor(from.nodeStroke, to.nodeStroke, ease),
            nodeText: lerpColor(from.nodeText, to.nodeText, ease),
            badgeBg: lerpColor(from.badgeBg, to.badgeBg, ease),
            badgeBorder: lerpColor(from.badgeBorder, to.badgeBorder, ease),
            badgeText: lerpColor(from.badgeText, to.badgeText, ease),
            selBoxFill: to.selBoxFill // No change needed for rgba
        };
    }

    handleDblClick(e) {
        const mw = this.toWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);
        const n = this.findNode(mw);
        if (!n) {
            this.saveState();
            const newNode = { id: this.nodeIdSeq++, x: mw.x, y: mw.y };
            this.nodes.push(newNode);
            this.creatingNodes.push({ node: newNode, startTime: performance.now(), duration: 300 });
            this.updateData();
        }
    }

    handleDown(e) {
        if (e.button === 1 || e.key === ' ') { this.isPanning = true; this.panStart = { x: e.clientX, y: e.clientY }; return; }
        if (e.button !== 0) return;

        const mw = this.toWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);
        const n = this.findNode(mw), ed = n ? null : this.findEdge(mw);

        if (e.shiftKey && n) {
            this.drag = { active: true, type: 'connect', startNode: n, currentPos: mw };
            return;
        }

        if (n) {
            if (!e.ctrlKey && !this.selNodes.has(n.id)) {
                this.clearSel(); this.selNodes.add(n.id);
                this.ripples.push({ x: n.x, y: n.y, startTime: performance.now(), maxRadius: this.config.radius * 2 });
            } else if (e.ctrlKey) {
                if (this.selNodes.has(n.id)) this.selNodes.delete(n.id);
                else {
                    this.selNodes.add(n.id);
                    this.ripples.push({ x: n.x, y: n.y, startTime: performance.now(), maxRadius: this.config.radius * 2 });
                }
            }
            this.drag = { active: true, type: 'node', start: mw, offsets: new Map() };
            this.selNodes.forEach(id => {
                const node = this.nodes.find(x => x.id === id);
                this.drag.offsets.set(id, { dx: node.x - mw.x, dy: node.y - mw.y });
            });
            this.updateSelectionStats();
            return;
        }

        if (ed) {
            if (!e.ctrlKey) { this.clearSel(); this.selEdges.add(ed); }
            else {
                if (this.selEdges.has(ed)) this.selEdges.delete(ed);
                else this.selEdges.add(ed);
            }
            this.updateSelectionStats();
            return;
        }

        if (!e.ctrlKey) this.clearSel();
        this.drag = { active: true, type: 'box', start: mw };
        this.selBox = { x: mw.x, y: mw.y, w: 0, h: 0 };
    }

    handleMove(e) {
        this.mousePos = { x: e.clientX - this.canvas.getBoundingClientRect().left, y: e.clientY - this.canvas.getBoundingClientRect().top };
        const mw = this.toWorld(this.mousePos.x, this.mousePos.y);

        if (this.isPanning) {
            this.view.x += e.clientX - this.panStart.x;
            this.view.y += e.clientY - this.panStart.y;
            this.panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        this.snapLines = [];
        const hoverNode = this.findNode(mw);
        const hoverEdge = hoverNode ? null : this.findEdge(mw);

        this.hoverNode = hoverNode;
        this.hoverEdge = hoverEdge;

        if (e.shiftKey && hoverNode) this.canvas.style.cursor = 'crosshair';
        else if (hoverNode || hoverEdge) this.canvas.style.cursor = 'pointer';
        else this.canvas.style.cursor = 'default';

        if (!this.drag.active) return;

        if (this.drag.type === 'connect') {
            this.drag.currentPos = mw;
        }
        else if (this.drag.type === 'node') {
            let dx = 0, dy = 0;
            if (this.selNodes.size === 1 && this.snapEnabled && !this.physics.active) {
                const nid = this.selNodes.values().next().value;
                const off = this.drag.offsets.get(nid);
                const snap = this.calcSnap(nid, mw.x + off.dx, mw.y + off.dy);
                dx = snap.x - (mw.x + off.dx);
                dy = snap.y - (mw.y + off.dy);
                this.snapLines = snap.lines;
            }
            this.selNodes.forEach(id => {
                const n = this.nodes.find(x => x.id === id);
                if (n) {
                    const off = this.drag.offsets.get(id);
                    n.x = mw.x + off.dx + dx;
                    n.y = mw.y + off.dy + dy;
                }
            });
        }
        else if (this.drag.type === 'box') {
            this.selBox = {
                x: Math.min(this.drag.start.x, mw.x),
                y: Math.min(this.drag.start.y, mw.y),
                w: Math.abs(mw.x - this.drag.start.x),
                h: Math.abs(mw.y - this.drag.start.y)
            };

            this.previewSelNodes = new Set();
            this.previewSelEdges = new Set();

            this.nodes.forEach(n => {
                if (this.inBox(n)) {
                    this.previewSelNodes.add(n.id);
                }
            });

            this.edges.forEach(e => {
                const n1 = this.nodes.find(n => n.id === e.s);
                const n2 = this.nodes.find(n => n.id === e.t);
                if (n1 && n2 && this.inBox({ x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 })) {
                    this.previewSelEdges.add(e);
                }
            });
        }
    }

    handleUp() {
        this.isPanning = false;
        if (!this.drag.active) return;

        if (this.drag.type === 'connect') {
            const endNode = this.findNode(this.drag.currentPos);
            if (endNode && endNode.id !== this.drag.startNode.id) {
                const exists = this.edges.some(x => (x.s === this.drag.startNode.id && x.t === endNode.id) || (x.s === endNode.id && x.t === this.drag.startNode.id));
                if (!exists) {
                    this.saveState();
                    this.edges.push({ s: this.drag.startNode.id, t: endNode.id });
                    this.updateData();
                }
            } else if (!endNode) {
                this.saveState();
                const newId = this.nodeIdSeq++;
                const newNode = { id: newId, x: this.drag.currentPos.x, y: this.drag.currentPos.y };
                this.nodes.push(newNode);
                this.edges.push({ s: this.drag.startNode.id, t: newId });
                this.creatingNodes.push({ node: newNode, startTime: performance.now(), duration: 300 });
                this.updateData();
            }
        }
        else if (this.drag.type === 'box') {
            if (this.selBox.w > 0 || this.selBox.h > 0) {
                this.nodes.forEach(n => {
                    if (this.inBox(n)) this.selNodes.add(n.id);
                });
                this.edges.forEach(ed => {
                    const n1 = this.nodes.find(n => n.id === ed.s), n2 = this.nodes.find(n => n.id === ed.t);
                    if (n1 && n2 && this.inBox({ x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 })) this.selEdges.add(ed);
                });
            }
        }

        this.drag.active = false;
        this.selBox = null;
        this.snapLines = [];
        this.previewSelNodes = null;
        this.previewSelEdges = null;
        this.updateSelectionStats();
    }

    hideAllModals() {
        this.hideGenerator();
        this.hideExportModal();
    }

    handleKey(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('gen-modal').classList.contains('active') ||
                document.getElementById('export-modal').classList.contains('active')) {
                this.hideAllModals();
                return;
            }
            this.clearSel();
            return;
        }
        if (e.target.tagName === 'INPUT') return;

        const k = e.key.toLowerCase();

        if (e.key === 'Shift') document.body.classList.add('mode-connect');

        if ((e.ctrlKey || e.metaKey)) {
            if (k === 'a') { e.preventDefault(); this.selectAll(); return; }
            else if (k === 'c') { e.preventDefault(); this.copySelection(); return; }
            else if (k === 'd') { e.preventDefault(); this.duplicateSelection(); return; }
            else if (k === 'x') { e.preventDefault(); this.cutSelection(); return; }
            else if (k === 'v') { e.preventDefault(); this.pasteAt(this.toWorld(this.mousePos.x, this.mousePos.y)); return; }
            else if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
            else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.redo(); return; }
            else if (k === 's') { e.preventDefault(); this.saveGraph(); return; }
            else if (k === 'o') { e.preventDefault(); document.getElementById('file-input').click(); return; }
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selNodes.size || this.selEdges.size) { this.deleteSelectionAction(); }
        }
        if (k === '0') this.resetView();
    }

    handleKeyUp(e) {
        if (e.key === 'Shift') document.body.classList.remove('mode-connect');
    }

    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const mw = this.toWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);

        const newScale = Math.max(0.1, Math.min(5, this.view.scale * factor));

        const startScale = this.view.scale;
        const startX = this.view.x;
        const startY = this.view.y;
        const targetScale = newScale;
        const targetX = (e.clientX - this.canvas.getBoundingClientRect().left) - mw.x * targetScale;
        const targetY = (e.clientY - this.canvas.getBoundingClientRect().top) - mw.y * targetScale;

        const startTime = performance.now();
        const duration = 150;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 2);

            this.view.scale = startScale + (targetScale - startScale) * easeOut;
            this.view.x = startX + (targetX - startX) * easeOut;
            this.view.y = startY + (targetY - startY) * easeOut;

            document.getElementById('zoom-indicator').innerText = Math.round(this.view.scale * 100) + '%';

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
    inBox(p) { return p.x >= this.selBox.x && p.x <= this.selBox.x + this.selBox.w && p.y >= this.selBox.y && p.y <= this.selBox.y + this.selBox.h; }
    resetStats() {
        const safeSet = (id, val) => { const el = document.getElementById(id); if (el) { el.innerText = val; el.classList.remove('loading'); el.style.color = ''; } };
        ['val-v', 'val-e', 'val-max-deg', 'val-min-deg', 'val-avg-deg', 'val-diam'].forEach(i => safeSet(i, (i.includes('v') || i.includes('e')) ? '0' : '-'));
        ['val-chi', 'val-chi-edge', 'val-alpha', 'val-v-conn', 'val-e-conn', 'val-dist', 'val-ham-path', 'val-ham-cycle'].forEach(i => safeSet(i, '-'));
        safeSet('adj-mat', ''); safeSet('adj-eigen', ''); safeSet('lap-mat', ''); safeSet('lap-eigen', '');
        document.getElementById('btn-vis-ham-path').classList.remove('disabled');
        document.getElementById('btn-vis-ham-cycle').classList.remove('disabled');
        this.colData = null; this.edgeColData = null; this.connData = null; this.misData = null; this.hamData = null; this.diamPath = null; this.selDistPath = null; this.updateSelectionStats();
    }
    updateSelectionStats() { const r = document.getElementById('row-dist'), v = document.getElementById('val-dist'); if (this.selNodes.size === 2) { const ids = Array.from(this.selNodes), res = this.bfsDist(ids[0], ids[1]); r.classList.remove('inactive'); if (res.found) { v.innerText = res.d; this.selDistPath = res.p; } else { v.innerText = "∞"; this.selDistPath = null; } } else { r.classList.add('inactive'); v.innerText = "-"; this.selDistPath = null; } }

    updVis(t, animate = true) {
        const l = document.getElementById('vis-label'), v = document.getElementById('vis-value');
        if (t === 'coloring') { l.innerText = 'Chromatic Number'; v.innerText = 'χ(G) = ' + document.getElementById('val-chi').innerText; this.visData = this.colData; }
        else if (t === 'edgeColor') { l.innerText = 'Edge Index'; v.innerText = "χ'(G) = " + document.getElementById('val-chi-edge').innerText; this.visData = this.edgeColData; }
        else if (t === 'mis') { l.innerText = 'Independence Number'; v.innerText = 'α(G) = ' + document.getElementById('val-alpha').innerText; this.visData = this.misData; }
        else if (t === 'diameter') { l.innerText = 'Diameter'; v.innerText = 'diam(G) = ' + document.getElementById('val-diam').innerText; this.visData = null; }
        else if (t === 'dist') { l.innerText = 'Distance'; v.innerText = 'dist = ' + document.getElementById('val-dist').innerText; this.visData = null; }
        else if (t === 'kappa') { l.innerText = 'Vertex Connectivity'; v.innerText = 'κ = ' + document.getElementById('val-v-conn').innerText; this.visData = this.connData; }
        else if (t === 'lambda') { l.innerText = 'Edge Connectivity'; v.innerText = 'λ = ' + document.getElementById('val-e-conn').innerText; this.visData = this.connData; }
        else if (t === 'ham-path') {
            l.innerText = 'Hamiltonian Path';
            if (this.hamData && this.hamData.path) { v.innerText = 'Found (Len: ' + (this.nodes.length) + ')'; this.visData = this.hamData.path; }
            else { v.innerText = 'Not Found'; this.visData = null; }
        }
        else if (t === 'ham-cycle') {
            l.innerText = 'Hamiltonian Cycle';
            if (this.hamData && this.hamData.cycle) { v.innerText = 'Found (Cycle)'; this.visData = this.hamData.cycle; }
            else { v.innerText = 'Not Found'; this.visData = null; }
        }
    }

    renderMat(m, id) { const el = document.getElementById(id); if (!el) return; let h = '<table>'; m.forEach(r => { h += '<tr>'; r.forEach(v => h += `<td class="${v ? 'nz' : ''}">${v}</td>`); h += '</tr>' }); el.innerHTML = h + '</table>'; }
    saveState() { if (this.undoStack.length > 30) this.undoStack.shift(); this.undoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); this.redoStack = []; }
    undo() { if (this.undoStack.length) { this.redoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); const s = JSON.parse(this.undoStack.pop()); this.restore(s); } }
    redo() { if (this.redoStack.length) { this.undoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); const s = JSON.parse(this.redoStack.pop()); this.restore(s); } }
    restore(s) { this.nodes = s.n; this.edges = s.e; this.nodeIdSeq = s.s; this.clearSel(); this.updateData(); }
    reindex() { const m = new Map(); this.nodes.forEach((n, i) => { m.set(n.id, i); n.id = i; }); this.edges.forEach(e => { e.s = m.get(e.s); e.t = m.get(e.t); }); this.nodeIdSeq = this.nodes.length; }
    clearSel() { this.selNodes.clear(); this.selEdges.clear(); this.updateSelectionStats(); }
    clear() { this.saveState(); this.nodes = []; this.edges = []; this.nodeIdSeq = 0; this.resetStats(); this.exitVis(); this.updateData(); }
    findNode(p) { return this.nodes.find(n => Math.hypot(n.x - p.x, n.y - p.y) < this.config.radius / this.view.scale + 5); }
    findEdge(p) { const t = 8 / this.view.scale; return this.edges.find(e => { const n1 = this.nodes.find(n => n.id === e.s), n2 = this.nodes.find(n => n.id === e.t); if (!n1 || !n2) return false; const d = Math.abs((n2.y - n1.y) * p.x - (n2.x - n1.x) * p.y + n2.x * n1.y - n2.y * n1.x) / Math.hypot(n2.y - n1.y, n2.x - n1.x); return d < t && p.x >= Math.min(n1.x, n2.x) - t && p.x <= Math.max(n1.x, n2.x) + t && p.y >= Math.min(n1.y, n2.y) - t && p.y <= Math.max(n1.y, n2.y) + t; }); }

    loop() {
        this.applyPhysics();
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;
        const time = performance.now();
        const blinkAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time / 150));
        const blinkWidth = 1 + 2 * (0.5 + 0.5 * Math.sin(time / 150));

        const themeColors = this.getThemeColors();

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
        ctx.setTransform(this.view.scale * dpr, 0, 0, this.view.scale * dpr, this.view.x * dpr, this.view.y * dpr);

        if (this.snapLines.length) {
            ctx.beginPath();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5 / this.view.scale;
            ctx.setLineDash([5 / this.view.scale, 5 / this.view.scale]);
            this.snapLines.forEach(l => { ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2) });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        const baseLineWidth = 3;
        const selLineWidth = 5;
        const baseFont = "bold 14px Arial";
        const smallFont = "bold 10px Arial";

        this.edges.forEach((e, i) => {
            const n1 = this.nodes.find(n => n.id === e.s), n2 = this.nodes.find(n => n.id === e.t);
            if (!n1 || !n2) return;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            let s = this.config.colors.edge, w = baseLineWidth;

            const isPreviewSel = this.previewSelEdges && this.previewSelEdges.has(e);
            if (isPreviewSel && !this.selEdges.has(e)) {
                s = 'rgba(59, 130, 246, 0.85)';
                w = selLineWidth - 1;
            }

            const isHovered = this.hoverEdge === e;
            if (isHovered && !this.selEdges.has(e) && !isPreviewSel) {
                s = this.config.colors.node;
                w = baseLineWidth + 1.5;
            }

            if (this.selEdges.has(e)) { s = this.config.colors.selEdge; w = selLineWidth; }
            else if (this.visMode === 'edgeColor' && this.edgeColData) {
                const k = (e.s < e.t ? e.s : e.t) + '-' + (e.s < e.t ? e.t : e.s);
                const c = this.edgeColData[k];
                if (c) { s = `hsl(${(c * 137.5) % 360},75%,50%)`; w = selLineWidth; }
            } else if (this.visMode === 'lambda' && this.connData && this.connData.cutEdges) {
                if (this.connData.cutEdges.some(ce => (ce.s === e.s && ce.t === e.t) || (ce.s === e.t && ce.t === e.s))) {
                    s = this.config.colors.cut; w = baseLineWidth + blinkWidth; ctx.globalAlpha = blinkAlpha;
                }
            }

            const hl = (p) => { for (let j = 0; j < p.length - 1; j++)if ((e.s === p[j] && e.t === p[j + 1]) || (e.s === p[j + 1] && e.t === p[j])) { s = (this.visMode === 'dist') ? this.config.colors.distPath : this.config.colors.diamPath; w = selLineWidth + 1; break; } };
            if (this.visMode === 'diameter' && this.diamPath) hl(this.diamPath);
            if (this.visMode === 'dist' && this.selDistPath) hl(this.selDistPath);

            // 哈密顿高亮逻辑
            if ((this.visMode === 'ham-path' || this.visMode === 'ham-cycle') && this.visData) {
                const path = this.visData;
                for (let k = 0; k < path.length - 1; k++) {
                    const u = path[k], v = path[k + 1];
                    if ((e.s === u && e.t === v) || (e.s === v && e.t === u)) {
                        s = this.config.colors.diamPath;
                        w = selLineWidth + 2;
                        break;
                    }
                }
            }

            ctx.strokeStyle = s; ctx.lineWidth = w; ctx.stroke(); ctx.globalAlpha = 1.0;

            if (this.visMode === 'edgeColor' && this.edgeColData) {
                const k = (e.s < e.t ? e.s : e.t) + '-' + (e.s < e.t ? e.t : e.s);
                const c = this.edgeColData[k];
                if (c) {
                    const mx = (n1.x + n2.x) / 2, my = (n1.y + n2.y) / 2;
                    ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2);
                    ctx.fillStyle = themeColors.badgeBg; ctx.fill(); ctx.strokeStyle = themeColors.badgeBorder; ctx.lineWidth = 1; ctx.stroke();
                    ctx.fillStyle = themeColors.badgeText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = smallFont; ctx.fillText(c, mx, my);
                }
            }
        });

        if (this.drag.active && this.drag.type === 'connect' && this.drag.startNode) {
            ctx.beginPath();
            ctx.moveTo(this.drag.startNode.x, this.drag.startNode.y);
            ctx.lineTo(this.drag.currentPos.x, this.drag.currentPos.y);
            ctx.strokeStyle = this.config.colors.tempEdge;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        const rippleDuration = 400;
        this.ripples = this.ripples.filter(r => {
            const elapsed = time - r.startTime;
            if (elapsed > rippleDuration) return false;
            const progress = elapsed / rippleDuration;
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const radius = r.maxRadius * easeOut;
            const alpha = 0.5 * (1 - progress);
            ctx.beginPath(); ctx.arc(r.x, r.y, radius, 0, Math.PI * 2); ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; ctx.lineWidth = 3 * (1 - progress); ctx.stroke();
            return true;
        });

        this.nodes.forEach(n => {
            ctx.beginPath();
            let fill = this.config.colors.node, badge = null;
            let radius = this.config.radius;
            let shadowBlur = 0;
            let previewStroke = false;
            let showMisBorder = false;

            const creatingAnim = this.creatingNodes.find(c => c.node.id === n.id);
            if (creatingAnim) {
                const elapsed = time - creatingAnim.startTime;
                const progress = Math.min(elapsed / creatingAnim.duration, 1);
                const easeOutBack = 1 + 2.7 * Math.pow(progress - 1, 3) + 1.7 * Math.pow(progress - 1, 2);
                radius = this.config.radius * Math.min(easeOutBack, 1.1);
                if (progress >= 1) {
                    this.creatingNodes = this.creatingNodes.filter(c => c.node.id !== n.id);
                }
            }

            const isPreviewSel = this.previewSelNodes && this.previewSelNodes.has(n.id);
            if (isPreviewSel && !this.selNodes.has(n.id)) {
                previewStroke = true;
            }

            const isHovered = this.hoverNode && this.hoverNode.id === n.id;
            if (isHovered && !this.selNodes.has(n.id) && !isPreviewSel) {
                radius = this.config.radius * 1.15;
                shadowBlur = 12;
            }

            if (this.visMode === 'coloring' && this.visData) {
                const c = this.visData[n.id];
                if (c) { fill = `hsl(${(c * 137.5) % 360},75%,60%)`; badge = c; }
            } else if (this.visMode === 'mis' && this.visData) {
                if (this.visData[n.id]) {
                    fill = this.config.colors.sel;
                    showMisBorder = true;
                }
            } else if (this.visMode === 'kappa' && this.connData && this.connData.cutNodes.has(n.id)) {
                fill = this.config.colors.cut; ctx.globalAlpha = blinkAlpha;
            } else if (this.visMode === 'diameter' && this.diamPath && this.diamPath.includes(n.id)) fill = this.config.colors.diamPath;
            else if (this.visMode === 'dist' && this.selDistPath && this.selDistPath.includes(n.id)) fill = this.config.colors.distPath;
            else if (this.selNodes.has(n.id)) fill = this.config.colors.sel;

            if (shadowBlur > 0) {
                ctx.shadowColor = 'rgba(99, 102, 241, 0.4)'; ctx.shadowBlur = shadowBlur; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
            }

            ctx.fillStyle = fill;
            ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

            ctx.lineWidth = 2; ctx.strokeStyle = themeColors.nodeStroke; ctx.stroke();
            ctx.fillStyle = themeColors.nodeText; ctx.font = baseFont; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(n.id + 1, n.x, n.y);

            if (previewStroke) {
                ctx.beginPath(); ctx.arc(n.x, n.y, radius + 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)'; ctx.lineWidth = 3; ctx.stroke();
            }

            if (showMisBorder) {
                ctx.beginPath(); ctx.arc(n.x, n.y, radius + 5, 0, Math.PI * 2); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
            }

            if (badge !== null) {
                ctx.beginPath(); ctx.arc(n.x + 11, n.y - 11, 9, 0, Math.PI * 2);
                ctx.fillStyle = themeColors.badgeBg; ctx.fill(); ctx.strokeStyle = themeColors.badgeBorder; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = themeColors.badgeText; ctx.font = smallFont; ctx.fillText(badge, n.x + 11, n.y - 11);
            }
        });

        this.deletingNodes = this.deletingNodes.filter(d => {
            const elapsed = time - d.startTime;
            if (elapsed > d.duration) return false;
            const progress = elapsed / d.duration;
            const alpha = 1 - progress;
            const scale = 1 - progress * 0.3;
            ctx.beginPath(); ctx.globalAlpha = alpha; ctx.fillStyle = this.config.colors.sel; ctx.arc(d.node.x, d.node.y, this.config.radius * scale, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
            return true;
        });

        if (this.selBox) {
            ctx.fillStyle = themeColors.selBoxFill; ctx.fillRect(this.selBox.x, this.selBox.y, this.selBox.w, this.selBox.h);
            ctx.strokeStyle = this.config.colors.node; ctx.lineWidth = 1; ctx.strokeRect(this.selBox.x, this.selBox.y, this.selBox.w, this.selBox.h);
        }

        requestAnimationFrame(() => this.loop());
    }
}

const app = new GraphApp();
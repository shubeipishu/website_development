
export class Algorithms {
    constructor(app) {
        this.app = app;
        this.worker = null;
        this.isCalculating = false;
        this.restartWorker();
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

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        this.isCalculating = false;
        const i18n = window.GraphI18n;
        const t = (key, vars) => (i18n?.t ? i18n.t(key, vars) : key);

        if (type === 'result') {
            this.app.ui.setVal('val-max-deg', data.degrees.max);
            this.app.ui.setVal('val-min-deg', data.degrees.min);
            this.app.ui.setVal('val-avg-deg', typeof data.degrees.avg === 'number' ? data.degrees.avg.toFixed(2) : '-');

            this.app.connVal = {
                kappa: data.connectivity.kappa,
                lambda: data.connectivity.lambda
            };
            this.app.ui.setVal('val-v-conn', this.formatSlowValue(data.connectivity.kappa, t));
            this.app.ui.setVal('val-e-conn', this.formatSlowValue(data.connectivity.lambda, t));
            this.app.connData = {
                cutNodes: new Set(data.connectivity.cutNodes),
                cutEdges: data.connectivity.cutEdges
            };

            this.app.ui.setVal('val-chi-edge', data.edgeColoring.chi);
            this.app.edgeColData = data.edgeColoring.mapping;

            this.app.hamData = data.hamiltonian;
            const btnPath = document.getElementById('btn-vis-ham-path');
            const valPath = document.getElementById('val-ham-path');
            const btnCycle = document.getElementById('btn-vis-ham-cycle');
            const valCycle = document.getElementById('val-ham-cycle');

            this.updateHamLabels(t);

            this.app.ui.renderMat(data.matrices.adj, 'adj-mat');
            this.app.ui.renderMat(data.matrices.lap, 'lap-mat');
            this.app.ui.renderEigen(data.eigen.adj, 'adj');
            this.app.ui.renderEigen(data.eigen.lap, 'lap');

            document.querySelectorAll('.stat-val').forEach(el => el.classList.remove('loading'));

            if (this.app.visMode) this.updVis(this.app.visMode, false);
        }
    }

    formatSlowValue(value, t) {
        if (typeof value === 'string' && value.includes('skip')) {
            const match = value.match(/>(\\d+)/);
            if (match) return t('stats.slow', { n: match[1] });
            return t('common.slow');
        }
        return value;
    }

    updateHamLabels(t) {
        const btnPath = document.getElementById('btn-vis-ham-path');
        const valPath = document.getElementById('val-ham-path');
        const btnCycle = document.getElementById('btn-vis-ham-cycle');
        const valCycle = document.getElementById('val-ham-cycle');

        if (!this.app.hamData) return;

        if (this.app.hamData.msg && this.app.hamData.msg.includes('skip')) {
            valPath.innerText = t('common.slow'); btnPath.classList.add('disabled');
            valCycle.innerText = t('common.slow'); btnCycle.classList.add('disabled');
            return;
        }

        btnPath.classList.remove('disabled');
        btnCycle.classList.remove('disabled');

        if (this.app.hamData.path) {
            valPath.innerText = t('vis.found'); valPath.style.color = '#10b981';
        } else {
            valPath.innerText = t('vis.notFound'); valPath.style.color = '#ef4444';
        }

        if (this.app.hamData.cycle) {
            valCycle.innerText = t('vis.found'); valCycle.style.color = '#10b981';
        } else {
            valCycle.innerText = t('vis.notFound'); valCycle.style.color = '#ef4444';
        }
    }

    applyI18n() {
        const i18n = window.GraphI18n;
        const t = (key, vars) => (i18n?.t ? i18n.t(key, vars) : key);

        if (this.app.connVal) {
            this.app.ui.setVal('val-v-conn', this.formatSlowValue(this.app.connVal.kappa, t));
            this.app.ui.setVal('val-e-conn', this.formatSlowValue(this.app.connVal.lambda, t));
        }
        this.updateHamLabels(t);
        if (this.app.visMode) this.updVis(this.app.visMode, false);
    }

    updateData() {
        const V = this.app.nodes.length;
        this.app.ui.setVal('val-v', V);
        this.app.ui.setVal('val-e', this.app.edges.length);

        if (V === 0) { this.app.resetStats(); return; }

        this.updateFastStats();

        if (this.isCalculating) this.restartWorker();

        const nodesClean = this.app.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        const edgesClean = this.app.edges.map(e => ({ s: e.s, t: e.t }));

        ['val-v-conn', 'val-e-conn', 'val-chi-edge', 'val-max-deg', 'val-min-deg', 'val-avg-deg', 'val-ham-path', 'val-ham-cycle'].forEach(id => {
            document.getElementById(id).classList.add('loading');
        });

        this.isCalculating = true;
        if (this.worker) {
            this.worker.postMessage({ cmd: 'compute_all', nodes: nodesClean, edges: edgesClean });
        } else {
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
        const V = this.app.nodes.length;
        const m = new Map();
        this.app.nodes.forEach((n, i) => m.set(n.id, i));
        const adj = Array(V).fill(0).map(() => Array(V).fill(0));
        const validEdges = this.app.edges.filter(e => m.has(e.s) && m.has(e.t));
        validEdges.forEach(e => {
            const u = m.get(e.s), v = m.get(e.t);
            adj[u][v] = 1; adj[v][u] = 1;
        });
        try { this.calcDiameter(adj, V, m); } catch (e) { }
        try { this.calcColor(adj, V); } catch (e) { }
        try { this.calcMIS(adj, V); } catch (e) { }
        this.app.updateSelectionStats();
    }

    calcColor(adj, N) { const cIdx = this.solveColorDSatur(adj, N); this.app.colData = {}; cIdx.forEach((c, i) => { this.app.colData[this.app.nodes[i].id] = c; }); document.getElementById('val-chi').innerText = Math.max(...cIdx); if (this.app.visMode === 'coloring') this.updVis('coloring', false); }
    solveColorDSatur(adj, N) { let c = Array(N).fill(0), d = adj.map(r => r.reduce((a, b) => a + b, 0)), s = Array(N).fill(0), u = new Set(); for (let i = 0; i < N; i++)u.add(i); while (u.size > 0) { let ms = -1, p = -1; for (let x of u) { if (s[x] > ms) { ms = s[x]; p = x; } else if (s[x] === ms) { if (d[x] > (p === -1 ? -1 : d[p])) p = x; } } u.delete(p); let nc = new Set(); for (let v = 0; v < N; v++)if (adj[p][v] && c[v] !== 0) nc.add(c[v]); let k = 1; while (nc.has(k)) k++; c[p] = k; for (let v = 0; v < N; v++)if (adj[p][v] && c[v] === 0) { let sc = new Set(); for (let z = 0; z < N; z++)if (adj[v][z] && c[z] !== 0) sc.add(c[z]); s[v] = sc.size; } } return c; }
    calcMIS(adj, N) { let comp = Array(N).fill(0).map(() => []); for (let i = 0; i < N; i++)for (let j = i + 1; j < N; j++)if (!adj[i][j]) { comp[i].push(j); comp[j].push(i); } let maxC = []; const BK = (R, P, X) => { if (!P.length && !X.length) { if (R.length > maxC.length) maxC = R.slice(); return; } let u = (P.length ? P[0] : X[0]), Pnu = P.filter(v => !comp[u].includes(v)); for (let v of Pnu) { BK([...R, v], P.filter(x => comp[v].includes(x)), X.filter(x => comp[v].includes(x))); P = P.filter(x => x !== v); X.push(v); } }; BK([], Array.from({ length: N }, (_, i) => i), []); this.app.misData = {}; const ms = new Set(maxC); this.app.nodes.forEach((n, i) => { this.app.misData[n.id] = ms.has(i); }); document.getElementById('val-alpha').innerText = maxC.length; if (this.app.visMode === 'mis') this.updVis('mis', false); }
    calcDiameter(adj, V, idMap) { let max = 0, path = [], conn = true; for (let i = 0; i < V; i++) { let d = Array(V).fill(-1), p = Array(V).fill(null), q = [i]; d[i] = 0; let r = 0; while (q.length) { let u = q.shift(); r++; if (d[u] > max) { max = d[u]; let t = [], c = u; while (c !== null) { t.unshift(c); c = p[c]; } path = t; } for (let v = 0; v < V; v++)if (adj[u][v] && d[v] === -1) { d[v] = d[u] + 1; p[v] = u; q.push(v); } } if (r < V) conn = false; } const b = document.getElementById('btn-vis-diameter'); if (!conn) { document.getElementById('val-diam').innerText = "∞"; this.app.diamPath = null; if (b) b.classList.add('disabled'); } else { document.getElementById('val-diam').innerText = max; const inv = new Map(); idMap.forEach((v, k) => inv.set(v, k)); this.app.diamPath = path.map(i => inv.get(i)); if (b) b.classList.remove('disabled'); } }
    bfsDist(s, e) { let q = [s], vis = new Map(); vis.set(s, null); while (q.length) { let u = q.shift(); if (u === e) { let p = [], c = e; while (c !== null) { p.unshift(c); c = vis.get(c); } return { found: true, d: p.length - 1, p: p }; } this.app.edges.forEach(g => { let v = null; if (g.s === u) v = g.t; else if (g.t === u) v = g.s; if (v !== null && !vis.has(v)) { vis.set(v, u); q.push(v); } }); } return { found: false }; }

    visualize(t) {
        if (!this.app.nodes.length) return;
        if (this.app.visMode === t) { this.exitVis(); return; }
        if (t === 'diameter' && !this.app.diamPath) return;
        if (t === 'dist' && !this.app.selDistPath) return;
        if (t === 'ham-path' && (!this.app.hamData || !this.app.hamData.path)) return;
        if (t === 'ham-cycle' && (!this.app.hamData || !this.app.hamData.cycle)) return;

        const isSwitching = this.app.visMode !== null;
        this.app.visMode = t;
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

    exitVis() { this.app.visMode = null; this.app.visData = null; document.getElementById('vis-banner').classList.remove('show'); document.querySelectorAll('.link-btn').forEach(b => b.classList.remove('active-vis')); }

    updVis(t, animate = true) {
        const l = document.getElementById('vis-label'), v = document.getElementById('vis-value');
        const i18n = window.GraphI18n;
        const tr = (key, vars) => (i18n?.t ? i18n.t(key, vars) : key);
        if (t === 'coloring') { l.innerText = tr('vis.chromatic'); v.innerText = 'χ(G) = ' + document.getElementById('val-chi').innerText; this.app.visData = this.app.colData; }
        else if (t === 'edgeColor') { l.innerText = tr('vis.edgeChromatic'); v.innerText = "χ'(G) = " + document.getElementById('val-chi-edge').innerText; this.app.visData = this.app.edgeColData; }
        else if (t === 'mis') { l.innerText = tr('vis.independence'); v.innerText = 'α(G) = ' + document.getElementById('val-alpha').innerText; this.app.visData = this.app.misData; }
        else if (t === 'diameter') { l.innerText = tr('vis.diameter'); v.innerText = 'diam(G) = ' + document.getElementById('val-diam').innerText; this.app.visData = null; }
        else if (t === 'dist') { l.innerText = tr('vis.distance'); v.innerText = 'dist = ' + document.getElementById('val-dist').innerText; this.app.visData = null; }
        else if (t === 'kappa') { l.innerText = tr('vis.vertexConnectivity'); v.innerText = 'κ = ' + document.getElementById('val-v-conn').innerText; this.app.visData = this.app.connData; }
        else if (t === 'lambda') { l.innerText = tr('vis.edgeConnectivity'); v.innerText = 'λ = ' + document.getElementById('val-e-conn').innerText; this.app.visData = this.app.connData; }
        else if (t === 'ham-path') {
            l.innerText = tr('vis.hamPath');
            if (this.app.hamData && this.app.hamData.path) { v.innerText = tr('vis.foundLen', { n: this.app.nodes.length }); this.app.visData = this.app.hamData.path; }
            else { v.innerText = tr('vis.notFound'); this.app.visData = null; }
        }
        else if (t === 'ham-cycle') {
            l.innerText = tr('vis.hamCycle');
            if (this.app.hamData && this.app.hamData.cycle) { v.innerText = tr('vis.foundCycle'); this.app.visData = this.app.hamData.cycle; }
            else { v.innerText = tr('vis.notFound'); this.app.visData = null; }
        }
    }
}


export class Generator {
    constructor(app) {
        this.app = app;
        this.currentGenType = null;
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

        this.app.ui.renderDescWithLatex('gen-display-desc', item.desc);

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
        this.app.saveState(); let startId = 0;
        if (!isAppend) { this.app.nodes = []; this.app.edges = []; this.app.nodeIdSeq = 0; this.app.resetStats(); } else { startId = this.app.nodeIdSeq; }
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

        let targetX = 0, targetY = 0;
        const dpr = window.devicePixelRatio || 1;
        let screenW = this.app.canvas.width / dpr;
        let screenH = this.app.canvas.height / dpr;
        const panel = document.getElementById('panel-drawer');
        if (panel && !panel.classList.contains('closed')) {
            screenW -= 380;
        }
        const screenCx = screenW / 2;
        const screenCy = screenH / 2;
        const worldCx = (screenCx - this.app.view.x) / this.app.view.scale;
        const worldCy = (screenCy - this.app.view.y) / this.app.view.scale;

        if (isAppend) {
            const jitterX = (Math.random() - 0.5) * 120;
            const jitterY = (Math.random() - 0.5) * 120;
            targetX = worldCx + jitterX;
            targetY = worldCy + jitterY;
        } else {
            targetX = worldCx;
            targetY = worldCy;
        }
        tmpNodes.forEach(n => { n.x += targetX; n.y += targetY; n.id += startId; }); tmpEdges.forEach(e => { e.s += startId; e.t += startId; }); this.app.nodes = this.app.nodes.concat(tmpNodes); this.app.edges = this.app.edges.concat(tmpEdges); this.app.nodeIdSeq = startId + tmpNodes.length;
        this.app.algorithms.updateData(); this.app.clearSel(); tmpNodes.forEach(n => this.app.selNodes.add(n.id)); tmpEdges.forEach(e => this.app.selEdges.add(e)); this.app.updateSelectionStats(); this.hideGenerator(); if (!isAppend) this.app.resetView();
    }
}

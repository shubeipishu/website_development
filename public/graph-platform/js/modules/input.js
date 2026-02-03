
export class InputHandler {
    constructor(app) {
        this.app = app;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.spacePressed = false;
    }

    calcSnap(id, tx, ty) {
        if (!this.app.snapEnabled) return { x: tx, y: ty, lines: [] };
        const t = 8 / this.app.view.scale;
        let bx = tx, by = ty, lines = [], snapped = { x: false, y: false };
        const connected = [], others = [];
        this.app.edges.forEach(e => { if (e.s === id) connected.push(this.app.nodes.find(n => n.id === e.t)); else if (e.t === id) connected.push(this.app.nodes.find(n => n.id === e.s)); });
        this.app.nodes.forEach(n => { if (n.id !== id) others.push(n); });
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

    handleDblClick(e) {
        const mw = this.app.renderer.toWorld(e.clientX - this.app.canvas.getBoundingClientRect().left, e.clientY - this.app.canvas.getBoundingClientRect().top);
        const n = this.app.findNode(mw);
        if (!n) {
            this.app.saveState();
            const newNode = { id: this.app.nodeIdSeq++, x: mw.x, y: mw.y };
            this.app.nodes.push(newNode);
            this.app.creatingNodes.push({ node: newNode, startTime: performance.now(), duration: 300 });
            this.app.algorithms.updateData();
        }
    }

    handleDown(e) {
        if (e.button === 1 || (e.button === 0 && this.spacePressed)) {
            this.isPanning = true;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.app.canvas.style.cursor = 'grabbing';
            return;
        }
        if (e.button !== 0) return;

        const mw = this.app.renderer.toWorld(e.clientX - this.app.canvas.getBoundingClientRect().left, e.clientY - this.app.canvas.getBoundingClientRect().top);
        const n = this.app.findNode(mw), ed = n ? null : this.app.findEdge(mw);

        if (e.shiftKey && n) {
            this.app.drag = { active: true, type: 'connect', startNode: n, currentPos: mw };
            return;
        }

        if (n) {
            if (!e.ctrlKey && !this.app.selNodes.has(n.id)) {
                this.app.clearSel(); this.app.selNodes.add(n.id);
                this.app.ripples.push({ x: n.x, y: n.y, startTime: performance.now(), maxRadius: this.app.config.radius * 2 });
            } else if (e.ctrlKey) {
                if (this.app.selNodes.has(n.id)) this.app.selNodes.delete(n.id);
                else {
                    this.app.selNodes.add(n.id);
                    this.app.ripples.push({ x: n.x, y: n.y, startTime: performance.now(), maxRadius: this.app.config.radius * 2 });
                }
            }
            this.app.drag = { active: true, type: 'node', start: mw, offsets: new Map() };
            this.app.selNodes.forEach(id => {
                const node = this.app.nodes.find(x => x.id === id);
                this.app.drag.offsets.set(id, { dx: node.x - mw.x, dy: node.y - mw.y });
            });
            this.app.updateSelectionStats();
            return;
        }

        if (ed) {
            if (!e.ctrlKey) { this.app.clearSel(); this.app.selEdges.add(ed); }
            else {
                if (this.app.selEdges.has(ed)) this.app.selEdges.delete(ed);
                else this.app.selEdges.add(ed);
            }
            this.app.updateSelectionStats();
            return;
        }

        if (!e.ctrlKey) this.app.clearSel();
        this.app.drag = { active: true, type: 'box', start: mw };
        this.app.selBox = { x: mw.x, y: mw.y, w: 0, h: 0 };
    }

    handleMove(e) {
        this.app.mousePos = { x: e.clientX - this.app.canvas.getBoundingClientRect().left, y: e.clientY - this.app.canvas.getBoundingClientRect().top };
        const mw = this.app.renderer.toWorld(this.app.mousePos.x, this.app.mousePos.y);

        if (this.isPanning) {
            this.app.view.x += e.clientX - this.panStart.x;
            this.app.view.y += e.clientY - this.panStart.y;
            this.panStart = { x: e.clientX, y: e.clientY };
            this.app.canvas.style.cursor = 'grabbing';
            return;
        }

        this.app.snapLines = [];
        const hoverNode = this.app.findNode(mw);
        const hoverEdge = hoverNode ? null : this.app.findEdge(mw);

        this.app.hoverNode = hoverNode;
        this.app.hoverEdge = hoverEdge;

        if (this.spacePressed) {
            this.app.canvas.style.cursor = 'grab';
        } else if (e.shiftKey && hoverNode) this.app.canvas.style.cursor = 'crosshair';
        else if (hoverNode || hoverEdge) this.app.canvas.style.cursor = 'pointer';
        else this.app.canvas.style.cursor = 'default';

        if (!this.app.drag.active) return;

        if (this.app.drag.type === 'connect') {
            this.app.drag.currentPos = mw;
        }
        else if (this.app.drag.type === 'node') {
            let dx = 0, dy = 0;
            if (this.app.selNodes.size === 1 && this.app.snapEnabled && !this.app.physics.active) {
                const nid = this.app.selNodes.values().next().value;
                const off = this.app.drag.offsets.get(nid);
                const snap = this.calcSnap(nid, mw.x + off.dx, mw.y + off.dy);
                dx = snap.x - (mw.x + off.dx);
                dy = snap.y - (mw.y + off.dy);
                this.app.snapLines = snap.lines;
            }
            this.app.selNodes.forEach(id => {
                const n = this.app.nodes.find(x => x.id === id);
                if (n) {
                    const off = this.app.drag.offsets.get(id);
                    n.x = mw.x + off.dx + dx;
                    n.y = mw.y + off.dy + dy;
                }
            });
        }
        else if (this.app.drag.type === 'box') {
            this.app.selBox = {
                x: Math.min(this.app.drag.start.x, mw.x),
                y: Math.min(this.app.drag.start.y, mw.y),
                w: Math.abs(mw.x - this.app.drag.start.x),
                h: Math.abs(mw.y - this.app.drag.start.y)
            };

            this.app.previewSelNodes = new Set();
            this.app.previewSelEdges = new Set();

            this.app.nodes.forEach(n => {
                if (this.inBox(n)) {
                    this.app.previewSelNodes.add(n.id);
                }
            });

            this.app.edges.forEach(e => {
                const n1 = this.app.nodes.find(n => n.id === e.s);
                const n2 = this.app.nodes.find(n => n.id === e.t);
                if (n1 && n2 && this.inBox({ x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 })) {
                    this.app.previewSelEdges.add(e);
                }
            });
        }
    }

    handleUp() {
        this.isPanning = false;
        if (!this.app.drag.active) return;

        if (this.app.drag.type === 'connect') {
            const endNode = this.app.findNode(this.app.drag.currentPos);
            if (endNode && endNode.id !== this.app.drag.startNode.id) {
                const exists = this.app.edges.some(x => (x.s === this.app.drag.startNode.id && x.t === endNode.id) || (x.s === endNode.id && x.t === this.app.drag.startNode.id));
                if (!exists) {
                    this.app.saveState();
                    this.app.edges.push({ s: this.app.drag.startNode.id, t: endNode.id });
                    this.app.algorithms.updateData();
                }
            } else if (!endNode) {
                this.app.saveState();
                const newId = this.app.nodeIdSeq++;
                const newNode = { id: newId, x: this.app.drag.currentPos.x, y: this.app.drag.currentPos.y };
                this.app.nodes.push(newNode);
                this.app.edges.push({ s: this.app.drag.startNode.id, t: newId });
                this.app.creatingNodes.push({ node: newNode, startTime: performance.now(), duration: 300 });
                this.app.algorithms.updateData();
            }
        }
        else if (this.app.drag.type === 'box') {
            if (this.app.selBox.w > 0 || this.app.selBox.h > 0) {
                this.app.nodes.forEach(n => {
                    if (this.inBox(n)) this.app.selNodes.add(n.id);
                });
                this.app.edges.forEach(ed => {
                    const n1 = this.app.nodes.find(n => n.id === ed.s), n2 = this.app.nodes.find(n => n.id === ed.t);
                    if (n1 && n2 && this.inBox({ x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 })) this.app.selEdges.add(ed);
                });
            }
        }

        this.app.drag.active = false;
        this.app.selBox = null;
        this.app.snapLines = [];
        this.app.previewSelNodes = null;
        this.app.previewSelEdges = null;
        this.app.updateSelectionStats();
    }

    inBox(p) { return p.x >= this.app.selBox.x && p.x <= this.app.selBox.x + this.app.selBox.w && p.y >= this.app.selBox.y && p.y <= this.app.selBox.y + this.app.selBox.h; }

    handleKey(e) {
        if (e.key === ' ' && !e.repeat && e.target.tagName !== 'INPUT') {
            this.spacePressed = true;
            if (!this.isPanning) this.app.canvas.style.cursor = 'grab';
            // Prevent space from scrolling page if focused
            // e.preventDefault(); // Optional: typically good for canvas apps
        }

        if (e.key === 'Escape') {
            if (document.getElementById('gen-modal').classList.contains('active') ||
                document.getElementById('export-modal').classList.contains('active')) {
                this.app.ui.hideAllModals();
                return;
            }
            this.app.clearSel();
            return;
        }
        if (e.target.tagName === 'INPUT') return;

        const k = e.key.toLowerCase();

        if (e.key === 'Shift') document.body.classList.add('mode-connect');

        if ((e.ctrlKey || e.metaKey)) {
            if (k === 'a') { e.preventDefault(); this.app.selectAll(); return; }
            else if (k === 'c') { e.preventDefault(); this.app.copySelection(); return; }
            else if (k === 'd') { e.preventDefault(); this.app.duplicateSelection(); return; }
            else if (k === 'x') { e.preventDefault(); this.app.cutSelection(); return; }
            else if (k === 'v') { e.preventDefault(); this.app.pasteAt(this.app.renderer.toWorld(this.app.mousePos.x, this.app.mousePos.y)); return; }
            else if (k === 'z' && !e.shiftKey) { e.preventDefault(); this.app.undo(); return; }
            else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); this.app.redo(); return; }
            else if (k === 's') { e.preventDefault(); this.app.exporter.saveGraph(); return; }
            else if (k === 'o') { e.preventDefault(); document.getElementById('file-input').click(); return; }
            return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.app.selNodes.size || this.app.selEdges.size) { this.app.deleteSelectionAction(); }
        }
        if (k === '0') this.app.resetView();
    }

    handleKeyUp(e) {
        if (e.key === ' ') {
            this.spacePressed = false;
            if (!this.isPanning) this.app.canvas.style.cursor = 'default';
        }
        if (e.key === 'Shift') document.body.classList.remove('mode-connect');
    }

    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const mw = this.app.renderer.toWorld(e.clientX - this.app.canvas.getBoundingClientRect().left, e.clientY - this.app.canvas.getBoundingClientRect().top);

        const newScale = Math.max(0.1, Math.min(5, this.app.view.scale * factor));

        const startScale = this.app.view.scale;
        const startX = this.app.view.x;
        const startY = this.app.view.y;
        const targetScale = newScale;
        const targetX = (e.clientX - this.app.canvas.getBoundingClientRect().left) - mw.x * targetScale;
        const targetY = (e.clientY - this.app.canvas.getBoundingClientRect().top) - mw.y * targetScale;

        const startTime = performance.now();
        const duration = 150;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 2);

            this.app.view.scale = startScale + (targetScale - startScale) * easeOut;
            this.app.view.x = startX + (targetX - startX) * easeOut;
            this.app.view.y = startY + (targetY - startY) * easeOut;

            document.getElementById('zoom-indicator').innerText = Math.round(this.app.view.scale * 100) + '%';

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

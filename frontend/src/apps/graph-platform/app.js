
import { Renderer } from './modules/renderer.js';
import { InputHandler } from './modules/input.js';
import { UI } from './modules/ui.js';
import { Physics } from './modules/physics.js';
import { Generator } from './modules/generator.js';
import { Exporter } from './modules/exporter.js';
import { Algorithms } from './modules/algorithms.js';

export class GraphApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('main');

        this.nodes = []; this.edges = []; this.nodeIdSeq = 0;
        this.view = { x: 0, y: 0, scale: 1.0 };

        // --- Core State ---
        this.selNodes = new Set(); this.selEdges = new Set();
        this.undoStack = []; this.redoStack = [];

        this.drag = { active: false, type: null, start: null, startNode: null, offsets: new Map() };
        this.snapEnabled = true; this.snapLines = [];
        
        // Visualization State (managed by Algorithms, but shared here for easy access if needed)
        this.visMode = null;
        this.visData = null;
        this.connData = null;
        this.colData = null;
        this.edgeColData = null;
        this.misData = null;
        this.hamData = null;
        this.diamPath = null; this.selDistPath = null;

        this.mousePos = { x: 0, y: 0 }; this.clipboard = null;
        this.themeTransition = { active: false, startTime: 0, duration: 300, from: 'light', to: 'dark' };

        // Animation/Interaction State
        this.hoverNode = null;
        this.hoverEdge = null;
        this.ripples = [];
        this.deletingNodes = [];
        this.deletingEdges = [];
        this.creatingNodes = [];
        this.previewSelNodes = null;
        this.previewSelEdges = null;
        this.selBox = null;
        this.animating = false;

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

        // Initialize Modules
        this.renderer = new Renderer(this);
        this.input = new InputHandler(this);
        this.ui = new UI(this);
        this.physics = new Physics(this);
        this.generator = new Generator(this);
        this.exporter = new Exporter(this);
        this.algorithms = new Algorithms(this);

        this.init();
    }

    init() {
        window.addEventListener('resize', () => this.renderer.resize());
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) this.ui.loadTheme();
        });
        document.addEventListener('visibilitychange', () => {
            this.paused = document.hidden;
        });
        this.paused = document.hidden;
        this.renderer.resize();
        this.ui.renderLatexUI();
        this.generator.renderGenSidebar();
        this.ui.loadTheme();

        // Event Listeners
        this.canvas.addEventListener('mousedown', e => this.input.handleDown(e));
        window.addEventListener('mousemove', e => this.input.handleMove(e));
        window.addEventListener('mouseup', e => this.input.handleUp(e));
        this.canvas.addEventListener('wheel', e => this.input.handleWheel(e), { passive: false });
        this.canvas.addEventListener('dblclick', e => this.input.handleDblClick(e));
        this.canvas.addEventListener('contextmenu', e => this.ui.handleRightClick(e));
        document.addEventListener('click', () => document.getElementById('context-menu').style.display = 'none');

        document.addEventListener('keydown', e => this.input.handleKey(e));
        document.addEventListener('keyup', e => this.input.handleKeyUp(e));

        this.renderer.loop();
    }

    // --- Core Logic & Helpers ---

    saveState() { if (this.undoStack.length > 30) this.undoStack.shift(); this.undoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); this.redoStack = []; }
    undo() { if (this.undoStack.length) { this.redoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); const s = JSON.parse(this.undoStack.pop()); this.restore(s); } }
    redo() { if (this.redoStack.length) { this.undoStack.push(JSON.stringify({ n: this.nodes, e: this.edges, s: this.nodeIdSeq })); const s = JSON.parse(this.redoStack.pop()); this.restore(s); } }
    restore(s) { this.nodes = s.n; this.edges = s.e; this.nodeIdSeq = s.s; this.clearSel(); this.algorithms.updateData(); }
    
    reindex() { const m = new Map(); this.nodes.forEach((n, i) => { m.set(n.id, i); n.id = i; }); this.edges.forEach(e => { e.s = m.get(e.s); e.t = m.get(e.t); }); this.nodeIdSeq = this.nodes.length; }
    
    clearSel() { this.selNodes.clear(); this.selEdges.clear(); this.updateSelectionStats(); }
    
    clear() { this.saveState(); this.nodes = []; this.edges = []; this.nodeIdSeq = 0; this.resetStats(); this.algorithms.exitVis(); this.algorithms.updateData(); }
    
    resetStats() {
        const safeSet = (id, val) => { const el = document.getElementById(id); if (el) { el.innerText = val; el.classList.remove('loading'); el.style.color = ''; } };
        ['val-v', 'val-e', 'val-max-deg', 'val-min-deg', 'val-avg-deg', 'val-diam'].forEach(i => safeSet(i, (i.includes('v') || i.includes('e')) ? '0' : '-'));
        ['val-chi', 'val-chi-edge', 'val-alpha', 'val-v-conn', 'val-e-conn', 'val-dist', 'val-ham-path', 'val-ham-cycle'].forEach(i => safeSet(i, '-'));
        safeSet('adj-mat', ''); safeSet('adj-eigen', ''); safeSet('lap-mat', ''); safeSet('lap-eigen', '');
        document.getElementById('btn-vis-ham-path').classList.remove('disabled');
        document.getElementById('btn-vis-ham-cycle').classList.remove('disabled');
        this.colData = null; this.edgeColData = null; this.connData = null; this.misData = null; this.hamData = null; this.diamPath = null; this.selDistPath = null; this.updateSelectionStats();
    }

    updateSelectionStats() { const r = document.getElementById('row-dist'), v = document.getElementById('val-dist'); if (this.selNodes.size === 2) { const ids = Array.from(this.selNodes), res = this.algorithms.bfsDist(ids[0], ids[1]); r.classList.remove('inactive'); if (res.found) { v.innerText = res.d; this.selDistPath = res.p; } else { v.innerText = "∞"; this.selDistPath = null; } } else { r.classList.add('inactive'); v.innerText = "-"; this.selDistPath = null; } }

    findNode(p) { return this.nodes.find(n => Math.hypot(n.x - p.x, n.y - p.y) < this.config.radius / this.view.scale + 5); }
    findEdge(p) { const t = 8 / this.view.scale; return this.edges.find(e => { const n1 = this.nodes.find(n => n.id === e.s), n2 = this.nodes.find(n => n.id === e.t); if (!n1 || !n2) return false; const d = Math.abs((n2.y - n1.y) * p.x - (n2.x - n1.x) * p.y + n2.x * n1.y - n2.y * n1.x) / Math.hypot(n2.y - n1.y, n2.x - n1.x); return d < t && p.x >= Math.min(n1.x, n2.x) - t && p.x <= Math.max(n1.x, n2.x) + t && p.y >= Math.min(n1.y, n2.y) - t && p.y <= Math.max(n1.y, n2.y) + t; }); }

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

    // --- Selection / Clipboard Operations ---

    copySelection() { if (this.selNodes.size === 0 && this.selEdges.size === 0) return; const nA = [], eA = []; let minX = Infinity, minY = Infinity; this.selNodes.forEach(id => { const n = this.nodes.find(x => x.id === id); if (n) { nA.push({ ...n }); minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); } }); const ns = new Set(this.selNodes); this.edges.forEach(e => { if (ns.has(e.s) && ns.has(e.t)) eA.push({ ...e }) }); if (nA.length === 0) return; nA.forEach(n => { n.x -= minX; n.y -= minY }); this.clipboard = { nodes: nA, edges: eA }; }
    pasteFromMenu() { this.pasteAt(this.renderer.toWorld(parseInt(document.getElementById('context-menu').style.left), parseInt(document.getElementById('context-menu').style.top))); }
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
        this.algorithms.updateData(); this.updateSelectionStats();
    }
    cutSelection() { this.copySelection(); this.deleteSelectionAction(); }
    duplicateSelection() { if (this.selNodes.size > 0) { this.copySelection(); const fId = this.selNodes.values().next().value; const n = this.nodes.find(x => x.id === fId); this.pasteAt({ x: n.x + 30, y: n.y + 30 }); } }

    deleteSelectionAction() {
        this.saveState();
        if (this.selEdges.size > 0) { this.edges = this.edges.filter(e => !this.selEdges.has(e)); }
        if (this.selNodes.size > 0) {
            this.nodes = this.nodes.filter(n => !this.selNodes.has(n.id));
            this.edges = this.edges.filter(e => !this.selNodes.has(e.s) && !this.selNodes.has(e.t));
        }
        this.reindex();
        this.clearSel();
        this.algorithms.updateData();
    }

    selectAll() { this.clearSel(); this.nodes.forEach(n => this.selNodes.add(n.id)); this.edges.forEach(e => this.selEdges.add(e)); this.updateSelectionStats(); }

    toggleSnap() {
        this.snapEnabled = !this.snapEnabled;
        const b = document.getElementById('btn-snap');
        const i18n = window.GraphI18n;
        if (this.snapEnabled) {
            b.classList.add('toggle-on');
            b.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.snap.on') : '智能吸附：开');
            b.style.color = '#10b981';
        } else {
            b.classList.remove('toggle-on');
            b.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.snap.off') : '智能吸附：关');
            b.style.color = '#64748b';
        }
    }

    // --- Proxy Methods for HTML "onclick" compatibility ---
    showGenerator() { this.generator.showGenerator(); }
    hideGenerator() { this.generator.hideGenerator(); }
    generateGraph() { this.generator.generateGraph(); }
    selectGenType(item) { this.generator.selectGenType(item); }
    
    togglePhysics() { this.physics.togglePhysics(); }
    
    togglePanel() { this.ui.togglePanel(); }
    toggleTheme() { this.ui.toggleTheme(); }
    hideAllModals() { this.ui.hideAllModals(); }
    
    saveGraph() { this.exporter.saveGraph(); }
    loadGraph(input) { this.exporter.loadGraph(input); }
    showExportModal() { this.exporter.showExportModal(); }
    hideExportModal() { this.exporter.hideExportModal(); }
    switchExportTab(type) { this.exporter.switchExportTab(type); }
    doExport() { this.exporter.doExport(); }
    applyTikZPreset(t, v) { this.exporter.applyTikZPreset(t, v); }
    exportToTikZ() { this.exporter.exportToTikZ(); }
    
    visualize(t) { this.algorithms.visualize(t); }
    exitVis() { this.algorithms.exitVis(); }
}

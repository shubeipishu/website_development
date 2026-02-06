export class Exporter {
    constructor(app) {
        this.app = app;
        this.currentExportType = 'png';
    }

    showExportModal() {
        const m = document.getElementById('export-modal');
        const b = document.getElementById('modal-backdrop');
        if (!m.classList.contains('active')) {
            m.classList.add('active');
            b.classList.add('active');
            m.style.display = 'flex';
            this.switchExportTab('png');
        }
    }

    hideExportModal() {
        const m = document.getElementById('export-modal');
        const b = document.getElementById('modal-backdrop');
        m.classList.remove('active');
        b.classList.remove('active');
        setTimeout(() => m.style.display = 'none', 300);
    }

    switchExportTab(type) {
        this.currentExportType = type;
        const i18n = window.GraphI18n;
        const t = (key) => (i18n?.t ? i18n.t(key) : key);
        document.querySelectorAll('#export-modal .gen-item').forEach(el => el.classList.remove('selected'));
        document.getElementById(`tab-${type}`).classList.add('selected');

        document.getElementById('export-body-png').style.display = type === 'png' ? 'block' : 'none';
        document.getElementById('export-body-tikz').style.display = type === 'tikz' ? 'block' : 'none';

        if (type === 'png') {
            document.getElementById('export-title').innerText = t('export.title.png');
            document.getElementById('export-desc').innerText = t('export.desc.png');
        } else {
            document.getElementById('export-title').innerText = t('export.title.tikz');
            document.getElementById('export-desc').innerText = t('export.desc.tikz');
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
        if (this.app.nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.app.nodes.forEach(n => {
            minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
        });
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * scale;
        tempCanvas.height = height * scale;
        const ctx = tempCanvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        let bgColor;
        if (bgType === 'transparent') bgColor = null;
        else if (bgType === 'white') bgColor = '#ffffff';
        else if (bgType === 'dark') bgColor = '#1f2937';
        else {
            bgColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1f2937' : '#ffffff';
        }

        if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(minX - padding, minY - padding, width, height);
        }

        let theme = this.app.renderer.getThemeColors();
        if (bgType === 'white') {
            theme = { nodeStroke: '#fff', nodeText: '#fff', badgeBg: '#fff', badgeBorder: '#333', badgeText: '#000', selBoxFill: 'rgba(59, 130, 246, 0.2)' };
            theme.nodeStroke = '#fff';
            theme.nodeText = '#fff';
            theme.badgeBg = '#fff';
            theme.badgeBorder = '#e5e7eb';
        } else if (bgType === 'dark') {
            theme.nodeStroke = '#f9fafb';
            theme.nodeText = '#f9fafb';
        }

        ctx.lineWidth = 2;
        this.app.edges.forEach(e => {
            const n1 = this.app.nodes.find(n => n.id === e.s);
            const n2 = this.app.nodes.find(n => n.id === e.t);
            if (!n1 || !n2) return;
            ctx.strokeStyle = this.app.config.colors.edge;
            ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
        });

        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        this.app.nodes.forEach(n => {
            ctx.fillStyle = this.app.config.colors.node;
            ctx.beginPath(); ctx.arc(n.x, n.y, this.app.config.radius, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = theme.nodeStroke;
            ctx.lineWidth = 2; ctx.stroke();

            ctx.fillStyle = theme.nodeText;
            ctx.fillText(n.id + 1, n.x, n.y);
        });

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
        if (this.app.nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.app.nodes.forEach(n => {
            minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
        });

        const baseScale = 0.02;
        const finalScale = baseScale * userScale;

        const vStyle = vertexStyle || "circle, draw, fill=blue!20, minimum size=8mm, inner sep=1pt";
        const eStyle = edgeStyle || "draw, thick";

        const i18n = window.GraphI18n;
        const t = (key) => (i18n?.t ? i18n.t(key) : key);
        let tikz = t('export.tikz.generatedComment') + "\n";
        if (includePreamble) {
            tikz += "\\documentclass[tikz,border=10pt]{standalone}\n";
            tikz += "\\begin{document}\n\n";
        }

        tikz += "\\begin{tikzpicture}[\n";
        tikz += "    auto,\n";
        tikz += "    swap,\n";
        tikz += `    vertex/.style={${vStyle}},
`;
        tikz += `    edge/.style={${eStyle}}
`;
        tikz += "]\n";

        tikz += "    % Vertices\n";

        const nodeStrs = this.app.nodes.map(n => {
            const x = ((n.x - minX) * finalScale).toFixed(2);
            const y = (-(n.y - minY) * finalScale).toFixed(2);
            const label = n.id + 1;
            return `    \\node[vertex] (v${label}) at (${x},${y}) {${label}};`;
        });
        tikz += nodeStrs.join("\n") + "\n\n";

        tikz += "    % Edges\n";
        const edgeStrs = this.app.edges.map(e => `    \\path[edge] (v${e.s + 1}) -- (v${e.t + 1});`);
        tikz += edgeStrs.join("\n") + "\n";

        tikz += "\\end{tikzpicture}\n";
        if (includePreamble) {
            tikz += "\n\\end{document}\n";
        }

        navigator.clipboard.writeText(tikz).then(() => {
            alert(t('export.tikz.copySuccess'));
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert(t('export.tikz.copyFail'));
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

    saveGraph() { const data = { version: "5.5", timestamp: new Date().toISOString(), nodes: this.app.nodes, edges: this.app.edges, nextId: this.app.nodeIdSeq }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `graph_${new Date().getTime()}.json`; a.click(); URL.revokeObjectURL(url); }

    loadGraph(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        const i18n = window.GraphI18n;
        const t = (key) => (i18n?.t ? i18n.t(key) : key);
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.nodes && data.edges) {
                    this.app.saveState();
                    this.app.nodes = data.nodes;
                    this.app.edges = data.edges;
                    this.app.nodeIdSeq = data.nextId || (this.app.nodes.length > 0 ? Math.max(...this.app.nodes.map(n => n.id)) + 1 : 0);
                    this.app.clearSel();
                    this.app.resetView();
                    this.app.algorithms.updateData();
                    alert(t('export.load.success'));
                }
            } catch (err) {
                alert(t('export.load.invalid'));
            }
            input.value = '';
        };
        reader.readAsText(file);
    }
}

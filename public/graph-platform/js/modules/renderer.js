
export class Renderer {
    constructor(app) {
        this.app = app;
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.app.container.getBoundingClientRect();
        this.app.canvas.width = rect.width * dpr;
        this.app.canvas.height = rect.height * dpr;
        this.app.canvas.style.width = rect.width + 'px';
        this.app.canvas.style.height = rect.height + 'px';
    }

    toWorld(sx, sy) {
        return {
            x: (sx - this.app.view.x) / this.app.view.scale,
            y: (sy - this.app.view.y) / this.app.view.scale
        };
    }

    getThemeColors() {
        // Define base colors for both themes
        const themes = {
            light: {
                nodeStroke: '#d1d5db', nodeText: '#fff', badgeBg: '#fff', badgeBorder: '#333', badgeText: '#000', selBoxFill: 'rgba(59, 130, 246, 0.2)'
            },
            dark: {
                nodeStroke: '#f9fafb', nodeText: '#f9fafb', badgeBg: '#374151', badgeBorder: '#9ca3af', badgeText: '#f9fafb', selBoxFill: 'rgba(59, 130, 246, 0.2)', grid: '#374151'
            }
        };

        const targetTheme = document.documentElement.getAttribute('data-theme') || 'light';

        if (!this.app.themeTransition.active) {
            const t = themes[targetTheme === 'dark' ? 'dark' : 'light'];
            if (!t.grid) t.grid = '#e5e7eb'; // Fallback/Default for light
            return t;
        }

        const now = performance.now();
        const progress = Math.min((now - this.app.themeTransition.startTime) / this.app.themeTransition.duration, 1);

        // Sync with CSS ease-in-out
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * progress);

        if (progress >= 1) {
            this.app.themeTransition.active = false;
            return themes[targetTheme === 'dark' ? 'dark' : 'light'];
        }

        const from = themes[this.app.themeTransition.from];
        const to = themes[this.app.themeTransition.to];

        // Helper to interpolate hex colors
        const lerpColor = (c1, c2, t) => {
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

        // Fix for grid lag: Read computed style from sidebar which has synced CSS transition
        // This ensures the canvas grid color matches the DOM background transition exactly.
        let gridColor;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            gridColor = getComputedStyle(sidebar).borderRightColor;
        }

        return {
            nodeStroke: lerpColor(from.nodeStroke, to.nodeStroke, ease),
            nodeText: lerpColor(from.nodeText, to.nodeText, ease),
            badgeBg: lerpColor(from.badgeBg, to.badgeBg, ease),
            badgeBorder: lerpColor(from.badgeBorder, to.badgeBorder, ease),
            badgeText: lerpColor(from.badgeText, to.badgeText, ease),
            selBoxFill: to.selBoxFill,
            grid: gridColor || lerpColor(from.grid || '#e5e7eb', to.grid || '#374151', ease)
        };
    }

    drawGrid(ctx, themeColors) {
        const scale = this.app.view.scale;
        const gridSize = 24;
        
        const w = this.app.canvas.width / window.devicePixelRatio;
        const h = this.app.canvas.height / window.devicePixelRatio;
        
        // Viewport bounds in world space
        const startX = -this.app.view.x / scale;
        const startY = -this.app.view.y / scale;
        const endX = (w - this.app.view.x) / scale;
        const endY = (h - this.app.view.y) / scale;

        ctx.beginPath();
        ctx.strokeStyle = themeColors.grid;
        ctx.lineWidth = 1 / scale; // Keep constant 1px width

        // Adjust grid range to cover viewport + buffer
        const startGridX = Math.floor(startX / gridSize) * gridSize;
        const endGridX = Math.ceil(endX / gridSize) * gridSize;
        const startGridY = Math.floor(startY / gridSize) * gridSize;
        const endGridY = Math.ceil(endY / gridSize) * gridSize;

        for (let x = startGridX; x <= endGridX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startGridY; y <= endGridY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }

    loop() {
        if (this.app.physics) this.app.physics.applyPhysics(); // Delegate to Physics module
        
        const ctx = this.app.ctx;
        const dpr = window.devicePixelRatio || 1;
        const time = performance.now();
        const blinkAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time / 150));
        const blinkWidth = 1 + 2 * (0.5 + 0.5 * Math.sin(time / 150));

        const themeColors = this.getThemeColors();

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.app.canvas.width / dpr, this.app.canvas.height / dpr);
        ctx.setTransform(this.app.view.scale * dpr, 0, 0, this.app.view.scale * dpr, this.app.view.x * dpr, this.app.view.y * dpr);

        this.drawGrid(ctx, themeColors);

        if (this.app.snapLines.length) {
            ctx.beginPath();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5 / this.app.view.scale;
            ctx.setLineDash([5 / this.app.view.scale, 5 / this.app.view.scale]);
            this.app.snapLines.forEach(l => { ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2) });
            ctx.stroke();
            ctx.setLineDash([]);
        }

        const baseLineWidth = 3;
        const selLineWidth = 5;
        const baseFont = "bold 14px Arial";
        const smallFont = "bold 10px Arial";

        this.app.edges.forEach((e, i) => {
            const n1 = this.app.nodes.find(n => n.id === e.s), n2 = this.app.nodes.find(n => n.id === e.t);
            if (!n1 || !n2) return;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            let s = this.app.config.colors.edge, w = baseLineWidth;

            const isPreviewSel = this.app.previewSelEdges && this.app.previewSelEdges.has(e);
            if (isPreviewSel && !this.app.selEdges.has(e)) {
                s = 'rgba(59, 130, 246, 0.85)';
                w = selLineWidth - 1;
            }

            const isHovered = this.app.hoverEdge === e;
            if (isHovered && !this.app.selEdges.has(e) && !isPreviewSel) {
                s = this.app.config.colors.node;
                w = baseLineWidth + 1.5;
            }

            if (this.app.selEdges.has(e)) { s = this.app.config.colors.selEdge; w = selLineWidth; }
            else if (this.app.visMode === 'edgeColor' && this.app.edgeColData) {
                const k = (e.s < e.t ? e.s : e.t) + '-' + (e.s < e.t ? e.t : e.s);
                const c = this.app.edgeColData[k];
                if (c) { s = `hsl(${(c * 137.5) % 360},75%,50%)`; w = selLineWidth; }
            } else if (this.app.visMode === 'lambda' && this.app.connData && this.app.connData.cutEdges) {
                if (this.app.connData.cutEdges.some(ce => (ce.s === e.s && ce.t === e.t) || (ce.s === e.t && ce.t === e.s))) {
                    s = this.app.config.colors.cut; w = baseLineWidth + blinkWidth; ctx.globalAlpha = blinkAlpha;
                }
            }

            const hl = (p) => { for (let j = 0; j < p.length - 1; j++)if ((e.s === p[j] && e.t === p[j + 1]) || (e.s === p[j + 1] && e.t === p[j])) { s = (this.app.visMode === 'dist') ? this.app.config.colors.distPath : this.app.config.colors.diamPath; w = selLineWidth + 1; break; } };
            if (this.app.visMode === 'diameter' && this.app.diamPath) hl(this.app.diamPath);
            if (this.app.visMode === 'dist' && this.app.selDistPath) hl(this.app.selDistPath);

            // 哈密顿高亮逻辑
            if ((this.app.visMode === 'ham-path' || this.app.visMode === 'ham-cycle') && this.app.visData) {
                const path = this.app.visData;
                for (let k = 0; k < path.length - 1; k++) {
                    const u = path[k], v = path[k + 1];
                    if ((e.s === u && e.t === v) || (e.s === v && e.t === u)) {
                        s = this.app.config.colors.diamPath;
                        w = selLineWidth + 2;
                        break;
                    }
                }
            }

            ctx.strokeStyle = s; ctx.lineWidth = w; ctx.stroke(); ctx.globalAlpha = 1.0;

            if (this.app.visMode === 'edgeColor' && this.app.edgeColData) {
                const k = (e.s < e.t ? e.s : e.t) + '-' + (e.s < e.t ? e.t : e.s);
                const c = this.app.edgeColData[k];
                if (c) {
                    const mx = (n1.x + n2.x) / 2, my = (n1.y + n2.y) / 2;
                    ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2);
                    ctx.fillStyle = themeColors.badgeBg; ctx.fill(); ctx.strokeStyle = themeColors.badgeBorder; ctx.lineWidth = 1; ctx.stroke();
                    ctx.fillStyle = themeColors.badgeText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = smallFont; ctx.fillText(c, mx, my);
                }
            }
        });

        if (this.app.drag.active && this.app.drag.type === 'connect' && this.app.drag.startNode) {
            ctx.beginPath();
            ctx.moveTo(this.app.drag.startNode.x, this.app.drag.startNode.y);
            ctx.lineTo(this.app.drag.currentPos.x, this.app.drag.currentPos.y);
            ctx.strokeStyle = this.app.config.colors.tempEdge;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        const rippleDuration = 400;
        this.app.ripples = this.app.ripples.filter(r => {
            const elapsed = time - r.startTime;
            if (elapsed > rippleDuration) return false;
            const progress = elapsed / rippleDuration;
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const radius = r.maxRadius * easeOut;
            const alpha = 0.5 * (1 - progress);
            ctx.beginPath(); ctx.arc(r.x, r.y, radius, 0, Math.PI * 2); ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`; ctx.lineWidth = 3 * (1 - progress); ctx.stroke();
            return true;
        });

        this.app.nodes.forEach(n => {
            ctx.beginPath();
            let fill = this.app.config.colors.node, badge = null;
            let radius = this.app.config.radius;
            let shadowBlur = 0;
            let previewStroke = false;
            let showMisBorder = false;

            const creatingAnim = this.app.creatingNodes.find(c => c.node.id === n.id);
            if (creatingAnim) {
                const elapsed = time - creatingAnim.startTime;
                const progress = Math.min(elapsed / creatingAnim.duration, 1);
                const easeOutBack = 1 + 2.7 * Math.pow(progress - 1, 3) + 1.7 * Math.pow(progress - 1, 2);
                radius = this.app.config.radius * Math.min(easeOutBack, 1.1);
                if (progress >= 1) {
                    this.app.creatingNodes = this.app.creatingNodes.filter(c => c.node.id !== n.id);
                }
            }

            const isPreviewSel = this.app.previewSelNodes && this.app.previewSelNodes.has(n.id);
            if (isPreviewSel && !this.app.selNodes.has(n.id)) {
                previewStroke = true;
            }

            const isHovered = this.app.hoverNode && this.app.hoverNode.id === n.id;
            if (isHovered && !this.app.selNodes.has(n.id) && !isPreviewSel) {
                radius = this.app.config.radius * 1.15;
                shadowBlur = 12;
            }

            if (this.app.visMode === 'coloring' && this.app.visData) {
                const c = this.app.visData[n.id];
                if (c) { fill = `hsl(${(c * 137.5) % 360},75%,60%)`; badge = c; }
            } else if (this.app.visMode === 'mis' && this.app.visData) {
                if (this.app.visData[n.id]) {
                    fill = this.app.config.colors.sel;
                    showMisBorder = true;
                }
            } else if (this.app.visMode === 'kappa' && this.app.connData && this.app.connData.cutNodes.has(n.id)) {
                fill = this.app.config.colors.cut; ctx.globalAlpha = blinkAlpha;
            } else if (this.app.visMode === 'diameter' && this.app.diamPath && this.app.diamPath.includes(n.id)) fill = this.app.config.colors.diamPath;
            else if (this.app.visMode === 'dist' && this.app.selDistPath && this.app.selDistPath.includes(n.id)) fill = this.app.config.colors.distPath;
            else if (this.app.selNodes.has(n.id)) fill = this.app.config.colors.sel;

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

        this.app.deletingNodes = this.app.deletingNodes.filter(d => {
            const elapsed = time - d.startTime;
            if (elapsed > d.duration) return false;
            const progress = elapsed / d.duration;
            const alpha = 1 - progress;
            const scale = 1 - progress * 0.3;
            ctx.beginPath(); ctx.globalAlpha = alpha; ctx.fillStyle = this.app.config.colors.sel; ctx.arc(d.node.x, d.node.y, this.app.config.radius * scale, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;
            return true;
        });

        if (this.app.selBox) {
            ctx.fillStyle = themeColors.selBoxFill; ctx.fillRect(this.app.selBox.x, this.app.selBox.y, this.app.selBox.w, this.app.selBox.h);
            ctx.strokeStyle = this.app.config.colors.node; ctx.lineWidth = 1; ctx.strokeRect(this.app.selBox.x, this.app.selBox.y, this.app.selBox.w, this.app.selBox.h);
        }

        requestAnimationFrame(() => this.loop());
    }
}

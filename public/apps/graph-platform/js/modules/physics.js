
export class Physics {
    constructor(app) {
        this.app = app;
        this.active = false;
    }

    togglePhysics() {
        this.active = !this.active;
        const b = document.getElementById('btn-physics');
        const i18n = window.GraphI18n;
        if (this.active) {
            b.classList.add('physics-on');
            b.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.physics.on') : '物理布局：开');
            b.innerHTML = '<i class="fas fa-atom fa-spin"></i>';
        } else {
            b.classList.remove('physics-on');
            b.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.physics.off') : '物理布局：关');
            b.innerHTML = '<i class="fas fa-atom"></i>';
        }
    }

    applyPhysics() {
        if (!this.active || this.app.nodes.length < 2) return;
        const idealLen = 150; const k_spring = 0.005; const repulsion = 8000; const dt = 0.5; const centerForce = 0.0005;
        const forces = this.app.nodes.map(() => ({ x: 0, y: 0 }));
        const dpr = window.devicePixelRatio || 1;
        const cx = this.app.canvas.width / (2 * dpr * this.app.view.scale) - this.app.view.x / this.app.view.scale;
        const cy = this.app.canvas.height / (2 * dpr * this.app.view.scale) - this.app.view.y / this.app.view.scale;

        for (let i = 0; i < this.app.nodes.length; i++) {
            for (let j = i + 1; j < this.app.nodes.length; j++) {
                const n1 = this.app.nodes[i], n2 = this.app.nodes[j];
                let dx = n1.x - n2.x, dy = n1.y - n2.y;
                let d2 = dx * dx + dy * dy; if (d2 < 0.1) { dx = Math.random(); dy = Math.random(); d2 = 1; }
                const d = Math.sqrt(d2); const f = repulsion / d2;
                const fx = (dx / d) * f, fy = (dy / d) * f;
                forces[i].x += fx; forces[i].y += fy; forces[j].x -= fx; forces[j].y -= fy;
            }
            forces[i].x -= (this.app.nodes[i].x - cx) * centerForce;
            forces[i].y -= (this.app.nodes[i].y - cy) * centerForce;
        }
        this.app.edges.forEach(e => {
            const ni = this.app.nodes.findIndex(n => n.id === e.s), nj = this.app.nodes.findIndex(n => n.id === e.t);
            if (ni === -1 || nj === -1) return;
            const n1 = this.app.nodes[ni], n2 = this.app.nodes[nj];
            const dx = n2.x - n1.x, dy = n2.y - n1.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d === 0) return;
            const f = k_spring * (d - idealLen);
            const fx = (dx / d) * f, fy = (dy / d) * f;
            forces[ni].x += fx; forces[ni].y += fy; forces[nj].x -= fx; forces[nj].y -= fy;
        });
        this.app.nodes.forEach((n, i) => {
            if (this.app.drag.active && this.app.drag.type === 'node' && this.app.selNodes.has(n.id)) return;
            let vx = forces[i].x * dt, vy = forces[i].y * dt;
            const maxV = 15;
            const v = Math.hypot(vx, vy);
            if (v > maxV) { vx = (vx / v) * maxV; vy = (vy / v) * maxV; }
            n.x += vx; n.y += vy;
        });
    }
}

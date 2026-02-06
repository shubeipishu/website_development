export class UI {
    constructor(app) {
        this.app = app;
        this.panelOpen = true;
    }

    getI18n() { return window.GraphI18n; }

    setVal(id, val) { const el = document.getElementById(id); if (el) { el.innerText = val; el.style.color = ''; } }

    renderMath(id, tex) { const el = document.getElementById(id); if (el && window.katex) window.katex.render(tex, el, { throwOnError: false }); }

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
                if (window.katex) window.katex.render(part, span, { throwOnError: false });
                else span.innerText = part;
                el.appendChild(span);
            }
        });
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

    renderMat(m, id) { const el = document.getElementById(id); if (!el) return; let h = '<table>'; m.forEach(r => { h += '<tr>'; r.forEach(v => h += `<td class="${v ? 'nz' : ''}">${v}</td>`); h += '</tr>' }); el.innerHTML = h + '</table>'; }

    togglePanel() { this.panelOpen = !this.panelOpen; const d = document.getElementById('panel-drawer'), i = document.getElementById('toggle-icon'); if (this.panelOpen) { d.classList.remove('closed'); i.className = 'fas fa-chevron-right'; } else { d.classList.add('closed'); i.className = 'fas fa-chevron-left'; } }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const TRANSITION_MS = 300;
        const i18n = this.getI18n();

        // Start transition in App state
        this.app.themeTransition = {
            active: true,
            startTime: performance.now(),
            duration: TRANSITION_MS,
            from: currentTheme,
            to: newTheme
        };

        document.documentElement.classList.add('theme-transition');
        document.documentElement.setAttribute('data-theme', newTheme);
        const btn = document.getElementById('btn-theme');
        if (newTheme === 'dark') {
            btn.innerHTML = '<i class="fas fa-sun"></i>';
            btn.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.theme.light') : '切换为亮色主题');
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            btn.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.theme.dark') : '切换为暗色主题');
        }

        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, TRANSITION_MS);
    }

    loadTheme() {
        const defaultTheme = 'light';
        document.documentElement.setAttribute('data-theme', defaultTheme);
        const btn = document.getElementById('btn-theme');
        const i18n = this.getI18n();
        if (defaultTheme === 'dark') {
            btn.innerHTML = '<i class="fas fa-sun"></i>';
            btn.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.theme.light') : '切换为亮色主题');
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            btn.setAttribute('data-tooltip', i18n?.t ? i18n.t('tooltip.theme.dark') : '切换为暗色主题');
        }
    }

    syncI18n() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const btn = document.getElementById('btn-theme');
        const i18n = this.getI18n();
        if (!btn || !i18n?.t) return;
        if (currentTheme === 'dark') {
            btn.setAttribute('data-tooltip', i18n.t('tooltip.theme.light'));
        } else {
            btn.setAttribute('data-tooltip', i18n.t('tooltip.theme.dark'));
        }
    }

    hideAllModals() {
        this.app.generator.hideGenerator();
        this.app.exporter.hideExportModal();
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.app.visMode) this.app.algorithms.exitVis();
        const menu = document.getElementById('context-menu');
        const mw = this.app.renderer.toWorld(e.clientX - this.app.canvas.getBoundingClientRect().left, e.clientY - this.app.canvas.getBoundingClientRect().top);
        const node = this.app.findNode(mw), edge = !node ? this.app.findEdge(mw) : null;

        if (node) {
            if (!this.app.selNodes.has(node.id)) { this.app.clearSel(); this.app.selNodes.add(node.id); this.app.updateSelectionStats(); }
        } else if (edge) {
            if (!this.app.selEdges.has(edge)) { this.app.clearSel(); this.app.selEdges.add(edge); this.app.updateSelectionStats(); }
        }

        let html = '';
        const i18n = this.getI18n();
        const t = (key) => (i18n?.t ? i18n.t(key) : key);
        const hasSel = this.app.selNodes.size > 0 || this.app.selEdges.size > 0;
        if (hasSel) {
            html += `<div class="ctx-item" onclick="app.copySelection()"><i class="fas fa-copy"></i> <span class="ctx-text">${t('ctx.copy')}</span> <span class="ctx-shortcut">Ctrl+C</span></div>`;
            html += `<div class="ctx-item" onclick="app.duplicateSelection()"><i class="fas fa-clone"></i> <span class="ctx-text">${t('ctx.duplicate')}</span> <span class="ctx-shortcut">Ctrl+D</span></div>`;
            html += `<div class="ctx-item" onclick="app.cutSelection()"><i class="fas fa-cut"></i> <span class="ctx-text">${t('ctx.cut')}</span> <span class="ctx-shortcut">Ctrl+X</span></div>`;
            html += `<div class="ctx-sep"></div>`;
            html += `<div class="ctx-item" onclick="app.deleteSelectionAction()"><i class="fas fa-trash-alt"></i> <span class="ctx-text">${t('ctx.delete')}</span> <span class="ctx-shortcut">Del</span></div>`;
        }
        if (this.app.clipboard) {
            if (hasSel) html += `<div class="ctx-sep"></div>`;
            html += `<div class="ctx-item" onclick="app.pasteFromMenu()"><i class="fas fa-paste"></i> <span class="ctx-text">${t('ctx.paste')}</span> <span class="ctx-shortcut">Ctrl+V</span></div>`;
        }

        if (html !== '') html += `<div class="ctx-sep"></div>`;
        html += `<div class="ctx-item" onclick="app.exporter.exportToTikZ()"><i class="fas fa-code"></i> <span class="ctx-text">${t('ctx.exportTikz')}</span></div>`;

        if (html === '') return;

        menu.innerHTML = html; menu.style.display = 'block';
        const rect = menu.getBoundingClientRect();
        let mx = e.clientX, my = e.clientY;
        if (mx + rect.width > window.innerWidth) mx -= rect.width;
        if (my + rect.height > window.innerHeight) my -= rect.height;
        menu.style.left = mx + 'px'; menu.style.top = my + 'px';
    }
}

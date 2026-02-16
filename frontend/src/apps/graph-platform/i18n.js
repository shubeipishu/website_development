(() => {
    const STORAGE_KEY = 'graph-lang';

    const DICT = {
        zh: {
            'app.title': '图论科研平台 Pro',
            'tooltip.interaction': '交互提示：双击空白处创建节点 / 按住 Shift 拖拽连线',
            'tooltip.generator': '图生成器 - 快速创建经典图结构',
            'tooltip.physics.on': '物理布局：开 - 自动优化节点位置',
            'tooltip.physics.off': '物理布局：关 - 自动优化节点位置',
            'tooltip.snap.on': '智能吸附：开 - 自动对齐节点',
            'tooltip.snap.off': '智能吸附：关 - 自动对齐节点',
            'tooltip.delete': '删除选中对象 (Del)',
            'tooltip.clear': '清空画布 - 删除所有节点和边',
            'tooltip.save': '保存图为 JSON 文件 (Ctrl+S)',
            'tooltip.open': '打开 JSON 文件 (Ctrl+O)',
            'tooltip.export': '导出 (PNG / TikZ)',
            'tooltip.undo': '撤销上一步操作 (Ctrl+Z)',
            'tooltip.redo': '重做下一步操作 (Ctrl+Y)',
            'tooltip.reset': '重置视图到原点 (按 0 键)',
            'tooltip.theme.light': '切换为亮色主题',
            'tooltip.theme.dark': '切换为暗色主题',
            'tooltip.lang': '切换语言',

            'vis.displaying': '显示',
            'vis.chromatic': '染色数',
            'vis.edgeChromatic': '边染色数',
            'vis.independence': '最大独立集',
            'vis.diameter': '直径',
            'vis.distance': '距离',
            'vis.vertexConnectivity': '顶点连通度',
            'vis.edgeConnectivity': '边连通度',
            'vis.hamPath': '哈密顿路径',
            'vis.hamCycle': '哈密顿回路',
            'vis.found': '找到',
            'vis.notFound': '未找到',
            'vis.foundLen': '找到（长度: {n}）',
            'vis.foundCycle': '找到（回路）',
            'common.slow': '较慢',
            'stats.slow': '>{n}(较慢)',

            'ctx.copy': '复制',
            'ctx.duplicate': '副本',
            'ctx.cut': '剪切',
            'ctx.delete': '删除',
            'ctx.paste': '粘贴',
            'ctx.exportTikz': '导出 TikZ',

            'gen.keep': '保留画布现有图',
            'gen.cancel': '取消',
            'gen.generate': '生成',
            'gen.noParams': '该图无需额外参数配置。',
            'gen.name.placeholder': '图名称',
            'gen.desc.placeholder': '在此显示图描述。',

            'export.type': '导出类型',
            'export.png': 'PNG 图片',
            'export.tikz': 'LaTeX / TikZ',
            'export.title.png': '导出 PNG 图片',
            'export.desc.png': '导出当前画布为高清图片。',
            'export.title.tikz': '导出 LaTeX / TikZ',
            'export.desc.tikz': '生成可直接用于论文的 TikZ 代码。',
            'export.scale': '分辨率 (Scale)',
            'export.scale.1x': '1x (屏幕分辨率)',
            'export.scale.2x': '2x (高清 Retina)',
            'export.scale.4x': '4x (超清印刷)',
            'export.bg': '背景颜色',
            'export.bg.theme': '跟随当前主题',
            'export.bg.transparent': '透明 (Transparent)',
            'export.bg.white': '纯白 (White)',
            'export.bg.dark': '深色 (Dark)',
            'export.tikz.scale': '缩放比例 (Scale)',
            'export.tikz.preamble': '包含完整文档 (Preamble)',
            'export.tikz.preamble.desc': '勾选后将包含 \\documentclass 和 \\begin{document}，可直接编译。',
            'export.tikz.vertexStyle': '节点样式 (Vertex Style)',
            'export.tikz.vertexPreset.placeholder': '选择预设...',
            'export.tikz.vertexPreset.default': '默认 (蓝色圆)',
            'export.tikz.vertexPreset.simple': '简单 (白圆)',
            'export.tikz.vertexPreset.dot': '实心点 (黑点)',
            'export.tikz.vertexPreset.rect': '方形 (红色)',
            'export.tikz.vertexHelp': 'TikZ样式选项，如：circle, draw, fill=blue!20',
            'export.tikz.edgeStyle': '边样式 (Edge Style)',
            'export.tikz.edgePreset.placeholder': '选择预设...',
            'export.tikz.edgePreset.default': '默认 (粗线)',
            'export.tikz.edgePreset.thin': '细线',
            'export.tikz.edgePreset.arrow': '有向 (箭头)',
            'export.tikz.edgePreset.dashed': '虚线',
            'export.tikz.edgePreset.red': '红色',
            'export.tikz.edgeHelp': 'TikZ样式选项，如：draw, thick, ->',
            'export.cancel': '取消',
            'export.confirm': '导出 / 复制',
            'export.tikz.generatedComment': '% 由图论科研平台生成',
            'export.tikz.copySuccess': 'TikZ 代码已复制到剪贴板！',
            'export.tikz.copyFail': '复制失败，请查看控制台输出。',
            'export.load.success': '数据已加载',
            'export.load.invalid': '文件无效',

            'panel.metrics': '图的参数',
            'panel.basic': '基础信息',
            'panel.degree': '度数统计',
            'panel.struct': '结构特征',
            'panel.connectivity': '连通性 (Slow > 50)',
            'panel.adj': '邻接矩阵',
            'panel.lap': '拉普拉斯矩阵',

            'lang.toggle': 'EN'
        },
        en: {
            'app.title': 'Graph Platform Pro',
            'tooltip.interaction': 'Hint: double-click to create a node / hold Shift to drag an edge',
            'tooltip.generator': 'Graph generator - create classic graphs quickly',
            'tooltip.physics.on': 'Physics layout: On - auto optimize node positions',
            'tooltip.physics.off': 'Physics layout: Off - auto optimize node positions',
            'tooltip.snap.on': 'Snap align: On - auto align nodes',
            'tooltip.snap.off': 'Snap align: Off - auto align nodes',
            'tooltip.delete': 'Delete selection (Del)',
            'tooltip.clear': 'Clear canvas - remove all nodes and edges',
            'tooltip.save': 'Save graph as JSON (Ctrl+S)',
            'tooltip.open': 'Open JSON (Ctrl+O)',
            'tooltip.export': 'Export (PNG / TikZ)',
            'tooltip.undo': 'Undo last action (Ctrl+Z)',
            'tooltip.redo': 'Redo next action (Ctrl+Y)',
            'tooltip.reset': 'Reset view (press 0)',
            'tooltip.theme.light': 'Switch to light theme',
            'tooltip.theme.dark': 'Switch to dark theme',
            'tooltip.lang': 'Switch language',

            'vis.displaying': 'Displaying',
            'vis.chromatic': 'Chromatic Number',
            'vis.edgeChromatic': 'Edge Chromatic Number',
            'vis.independence': 'Independence Number',
            'vis.diameter': 'Diameter',
            'vis.distance': 'Distance',
            'vis.vertexConnectivity': 'Vertex Connectivity',
            'vis.edgeConnectivity': 'Edge Connectivity',
            'vis.hamPath': 'Hamiltonian Path',
            'vis.hamCycle': 'Hamiltonian Cycle',
            'vis.found': 'Found',
            'vis.notFound': 'Not Found',
            'vis.foundLen': 'Found (Len: {n})',
            'vis.foundCycle': 'Found (Cycle)',
            'common.slow': 'Slow',
            'stats.slow': '>{n} (Slow)',

            'ctx.copy': 'Copy',
            'ctx.duplicate': 'Duplicate',
            'ctx.cut': 'Cut',
            'ctx.delete': 'Delete',
            'ctx.paste': 'Paste',
            'ctx.exportTikz': 'Export TikZ',

            'gen.keep': 'Keep existing graph',
            'gen.cancel': 'Cancel',
            'gen.generate': 'Generate',
            'gen.noParams': 'No additional parameters required.',
            'gen.name.placeholder': 'Graph Name',
            'gen.desc.placeholder': 'Description goes here.',

            'export.type': 'Export Type',
            'export.png': 'PNG Image',
            'export.tikz': 'LaTeX / TikZ',
            'export.title.png': 'Export PNG Image',
            'export.desc.png': 'Export the current canvas as a high-resolution image.',
            'export.title.tikz': 'Export LaTeX / TikZ',
            'export.desc.tikz': 'Generate TikZ code ready for papers.',
            'export.scale': 'Resolution (Scale)',
            'export.scale.1x': '1x (Screen)',
            'export.scale.2x': '2x (Retina)',
            'export.scale.4x': '4x (Print)',
            'export.bg': 'Background',
            'export.bg.theme': 'Follow theme',
            'export.bg.transparent': 'Transparent',
            'export.bg.white': 'White',
            'export.bg.dark': 'Dark',
            'export.tikz.scale': 'Scale',
            'export.tikz.preamble': 'Include full document (Preamble)',
            'export.tikz.preamble.desc': 'Includes \\documentclass and \\begin{document} for direct compilation.',
            'export.tikz.vertexStyle': 'Vertex Style',
            'export.tikz.vertexPreset.placeholder': 'Select preset...',
            'export.tikz.vertexPreset.default': 'Default (Blue)',
            'export.tikz.vertexPreset.simple': 'Simple (White)',
            'export.tikz.vertexPreset.dot': 'Solid dot (Black)',
            'export.tikz.vertexPreset.rect': 'Square (Red)',
            'export.tikz.vertexHelp': 'TikZ style options, e.g. circle, draw, fill=blue!20',
            'export.tikz.edgeStyle': 'Edge Style',
            'export.tikz.edgePreset.placeholder': 'Select preset...',
            'export.tikz.edgePreset.default': 'Default (Thick)',
            'export.tikz.edgePreset.thin': 'Thin',
            'export.tikz.edgePreset.arrow': 'Directed (Arrow)',
            'export.tikz.edgePreset.dashed': 'Dashed',
            'export.tikz.edgePreset.red': 'Red',
            'export.tikz.edgeHelp': 'TikZ style options, e.g. draw, thick, ->',
            'export.cancel': 'Cancel',
            'export.confirm': 'Export / Copy',
            'export.tikz.generatedComment': '% Generated by Graph Platform',
            'export.tikz.copySuccess': 'TikZ code copied to clipboard.',
            'export.tikz.copyFail': 'Copy failed. See console.',
            'export.load.success': 'Data loaded',
            'export.load.invalid': 'Invalid file',

            'panel.metrics': 'Graph Metrics',
            'panel.basic': 'Basics',
            'panel.degree': 'Degree Stats',
            'panel.struct': 'Structural Features',
            'panel.connectivity': 'Connectivity (Slow > 50)',
            'panel.adj': 'Adjacency Matrix',
            'panel.lap': 'Laplacian Matrix',

            'lang.toggle': '中'
        }
    };

    function detectLang() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'zh' || stored === 'en') return stored;
        const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
        return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    }

    let currentLang = detectLang();
    const listeners = [];

    function t(key, vars) {
        const value = (DICT[currentLang] && DICT[currentLang][key]) || (DICT.zh && DICT.zh[key]) || key;
        if (!vars) return value;
        return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])), value);
    }

    function apply(root = document) {
        document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
        if (t('app.title')) document.title = t('app.title');

        root.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.dataset.i18n;
            if (key) el.textContent = t(key);
        });
        root.querySelectorAll('[data-i18n-html]').forEach((el) => {
            const key = el.dataset.i18nHtml;
            if (key) el.innerHTML = t(key);
        });
        root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
            const spec = el.dataset.i18nAttr;
            if (!spec) return;
            spec.split(';').forEach((pair) => {
                const parts = pair.split(':').map((p) => p.trim());
                if (parts.length !== 2) return;
                el.setAttribute(parts[0], t(parts[1]));
            });
        });

        const btn = document.getElementById('btn-lang');
        if (btn) {
            btn.textContent = t('lang.toggle');
            btn.setAttribute('data-tooltip', t('tooltip.lang'));
            btn.setAttribute('aria-label', t('tooltip.lang'));
        }

        if (window.app && window.app.generator) {
            window.app.generator.renderGenSidebar(window.app.generator.currentGenType?.id);
        }
        if (window.app && window.app.exporter) {
            window.app.exporter.switchExportTab(window.app.exporter.currentExportType || 'png');
        }
        if (window.app) {
            const snapBtn = document.getElementById('btn-snap');
            if (snapBtn) {
                const snapText = t(window.app.snapEnabled ? 'tooltip.snap.on' : 'tooltip.snap.off');
                snapBtn.setAttribute('data-tooltip', snapText);
                snapBtn.setAttribute('aria-label', snapText);
            }
            const physicsBtn = document.getElementById('btn-physics');
            if (physicsBtn) {
                const physicsText = t(window.app.physics && window.app.physics.active ? 'tooltip.physics.on' : 'tooltip.physics.off');
                physicsBtn.setAttribute('data-tooltip', physicsText);
                physicsBtn.setAttribute('aria-label', physicsText);
            }
        }
        if (window.app && window.app.ui && window.app.ui.syncI18n) {
            window.app.ui.syncI18n();
        }
        if (window.app && window.app.algorithms && window.app.algorithms.applyI18n) {
            window.app.algorithms.applyI18n();
        }
    }

    function setLang(lang) {
        if (lang !== 'zh' && lang !== 'en') return;
        if (lang === currentLang) return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        apply();
        listeners.forEach((cb) => cb(lang));
    }

    function toggleLang() {
        setLang(currentLang === 'zh' ? 'en' : 'zh');
    }

    window.GraphI18n = {
        t,
        getLang: () => currentLang,
        setLang,
        toggleLang,
        apply,
        onChange: (cb) => listeners.push(cb)
    };

    document.addEventListener('DOMContentLoaded', () => {
        apply();
        const btn = document.getElementById('btn-lang');
        if (btn) {
            btn.addEventListener('click', toggleLang);
        }
    });
})();

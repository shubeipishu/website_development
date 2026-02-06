/* --- START OF FILE js/config.js --- */

// 图生成器配置
export const GRAPH_CONFIG = [
    {
        category: { zh: "基础图类", en: "Basic Graphs" },
        items: [
            {
                id: 'Kn',
                name: { zh: '完全图 (Complete)', en: 'Complete Graph' },
                latex: 'K_n',
                desc: { zh: 'n 个顶点中任意两点均相连的图 ($K_n$)。', en: 'A graph where every pair of distinct vertices is connected ($K_n$).' },
                params: [{ id: 'n', label: { zh: '顶点数 n', en: 'Vertices n' }, def: 5, min: 1, max: 50 }]
            },
            {
                id: 'Cn',
                name: { zh: '圈图 (Cycle)', en: 'Cycle Graph' },
                latex: 'C_n',
                desc: { zh: '包含 n 个顶点和 n 条边的闭合环路 ($C_n$)。', en: 'A cycle with n vertices and n edges ($C_n$).' },
                params: [{ id: 'n', label: { zh: '顶点数 n', en: 'Vertices n' }, def: 5, min: 3, max: 50 }]
            },
            {
                id: 'Pn',
                name: { zh: '路图 (Path)', en: 'Path Graph' },
                latex: 'P_n',
                desc: { zh: 'n 个顶点依次相连形成的一条路径 ($P_n$)。', en: 'A path on n vertices ($P_n$).' },
                params: [{ id: 'n', label: { zh: '顶点数 n', en: 'Vertices n' }, def: 5, min: 2, max: 50 }]
            }
        ]
    },
    {
        category: { zh: "网格与高维结构", en: "Grids & Higher Dimensions" },
        items: [
            {
                id: 'Grid',
                name: { zh: '二维网格 (Grid)', en: 'Grid Graph' },
                latex: 'G_{m,n}',
                desc: { zh: 'm 行 n 列的矩形网格图。', en: 'A rectangular grid with m rows and n columns.' },
                params: [
                    { id: 'rows', label: { zh: '行数 m', en: 'Rows m' }, def: 4, min: 2, max: 20 },
                    { id: 'cols', label: { zh: '列数 n', en: 'Cols n' }, def: 5, min: 2, max: 20 }
                ]
            },
            {
                id: 'Hypercube',
                name: { zh: '超立方体 (Hypercube)', en: 'Hypercube' },
                latex: 'Q_n',
                desc: { zh: 'n 维超立方体，包含 $2^n$ 个顶点。', en: 'An n-dimensional hypercube with $2^n$ vertices.' },
                params: [{ id: 'n', label: { zh: '维度 n', en: 'Dimension n' }, def: 3, min: 1, max: 6 }]
            }
        ]
    },
    {
        category: { zh: "多部图 & 树", en: "Multipartite & Trees" },
        items: [
            {
                id: 'Knm',
                name: { zh: '完全二部图', en: 'Complete Bipartite Graph' },
                latex: 'K_{n,m}',
                desc: { zh: '顶点分为两组，组内无边，组间全连接 ($K_{n,m}$)。', en: 'Two parts with no edges within parts and all edges across ($K_{n,m}$).' },
                params: [
                    { id: 'n', label: { zh: '左侧顶点 n', en: 'Left part n' }, def: 3, min: 1 },
                    { id: 'm', label: { zh: '右侧顶点 m', en: 'Right part m' }, def: 3, min: 1 }
                ]
            },
            {
                id: 'Star',
                name: { zh: '星图 (Star)', en: 'Star Graph' },
                latex: 'S_n',
                desc: { zh: '一个中心节点连接周围 n 个叶子节点 ($S_n$)。', en: 'One center connected to n leaves ($S_n$).' },
                params: [{ id: 'n', label: { zh: '叶子数 n', en: 'Leaves n' }, def: 5, min: 1 }]
            },
            {
                id: 'BinTree',
                name: { zh: '满二叉树 (Binary Tree)', en: 'Full Binary Tree' },
                latex: 'T_h',
                desc: { zh: '深度为 h 的满二叉树 (包含 $2^h-1$ 个顶点)。', en: 'Full binary tree of height h (with $2^h-1$ vertices).' },
                params: [{ id: 'h', label: { zh: '深度 h', en: 'Height h' }, def: 4, min: 1, max: 6 }]
            }
        ]
    },
    {
        category: { zh: "随机图模型", en: "Random Graph Models" },
        items: [
            {
                id: 'Gnp',
                name: { zh: '随机图 (Erdős-Rényi)', en: 'Erdős–Rényi Random Graph' },
                latex: 'G_{n,p}',
                desc: { zh: 'n 个顶点，每对顶点间以概率 p 连边。', en: 'n vertices, each edge included with probability p.' },
                params: [
                    { id: 'n', label: { zh: '顶点数 n', en: 'Vertices n' }, def: 15, min: 2, max: 50 },
                    { id: 'p', label: { zh: '概率 p (%)', en: 'Probability p (%)' }, def: 20, min: 0, max: 100 }
                ]
            }
        ]
    },
    {
        category: { zh: "特殊构造 & 反例", en: "Special Constructions" },
        items: [
            {
                id: 'Wn',
                name: { zh: '轮图 (Wheel)', en: 'Wheel Graph' },
                latex: 'W_n',
                desc: { zh: '由圈图 $C_n$ 和一个与圈上所有点相连的中心点构成。', en: 'A cycle $C_n$ plus a center connected to all cycle vertices.' },
                params: [{ id: 'n', label: { zh: '外圈顶点 n', en: 'Cycle vertices n' }, def: 5, min: 3 }]
            },
            {
                id: 'Petersen',
                name: { zh: '彼得森图 (Petersen)', en: 'Petersen Graph' },
                latex: '\\text{Petersen}',
                desc: { zh: '著名的 (3,5)-笼图，常用于图论反例。', en: 'A well-known (3,5)-cage, often used as a counterexample.' },
                params: []
            },
            {
                id: 'Grotzsch',
                name: { zh: '格勒奇图 (Grötzsch)', en: 'Grötzsch Graph' },
                latex: '\\text{Grötzsch}',
                desc: { zh: '最小的无三角形的 4-色图 (11 顶点)。', en: 'The smallest triangle-free 4-chromatic graph (11 vertices).' },
                params: []
            },
            {
                id: 'Heawood',
                name: { zh: '希伍德图 (Heawood)', en: 'Heawood Graph' },
                latex: '\\text{Heawood}',
                desc: { zh: '14 个顶点的 (3,6)-笼图，与环面着色相关。', en: 'A (3,6)-cage with 14 vertices, related to torus coloring.' },
                params: []
            },
            {
                id: 'Turan',
                name: { zh: '图兰图 (Turán)', en: 'Turán Graph' },
                latex: 'T_{n,r}',
                desc: { zh: '不包含 $K_{r+1}$ 的边数最多的图。', en: 'Extremal graph with no $K_{r+1}$ (Turán graph).' },
                params: [
                    { id: 'n', label: { zh: '总顶点数 n', en: 'Vertices n' }, def: 10, min: 1 },
                    { id: 'r', label: { zh: '部分数 r', en: 'Parts r' }, def: 3, min: 2 }
                ]
            }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.GRAPH_CONFIG = GRAPH_CONFIG;
}

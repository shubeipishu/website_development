/* --- START OF FILE js/config.js --- */

// 图生成器配置
const GRAPH_CONFIG = [
    {
        category: "基础图类",
        items: [
            {
                id: 'Kn',
                name: '完全图 (Complete)',
                latex: 'K_n',
                desc: 'n 个顶点中任意两点均相连的图 ($K_n$)。',
                params: [{id:'n', label:'顶点数 n', def:5, min:1, max:50}]
            },
            {
                id: 'Cn',
                name: '圈图 (Cycle)',
                latex: 'C_n',
                desc: '包含 n 个顶点和 n 条边的闭合环路 ($C_n$)。',
                params: [{id:'n', label:'顶点数 n', def:5, min:3, max:50}]
            },
            {
                id: 'Pn',
                name: '路图 (Path)',
                latex: 'P_n',
                desc: 'n 个顶点依次相连形成的一条路径 ($P_n$)。',
                params: [{id:'n', label:'顶点数 n', def:5, min:2, max:50}]
            }
        ]
    },
    {
        category: "网格与高维结构",
        items: [
            {
                id: 'Grid',
                name: '二维网格 (Grid)',
                latex: 'G_{m,n}',
                desc: 'm 行 n 列的矩形网格图。',
                params: [{id:'rows', label:'行数 m', def:4, min:2, max:20}, {id:'cols', label:'列数 n', def:5, min:2, max:20}]
            },
            {
                id: 'Hypercube',
                name: '超立方体 (Hypercube)',
                latex: 'Q_n',
                desc: 'n 维超立方体，包含 $2^n$ 个顶点。',
                params: [{id:'n', label:'维度 n', def:3, min:1, max:6}]
            }
        ]
    },
    {
        category: "多部图 & 树",
        items: [
            {
                id: 'Knm',
                name: '完全二部图',
                latex: 'K_{n,m}',
                desc: '顶点分为两组，组内无边，组间全连接 ($K_{n,m}$)。',
                params: [{id:'n', label:'左侧顶点 n', def:3, min:1}, {id:'m', label:'右侧顶点 m', def:3, min:1}]
            },
            {
                id: 'Star',
                name: '星图 (Star)',
                latex: 'S_n',
                desc: '一个中心节点连接周围 n 个叶子节点 ($S_n$)。',
                params: [{id:'n', label:'叶子数 n', def:5, min:1}]
            },
            {
                id: 'BinTree',
                name: '满二叉树 (Binary Tree)',
                latex: 'T_h',
                desc: '深度为 h 的满二叉树 (包含 $2^h-1$ 个顶点)。',
                params: [{id:'h', label:'深度 h', def:4, min:1, max:6}]
            }
        ]
    },
    {
        category: "随机图模型",
        items: [
            {
                id: 'Gnp',
                name: '随机图 (Erdős-Rényi)',
                latex: 'G_{n,p}',
                desc: 'n 个顶点，每对顶点间以概率 p 连边。',
                params: [{id:'n', label:'顶点数 n', def:15, min:2, max:50}, {id:'p', label:'概率 p (%)', def:20, min:0, max:100}]
            }
        ]
    },
    {
        category: "特殊构造 & 反例",
        items: [
            {
                id: 'Wn',
                name: '轮图 (Wheel)',
                latex: 'W_n',
                desc: '由圈图 $C_n$ 和一个与圈上所有点相连的中心点构成。',
                params: [{id:'n', label:'外圈顶点 n', def:5, min:3}]
            },
            {
                id: 'Petersen',
                name: '彼得森图 (Petersen)',
                latex: '\\text{Petersen}',
                desc: '著名的 (3,5)-笼图，常用于图论反例。',
                params: []
            },
            {
                id: 'Grotzsch',
                name: '格勒奇图 (Grötzsch)',
                latex: '\\text{Grötzsch}',
                desc: '最小的无三角形的 4-色图 (11 顶点)。',
                params: []
            },
            {
                id: 'Heawood',
                name: '希伍德图 (Heawood)',
                latex: '\\text{Heawood}',
                desc: '14 个顶点的 (3,6)-笼图，与环面着色相关。',
                params: []
            },
            {
                id: 'Turan',
                name: '图兰图 (Turán)',
                latex: 'T_{n,r}',
                desc: '不包含 $K_{r+1}$ 的边数最多的图。',
                params: [{id:'n', label:'总顶点数 n', def:10, min:1}, {id:'r', label:'部分数 r', def:3, min:2}]
            }
        ]
    }
];
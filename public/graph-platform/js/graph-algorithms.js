/* --- Graph Algorithms (Shared between Worker and Main Thread) --- */

// Helper to ensure math is available
// In Worker: importScripts loads it into self.math or global scope
// In Main: <script> loads it into window.math

function computeGraphStats(nodes, edges) {
    const start = performance.now();
    const N = nodes.length;
    const M = edges.length;

    // 映射 ID 到 0..N-1
    const idMap = new Map(nodes.map((n, i) => [n.id, i]));
    const reverseIdMap = nodes.map(n => n.id);

    // 邻接表
    const adj = Array(N).fill(0).map(() => []);
    // internalEdges: 保存了标准化后的 u, v
    const internalEdges = edges.map(e => {
        const u = idMap.get(e.s);
        const v = idMap.get(e.t);
        if (u !== undefined && v !== undefined) {
            adj[u].push(v);
            adj[v].push(u);
            return { u, v, id: e };
        }
        return null;
    }).filter(x => x);

    const degrees = adj.map(row => row.length);
    const maxDeg = N > 0 ? Math.max(...degrees) : 0;
    const minDeg = N > 0 ? Math.min(...degrees) : 0;
    const avgDeg = N > 0 ? degrees.reduce((a, b) => a + b, 0) / N : 0;

    // 连通性
    let connectivity = { kappa: 0, lambda: 0, cutNodes: [], cutEdges: [] };
    const isConnected = checkConnected(N, adj);

    if (isConnected) {
        if (N <= 50) {
            // Stoer-Wagner (Edge Connectivity + Cut Edges)
            const swRes = solveEdgeConnectivity(N, adj);
            connectivity.lambda = swRes.minCut;
            connectivity.cutEdges = swRes.cutEdges.map(e => ({ s: reverseIdMap[e.u], t: reverseIdMap[e.v] }));

            // Max-Flow (Vertex Connectivity + Cut Nodes)
            const mfRes = solveVertexConnectivity(N, adj, internalEdges);
            connectivity.kappa = mfRes.kappa;
            connectivity.cutNodes = mfRes.cutNodes.map(idx => reverseIdMap[idx]);
        } else {
            connectivity.kappa = ">50(skip)";
            connectivity.lambda = ">50(skip)";
        }
    }

    // 边染色
    let edgeColors = {};
    let chiEdge = 0;
    if (M > 0) {
        let res = solveEdgeColoring(N, internalEdges, maxDeg);
        if (res.solved) {
            chiEdge = maxDeg;
            edgeColors = mapColorsBack(res.colors, edges);
        } else {
            chiEdge = maxDeg + 1;
            let res2 = solveEdgeColoring(N, internalEdges, maxDeg + 1);
            edgeColors = mapColorsBack(res2.colors, edges);
        }
    }

    // --- 哈密顿路与圈求解 (Optimized) ---
    let hamRes = { path: null, cycle: null, msg: '-' };
    // 优化后上限提升至 24
    if (N > 0 && N <= 24) {
        hamRes = solveHamiltonian(N, adj, reverseIdMap);
    } else if (N > 24) {
        hamRes.msg = '>24(skip)';
    }

    // 矩阵 & 特征值
    const adjMat = Array(N).fill(0).map(() => Array(N).fill(0));
    internalEdges.forEach(e => { adjMat[e.u][e.v] = 1; adjMat[e.v][e.u] = 1; });
    const lapMat = Array(N).fill(0).map((_, i) => Array(N).fill(0).map((_, j) => {
        if (i === j) return degrees[i];
        return adjMat[i][j] ? -1 : 0;
    }));

    let eigA = [], eigL = [];
    try {
        // Check if math is available (it might be on self or window)
        const m = (typeof math !== 'undefined') ? math : (self.math || window.math);
        if (N > 0 && m) {
            const ansA = m.eigs(adjMat);
            const ansL = m.eigs(lapMat);
            eigA = formatEigen(ansA);
            eigL = formatEigen(ansL);
        }
    } catch (err) { /* ignore */ }

    return {
        degrees: { max: maxDeg, min: minDeg, avg: avgDeg },
        connectivity,
        edgeColoring: { chi: chiEdge, mapping: edgeColors },
        hamiltonian: hamRes,
        eigen: { adj: eigA, lap: eigL },
        matrices: { adj: adjMat, lap: lapMat },
        time: performance.now() - start
    };
}

// --- Helpers ---

function formatEigen(ans) {
    let vals = ans.values;
    if (vals._data) vals = vals._data;
    return vals.map(v => typeof v === 'number' ? v : v.re).sort((a, b) => b - a);
}

function checkConnected(N, adj) {
    if (N === 0) return false;
    const vis = new Set([0]);
    const q = [0];
    while (q.length) {
        const u = q.shift();
        for (const v of adj[u]) {
            if (!vis.has(v)) { vis.add(v); q.push(v); }
        }
    }
    return vis.size === N;
}

function mapColorsBack(internalColors, originalEdges) {
    const map = {};
    internalColors.forEach((color, idx) => {
        const e = originalEdges[idx];
        const s = e.s, t = e.t;
        const key = (s < t ? s : t) + '-' + (s < t ? t : s);
        map[key] = color;
    });
    return map;
}

// === 1. Stoer-Wagner with Partition (找割边) ===
function solveEdgeConnectivity(N, adj) {
    if (N < 2) return { minCut: 0, cutEdges: [] };
    let nodeGroups = Array.from({ length: N }, (_, i) => [i]);
    let mat = Array(N).fill(0).map(() => Array(N).fill(0));
    for (let u = 0; u < N; u++) for (let v of adj[u]) mat[u][v] = 1;

    let minCut = Infinity;
    let bestPartition = null;
    let activeNodes = Array.from({ length: N }, (_, i) => i);

    while (activeNodes.length > 1) {
        let a = activeNodes[0];
        let setA = [a];
        let prev = a, curr = a;

        for (let i = 1; i < activeNodes.length; i++) {
            prev = curr;
            let maxW = -1;
            let nextNode = -1;
            for (let n of activeNodes) {
                if (!setA.includes(n)) {
                    let w = 0;
                    for (let s of setA) w += mat[n][s];
                    if (w > maxW) { maxW = w; nextNode = n; }
                }
            }
            curr = nextNode;
            setA.push(curr);
        }

        let phaseCut = 0;
        for (let n of activeNodes) if (n !== curr) phaseCut += mat[curr][n];

        if (phaseCut < minCut) {
            minCut = phaseCut;
            bestPartition = [...nodeGroups[curr]];
        }

        nodeGroups[prev].push(...nodeGroups[curr]);
        nodeGroups[curr] = [];
        for (let i = 0; i < N; i++) {
            if (i !== prev && i !== curr) {
                mat[prev][i] += mat[curr][i];
                mat[i][prev] += mat[i][curr];
            }
        }
        activeNodes = activeNodes.filter(n => n !== curr);
    }

    let cutEdges = [];
    if (bestPartition) {
        const setS = new Set(bestPartition);
        for (let u = 0; u < N; u++) {
            for (let v of adj[u]) {
                if (u < v) {
                    if (setS.has(u) !== setS.has(v)) {
                        cutEdges.push({ u, v });
                    }
                }
            }
        }
    }
    return { minCut, cutEdges };
}

// === 2. Max-Flow with Cut Nodes (找割点) ===
function solveVertexConnectivity(N, adj, edges) {
    let isKn = true;
    for (let i = 0; i < N; i++) if (adj[i].length < N - 1) { isKn = false; break; }
    if (isKn) return { kappa: N - 1, cutNodes: [] };

    let minDegNode = 0, minD = N;
    for (let i = 0; i < N; i++) if (adj[i].length < minD) { minD = adj[i].length; minDegNode = i; }

    const s = minDegNode;
    let globalMin = N;
    let bestCutNodes = [];

    for (let t = 0; t < N; t++) {
        if (s === t) continue;
        let directlyConnected = false;
        for (let neighbor of adj[s]) if (neighbor === t) directlyConnected = true;
        if (directlyConnected) continue;

        const { flow, residual } = runVertexMaxFlow(N, edges, s, t);
        if (flow < globalMin) {
            globalMin = flow;
            bestCutNodes = findCutNodesFromResidual(N, residual, s);
        }
    }

    if (globalMin === N) {
        return { kappa: minD, cutNodes: [] };
    }
    return { kappa: globalMin, cutNodes: bestCutNodes };
}

function runVertexMaxFlow(N, edges, sId, tId) {
    const size = 2 * N;
    const capacity = Array(size).fill(0).map(() => Array(size).fill(0));

    for (let i = 0; i < N; i++) {
        if (i === sId || i === tId) capacity[i][i + N] = Infinity;
        else capacity[i][i + N] = 1;
    }
    for (let e of edges) {
        capacity[e.u + N][e.v] = Infinity;
        capacity[e.v + N][e.u] = Infinity;
    }

    const source = sId + N;
    const sink = tId;
    let flow = 0;

    while (true) {
        let parent = Array(size).fill(-1);
        let queue = [source];
        parent[source] = source;
        while (queue.length > 0 && parent[sink] === -1) {
            let u = queue.shift();
            for (let v = 0; v < size; v++) {
                if (parent[v] === -1 && capacity[u][v] > 0) {
                    parent[v] = u;
                    queue.push(v);
                }
            }
        }
        if (parent[sink] === -1) break;

        let pathFlow = Infinity;
        let curr = sink;
        while (curr !== source) {
            let prev = parent[curr];
            pathFlow = Math.min(pathFlow, capacity[prev][curr]);
            curr = prev;
        }
        flow += pathFlow;
        curr = sink;
        while (curr !== source) {
            let prev = parent[curr];
            capacity[prev][curr] -= pathFlow;
            capacity[curr][prev] += pathFlow;
            curr = prev;
        }
    }
    return { flow, residual: capacity };
}

function findCutNodesFromResidual(N, resCap, sId) {
    const size = 2 * N;
    const source = sId + N;
    let visited = new Set([source]);
    let q = [source];
    while (q.length) {
        let u = q.shift();
        for (let v = 0; v < size; v++) {
            if (!visited.has(v) && resCap[u][v] > 0) {
                visited.add(v);
                q.push(v);
            }
        }
    }
    let cutNodes = [];
    for (let i = 0; i < N; i++) {
        if (i === sId) continue;
        const u_in = i;
        const u_out = i + N;
        if (visited.has(u_in) && !visited.has(u_out)) {
            cutNodes.push(i);
        }
    }
    return cutNodes;
}

// === 3. 边染色 ===
function solveEdgeColoring(N, edges, K) {
    const M = edges.length;
    const colors = new Array(M).fill(0);
    const useBitmask = K <= 31;
    const nodeMasks = useBitmask ? new Int32Array(N).fill(0) : Array(N).fill(0).map(() => new Set());
    const sortedIndices = Array.from({ length: M }, (_, i) => i);

    function isSafe(edgeIdx, c) {
        const u = edges[edgeIdx].u, v = edges[edgeIdx].v;
        if (useBitmask) return !((nodeMasks[u] & (1 << c)) || (nodeMasks[v] & (1 << c)));
        else return !(nodeMasks[u].has(c) || nodeMasks[v].has(c));
    }

    function addColor(edgeIdx, c) {
        const u = edges[edgeIdx].u, v = edges[edgeIdx].v;
        colors[edgeIdx] = c;
        if (useBitmask) { nodeMasks[u] |= (1 << c); nodeMasks[v] |= (1 << c); }
        else { nodeMasks[u].add(c); nodeMasks[v].add(c); }
    }

    function removeColor(edgeIdx, c) {
        const u = edges[edgeIdx].u, v = edges[edgeIdx].v;
        colors[edgeIdx] = 0;
        if (useBitmask) { nodeMasks[u] &= ~(1 << c); nodeMasks[v] &= ~(1 << c); }
        else { nodeMasks[u].delete(c); nodeMasks[v].delete(c); }
    }

    function backtrack(idx) {
        if (idx === M) return true;
        const realIdx = sortedIndices[idx];
        for (let c = 1; c <= K; c++) {
            if (isSafe(realIdx, c)) {
                addColor(realIdx, c);
                if (backtrack(idx + 1)) return true;
                removeColor(realIdx, c);
            }
        }
        return false;
    }
    return { solved: backtrack(0), colors };
}

// === 4. 哈密顿路与圈 (Optimized Backtracking with Heuristics & Bitmask) ===
function solveHamiltonian(N, adj, reverseIdMap) {
    // 1. 基础检查
    if (N === 0) return { path: null, cycle: null, msg: 'Empty' };
    if (N === 1) return { path: [reverseIdMap[0]], cycle: [reverseIdMap[0], reverseIdMap[0]], msg: 'Trivial' };
    // N > 24 在外部已经被拦截，这里不再检查

    // 2. 预处理度数和邻接位掩码
    const degrees = new Int32Array(N);
    const adjBits = new Int32Array(N);
    let minDeg = N;

    for (let i = 0; i < N; i++) {
        degrees[i] = adj[i].length;
        if (degrees[i] < minDeg) minDeg = degrees[i];
        for (let neighbor of adj[i]) {
            adjBits[i] |= (1 << neighbor);
        }
    }

    // 3. 快速失败判定 (针对 Cycle)
    let possibleCycle = true;
    // 3.1 连通性检查 (位运算 BFS)
    if (!checkConnectedBit(N, adjBits)) possibleCycle = false;
    // 3.2 度数条件: 存在度数 < 2 的点，不可能有圈
    if (minDeg < 2) possibleCycle = false;
    // 3.3 割边检查: 有割边则无圈 (O(V+E))
    if (possibleCycle && hasBridge(N, adj)) possibleCycle = false;

    // 4. 启发式优化：重排邻接表
    // 策略：优先访问“度数较小”的邻居，尽早触发死胡同回溯
    const sortedAdj = adj.map(neighbors => {
        return [...neighbors].sort((a, b) => degrees[a] - degrees[b]);
    });

    let pathResult = null;
    let cycleResult = null;

    // --- 回溯核心 ---

    // 查找路径 (Backtracking + Bitmask)
    function findPath(u, count, visited, pathStack) {
        pathStack.push(u);
        const mask = (1 << u);

        if (count === N) {
            return true; // Found
        }

        const neighbors = sortedAdj[u];
        for (let i = 0; i < neighbors.length; i++) {
            const v = neighbors[i];
            if (!(visited & (1 << v))) {
                if (findPath(v, count + 1, visited | mask, pathStack)) return true;
            }
        }

        pathStack.pop();
        return false;
    }

    // 查找圈 (Backtracking + Bitmask + Fixed Start)
    function findCycle(u, startNode, count, visited, pathStack) {
        pathStack.push(u);
        const mask = (1 << u);

        if (count === N) {
            // 检查是否回到了起点
            if (adjBits[u] & (1 << startNode)) {
                pathStack.push(startNode);
                return true;
            }
            pathStack.pop();
            return false;
        }

        const neighbors = sortedAdj[u];
        for (let i = 0; i < neighbors.length; i++) {
            const v = neighbors[i];
            if (!(visited & (1 << v))) {
                if (findCycle(v, startNode, count + 1, visited | mask, pathStack)) return true;
            }
        }

        pathStack.pop();
        return false;
    }

    // 5. 执行搜索

    // 5.1 尝试找圈
    if (possibleCycle) {
        let cycleStack = [];
        // 固定起点为 0
        if (findCycle(0, 0, 1, 0, cycleStack)) {
            cycleResult = cycleStack;
            // 找到圈则必定有路径
            pathResult = cycleStack.slice(0, N);
        }
    }

    // 5.2 如果没找到圈，尝试找路径
    if (!pathResult) {
        // 启发式：从度数最小的节点开始搜，成功的概率通常更高
        const nodesByDeg = Array.from({ length: N }, (_, i) => i).sort((a, b) => degrees[a] - degrees[b]);

        for (let i of nodesByDeg) {
            let pathStack = [];
            if (findPath(i, 1, 0, pathStack)) {
                pathResult = pathStack;
                break;
            }
        }
    }

    // 6. 结果映射
    const mapIds = (arr) => arr ? arr.map(idx => reverseIdMap[idx]) : null;

    return {
        path: mapIds(pathResult),
        cycle: mapIds(cycleResult),
        msg: ''
    };
}

// --- 辅助：位运算连通性检查 (BFS) ---
function checkConnectedBit(N, adjBits) {
    let visited = 1; // Start at 0
    let q = [0];
    let count = 0;
    while (q.length) {
        let u = q.shift();
        count++;
        // 检查 u 的邻居 (在 N<=31 时非常快)
        for (let v = 0; v < N; v++) {
            if ((adjBits[u] & (1 << v)) && !(visited & (1 << v))) {
                visited |= (1 << v);
                q.push(v);
            }
        }
    }
    return count === N;
}

// --- 辅助：割边检测 (Tarjan's Bridge-finding) ---
function hasBridge(N, adj) {
    let disc = new Int32Array(N).fill(-1);
    let low = new Int32Array(N).fill(-1);
    let time = 0;
    let found = false;

    function dfs(u, p) {
        if (found) return;
        disc[u] = low[u] = ++time;
        for (let v of adj[u]) {
            if (v === p) continue;
            if (disc[v] !== -1) {
                low[u] = Math.min(low[u], disc[v]);
            } else {
                dfs(v, u);
                if (found) return;
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > disc[u]) {
                    found = true;
                    return;
                }
            }
        }
    }

    for (let i = 0; i < N; i++) {
        if (disc[i] === -1) dfs(i, -1);
        if (found) return true;
    }
    return false;
}

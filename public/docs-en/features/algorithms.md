# Graph Metrics & Visualization

The platform computes metrics automatically and provides visualization highlights (not step-by-step algorithm animation).

## Real-time computation & highlights

- Metrics are recomputed automatically whenever the graph changes.
- Heavier metrics run asynchronously in **Web Workers** to avoid blocking the UI.
- Click the 👁️ icon next to a metric in the right panel to toggle its highlight.

## Metric list (matches the panel)

### Basic stats

- |V|, |E|
- Maximum degree Δ, minimum degree δ, average degree d

### Structural metrics & highlights

- **Diameter diam(G)**: Highlights a diameter path (∞ for disconnected graphs; no highlight).
- **Graph coloring χ(G)**: Colors nodes and shows color indices.
- **Edge coloring χ'(G)**: Colors edges and shows color indices at edge midpoints.
- **Maximum independent set α(G)**: Highlights nodes in a maximum independent set.
- **Distance dist(u, v)**: Shown only when **two nodes are selected**, and highlights the shortest path.

### Connectivity & cuts

When the graph is connected and not too large, the platform computes:

- **Vertex connectivity κ** and **articulation points (cut vertices)** (blink).
- **Edge connectivity λ** and **bridges (cut edges)** (blink).

> Size limit: when |V| > 50, connectivity and cut vertices/edges show as `>50(skip)`.

### Hamiltonian path / cycle

- Attempts to solve and highlight when |V| ≤ 24.
- Shows `>24(skip)` when |V| > 24.

### Matrices & spectrum

- Adjacency matrix A and Laplacian matrix L
- Eigenvalues of A and L (displayed in descending order)

## How to use

1. Create or import a graph
2. Check metrics in the right panel
3. Click the 👁️ icon to highlight
4. Click again to clear

---

📖 Back: [Graph Editing](graph-editing.md)

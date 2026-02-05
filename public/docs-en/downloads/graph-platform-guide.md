# Graph Platform Pro - Complete User Guide

**Version**: v6.1  
**Updated**: 2026-01

---

## Contents

1. [Overview](#overview)
2. [Installation & Run](#installation--run)
3. [Graph Editing](#graph-editing)
4. [Graph Metrics & Visualization](#graph-metrics--visualization)
5. [Export](#export)
6. [Shortcuts](#shortcuts)

---

## Overview

**Graph Platform Pro** is a high-performance web-based graph visualization and computation tool for teaching, research, and algorithm demonstrations.

### Features

- 🎨 **Interactive graph editing** - Intuitive drag-and-drop to create and edit graph structures
- ⚡ **High-performance computing** - Parallel computation with Web Workers for a smooth UI
- 📊 **Graph metrics & visualization** - Diameter, coloring, connectivity, Hamiltonian metrics with highlights
- 🎯 **Force-directed layout** - Automatically optimizes node positions for cleaner layouts
- 🌓 **Dark/Light themes** - Eye-friendly modes for different environments
- 📤 **Multi-format export** - PNG images and TikZ code export

### System Requirements

| Item | Requirement |
|------|-------------|
| Browser | Chrome 80+, Firefox 75+, Edge 80+ |
| Screen resolution | 1280×720 or higher recommended |
| JavaScript | Must be enabled |

---

## Installation & Run

### Online Use (Recommended)

Use the online version directly with no installation.

### Local Run

Because the project uses ES Modules and Web Workers, it must be served over HTTP.

**Python:**
```bash
cd public/apps/graph-platform
python -m http.server 8080
# visit http://localhost:8080
```

**Node.js:**
```bash
npx http-server -p 8080
```

**Docker:**
```bash
docker-compose up -d --build
# visit http://localhost
```

---

## Graph Editing

### Create Nodes & Edges

- **Create a node**: Double-click on the empty canvas.
- **Create an edge**: Hold `Shift` and drag from one node to another.
- **Drag to empty space**: Hold `Shift` and drag from a node to empty space to create a new node and connect it.
- **Indexing rule**: Node labels follow creation order (starting from 1). Deleting nodes will reindex them.

### Selection & Movement

| Action | Description |
|------|------|
| Click a node/edge | Select a single node or edge |
| `Ctrl`/`Cmd` + Click | Multi-select nodes or edges |
| Drag on empty space | Box-select multiple nodes and edges |
| Drag selected nodes | Move selected nodes together |

### View Controls

| Action | Description |
|------|------|
| Mouse wheel | Zoom canvas (about 0.1x - 5x) |
| Space + Left drag | Pan the view |
| Middle mouse drag | Pan the view |
| `0` | Reset view |

### Delete & Clipboard

- `Delete` / `Backspace`: Delete selected elements.
- `Ctrl + A`: Select all.
- `Ctrl + C / X / V`: Copy / Cut / Paste at the mouse position.
- `Ctrl + D`: Duplicate (offset copy).

### Tools & Export

- Graph generator: Quickly generate common structures.
- Physics layout: Toggle force-directed layout.
- Smart snap: Toggle alignment guides.
- Export: PNG / TikZ.

---

## Graph Metrics & Visualization

The platform computes metrics automatically and provides visualization highlights (not step-by-step algorithm animation).

### Real-time computation

- Metrics are recomputed automatically when the graph changes.
- Complex metrics run asynchronously in Web Workers to avoid UI lag.

### Metric list

- |V|, |E|, maximum degree Δ, minimum degree δ, average degree d
- Diameter diam(G)
- Graph coloring χ(G), edge coloring χ'(G)
- Maximum independent set α(G)
- Distance dist(u, v) (requires two selected nodes)
- Vertex connectivity κ / articulation points (|V| ≤ 50)
- Edge connectivity λ / bridges (cut edges) (|V| ≤ 50)
- Hamiltonian path / cycle (|V| ≤ 24)
- Adjacency matrix A, Laplacian matrix L, and eigenvalues

### How to use

1. Create or import a graph
2. Check metrics in the right panel
3. Click the 👁️ icon to highlight
4. Click again to clear

---

## Export

### PNG Export

1. Click the "Export" button in the toolbar
2. Choose "PNG Image"
3. Set resolution and background color
4. Click "Download"

### TikZ Export

1. Click the "Export" button in the toolbar
2. Choose "TikZ Code"
3. Copy the generated LaTeX code
4. Paste into a LaTeX document

---

## Shortcuts

| Shortcut | Action |
|--------|------|
| `Shift + Drag` | Create edge from a node |
| `Delete` / `Backspace` | Delete selected elements |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + S` | Save graph |
| `Ctrl + O` | Open graph |
| `Ctrl + A` | Select all |
| `Ctrl + C / X / V` | Copy / Cut / Paste |
| `Ctrl + D` | Duplicate |
| `Space + Drag` | Pan view |
| `0` | Reset view |

---

## FAQ

### Q: Why does it break when I open the HTML file directly?

**A:** The browser blocks ES Modules and Web Workers under the `file://` protocol. Use an HTTP server.

### Q: How do I save my graph?

**A:** Use `Ctrl + S` to save as JSON, and `Ctrl + O` to load it back.

### Q: Why do some metrics show "skip"?

**A:** Some metrics are expensive on large graphs: connectivity/cut vertices/cut edges are skipped when |V| > 50, and Hamiltonian path/cycle when |V| > 24.

---

*This document is generated by Graph Platform Pro*

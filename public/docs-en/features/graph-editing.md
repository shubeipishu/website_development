# Graph Editing

## Create Nodes & Edges

- **Create a node**: Double-click on the empty canvas.
- **Create an edge**: Hold `Shift` and drag from one node to another.
- **Drag to empty space**: Hold `Shift` and drag from a node to empty space to create a new node and connect it.
- **Indexing rule**: Node labels follow creation order (starting from 1). Deleting nodes will reindex them.

## Selection & Movement

| Action | Description |
|------|------|
| Click a node/edge | Select a single node or edge |
| `Ctrl`/`Cmd` + Click | Multi-select nodes or edges |
| Drag on empty space | Box-select multiple nodes and edges |
| Drag selected nodes | Move selected nodes together |

## View Controls

| Action | Description |
|------|------|
| Mouse wheel | Zoom canvas (about 0.1x - 5x) |
| Space + Left drag | Pan the view |
| Middle mouse drag | Pan the view |
| `0` | Reset view to origin and 100% zoom |

## Delete & Clipboard

- `Delete` / `Backspace`: Delete selected elements (removes incident edges when deleting nodes).
- `Ctrl + A`: Select all.
- `Ctrl + C / X / V`: Copy / Cut / Paste at the mouse position.
- `Ctrl + D`: Duplicate (offset copy).

## Context Menu

Right-click on the canvas to open the context menu:

- Copy / Cut / Delete / Duplicate
- Paste (if clipboard has content)
- Export TikZ

## Tools

- **Graph generator**: Left-side ✨ button for common graph structures.
- **Physics layout**: ⚛️ toggle for force-directed layout to untangle and auto-arrange.
- **Smart snap**: 🧲 toggle for alignment guides when moving nodes.
- **Clear canvas**: 💣 one-click reset.

## Import & Export

- `Ctrl + S`: Save current graph as JSON.
- `Ctrl + O`: Open a JSON file.
- Toolbar "Export" supports PNG / TikZ.

---

📖 Related: [Graph Metrics & Visualization](algorithms.md)

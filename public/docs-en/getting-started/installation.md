# Installation & Run

This document explains how to run **Graph Platform Pro** locally.

> [!NOTE]
> **Graph Platform Pro** is a standalone front-end project and runs without a backend.

## Online Use (Recommended)

The easiest way is to use the online version with no installation:

👉 <a href="/apps/graph-platform/" target="_blank" rel="noopener noreferrer">Try Graph Platform Pro</a>

---

## Local Run

Because the project uses **ES Modules** and **Web Workers**, it must be served over HTTP. You cannot open the HTML file directly by double-clicking.

### Option 1: One-click startup script (Recommended)

The project provides a `start_server.bat` script that detects the environment and starts a local server:

```bash
# Go to the graph platform directory
cd public/apps/graph-platform

# Double-click start_server.bat
# or run from terminal:
start_server.bat
```

The script will:
1. Detect local Python virtual environment (`.venv`)
2. Detect global Node.js
3. Detect global Python
4. Fallback: use the built-in PowerShell server

After startup, it opens `http://127.0.0.1:8080` automatically.

### Option 2: Python

If you have Python 3.x installed:

```bash
# Go to the project directory
cd public/apps/graph-platform

# Start an HTTP server
python -m http.server 8080

# Visit http://127.0.0.1:8080
```

### Option 3: Node.js

If you have Node.js installed:

```bash
# Install http-server globally
npm install -g http-server

# Go to the project directory
cd public/apps/graph-platform

# Start the server
http-server -p 8080

# Visit http://127.0.0.1:8080
```

### Option 4: VS Code Live Server

1. Install the **Live Server** extension
2. Right-click `public/apps/graph-platform/index.html`
3. Choose "Open with Live Server"

---

## FAQ

### Q: Why does it break when I open the HTML file directly?

**A:** The browser blocks ES Modules and Web Workers under the `file://` protocol. You must use an HTTP server.

### Q: The server runs but the page is blank. Why?

**A:** Please check:
1. You are visiting the correct port (e.g., 8080)
2. The browser console has no errors
3. All dependency files exist

---

📖 Next: [Graph Editing](../features/graph-editing.md)

# 安装与运行

本文档介绍如何在**本地运行图论科研平台 Pro**。

> [!NOTE]
> **图论科研平台 Pro** 是一个独立的纯前端项目，无需后端即可运行。

## 在线使用（推荐）

最简单的方式是直接访问在线版本，无需任何安装：

👉 [立即体验图论科研平台 Pro](/graph-platform/)

---

## 本地运行

由于项目使用了 **ES Modules** 和 **Web Workers**，需要通过 HTTP 服务器访问，不能直接双击 HTML 文件打开。

### 方式一：使用一键启动脚本（推荐）

项目提供了 `start_server.bat` 脚本，自动检测环境并启动服务器：

```bash
# 进入图论平台目录
cd graph-platform

# 双击运行 start_server.bat
# 或在命令行执行：
start_server.bat
```

脚本会自动：
1. 检测本地 Python 虚拟环境 (`.venv`)
2. 检测全局 Node.js
3. 检测全局 Python
4. 备用方案：使用 PowerShell 内置服务器

启动后会自动打开浏览器访问 `http://127.0.0.1:8080`

### 方式二：手动使用 Python

如果你安装了 Python 3.x：

```bash
# 进入项目目录
cd graph-platform

# 启动 HTTP 服务器
python -m http.server 8080

# 访问 http://127.0.0.1:8080
```

### 方式三：使用 Node.js

如果你安装了 Node.js：

```bash
# 全局安装 http-server
npm install -g http-server

# 进入项目目录
cd graph-platform

# 启动服务器
http-server -p 8080

# 访问 http://127.0.0.1:8080
```

### 方式四：使用 VS Code Live Server

1. 安装 **Live Server** 扩展
2. 右键点击 `graph-platform/index.html`
3. 选择「Open with Live Server」

---

## 常见问题

### Q: 为什么双击 HTML 打开后功能不正常？

**A:** 浏览器对 `file://` 协议有安全限制，阻止了 ES Modules 和 Web Workers 的加载。必须通过 HTTP 服务器访问。

### Q: 开发服务器启动了但页面空白？

**A:** 请检查：
1. 确认访问的是正确的端口（如 8080）
2. 检查浏览器控制台是否有错误
3. 确认所有依赖文件都存在

---

📖 下一步：[图形编辑](../features/graph-editing.md)


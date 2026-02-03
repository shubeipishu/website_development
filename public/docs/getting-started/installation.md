# 安装与运行

本文档介绍如何在本地环境运行图论科研平台。

## 在线使用（推荐）

最简单的方式是直接访问在线版本，无需任何安装：

👉 [立即体验图论平台](/graph-platform/)

## 本地运行

由于项目使用了 **ES Modules** 和 **Web Workers**，需要通过 HTTP 服务器访问，不能直接双击 HTML 文件打开。

### 方式一：使用 Python（推荐）

如果你安装了 Python 3.x：

```bash
# 进入项目目录
cd graph-platform

# 启动 HTTP 服务器
python -m http.server 8080

# 访问 http://localhost:8080
```

### 方式二：使用 Node.js

如果你安装了 Node.js：

```bash
# 全局安装 http-server
npm install -g http-server

# 启动服务器
http-server -p 8080

# 访问 http://localhost:8080
```

### 方式三：使用 VS Code

1. 安装 **Live Server** 扩展
2. 右键点击 `index.html`
3. 选择「Open with Live Server」

## Docker 部署

项目已配置 Docker 支持，可以一键部署：

```bash
# 构建并启动
docker-compose up -d --build

# 访问 http://localhost
```

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

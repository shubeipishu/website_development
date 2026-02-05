# 项目上下文：网站开发工作区

该目录是一个个人网站开发工作区，包含一个主要的个人主页和几个子项目，其中最重要的是 **图论科研平台 Pro**。

## 📂 目录概览

*   **`index.html`**: 主入口点。作为个人主页，链接到各子项目。
*   **`public/apps/graph-platform/`**: 一个用于图论研究和可视化的复杂纯前端 Web 应用（见下文详细介绍）。
*   **`.venv/`**: Python 虚拟环境，用于运行本地开发服务器（如 `python -m http.server`）。
*   **`ai_studio_code.html`**: 一个独立的 HTML 文件（可能是原型或实验代码）。
*   **`.idea/`**: JetBrains IDE 配置文件。

---

## 🕸️ 子项目：图论科研平台 Pro (`public/apps/graph-platform/`)

**当前版本：** v6.1 (智能 UI)

一个强大的交互式工具，用于图论研究、教学和算法可视化。它使用原生 JavaScript 和 HTML5 Canvas 完全在浏览器中运行。

### 🛠️ 技术栈
*   **核心**: 原生 JavaScript (ES6+ 模块), HTML5 Canvas。
*   **架构**:
    *   **主线程**: UI 处理，Canvas 渲染 (`modules/renderer.js`)，物理引擎 (`modules/physics.js`)。
    *   **Web Worker (`worker.js`)**: 处理密集型图算法（连通性、染色、最大流），保持 UI 响应流畅。
*   **样式**: CSS 变量（主题切换），Font Awesome。
*   **库**:
    *   **Math.js**: 矩阵运算（目前通过 CDN 加载）。
    *   **KaTeX**: LaTeX 公式渲染（目前通过 CDN 加载）。

### 📂 关键文件结构
```text
public/apps/graph-platform/
├── index.html          # 应用入口点
├── css/
│   └── styles.css      # 全局样式与主题
├── js/
│   ├── app.js          # 主控制器 (GraphApp 类) - *高复杂度*
│   ├── worker.js       # 算法计算线程
│   ├── config.js       # 图生成器配置
│   └── modules/        # 功能模块
│       ├── renderer.js # Canvas 绘图逻辑
│       ├── algorithms.js # 可视化数据处理
│       ├── physics.js  # 力导向布局引擎
│       └── input.js    # 鼠标/键盘交互
└── docs/               # 文档与路线图
```

### 🚀 开发与运行
由于项目使用了 **ES Modules** 和 **Web Workers**，它 **不能** 直接从文件系统运行 (`file://`)。需要本地 HTTP 服务器。

**使用 Python（推荐）:**
1.  激活虚拟环境（可选但推荐）:
    ```powershell
    .\.venv\Scripts\activate
    ```
2.  启动服务器:
    ```powershell
    python -m http.server 8080
    ```
3.  访问地址: `http://localhost:8080/apps/graph-platform/`

**使用 Node.js:**
```powershell
npx http-server .
```

### 🗺️ 路线图与任务
详情请参考 `public/apps/graph-platform/ROADMAP.md`。
1.  **依赖本地化**: 下载 `math.js` 和 `katex` 到 `js/libs/` 以支持离线使用。
2.  **导出增强**: 改进 PNG 导出并添加 TikZ (LaTeX) 代码生成。
3.  **重构**: 将庞大的 `app.js` 拆分为更小、更专注的模块。

---

## 📝 开发公约
*   **风格**: 现代原生 JS 类结构。
*   **注释**: 代码注释良好，尤其是 `app.js`。
*   **格式**: 4 空格缩进（推测）。
*   **语言**: 思考过程和回复使用简体中文。

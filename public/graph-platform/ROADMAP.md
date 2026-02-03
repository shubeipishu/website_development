# 图论科研平台 (Graph Platform) - 开发路线图

## 1. 项目现状分析 (Current Status)

### ✅ 优点
*   **功能完备**: 具备节点/边编辑、多种图生成器、物理布局、吸附对齐等核心功能。
*   **算法强大**: 实现了连通性(Stoer-Wagner/Max-Flow)、染色、哈密顿路、矩阵特征值等高级图论算法。
*   **性能优化**: 采用 Web Worker (`js/worker.js`) 处理密集计算，保证 UI 流畅。
*   **视觉效果**: 拥有完善的亮色/暗色主题，且针对 CSS 变量过渡做了细腻的优化。

### ⚠️ 潜在风险与改进点
*   **外部依赖**: `index.html` 和 `worker.js` 依赖 CDN (Math.js, KaTeX)。断网或 CDN 故障会导致应用不可用（尤其是 Worker 环境）。
*   **移动端适配**: 交互逻辑仅绑定鼠标事件，不支持触摸屏设备。
*   **代码结构**: `app.js` 单文件代码量较大 (~1200行)，逻辑耦合度高，不利于长期维护。

---

## 2. 后续开发路径 (Development Path)

### 🚀 阶段一：稳健性与实用性增强 (High Priority)
**目标**: 解决依赖问题，提升科研实用价值。

1.  **依赖本地化 (Offline Support)**
    *   下载 `math.js` 和 `katex` 到本地 `js/libs/` 目录。
    *   修改 `index.html` 和 `worker.js` 的引用路径。
    *   *价值*: 实现完全离线运行，解决 `file://` 协议下的跨域/加载问题。

2.  **导出功能增强 (Export Tools)**
    *   **图片导出**: 将 Canvas 内容导出为 PNG/JPG 高清图片。
    *   **LaTeX/TikZ 导出**: 生成图的 TikZ 代码，方便直接复制到 LaTeX 论文中。
    *   *价值*: 直接服务于“科研平台”的定位，方便用户撰写论文。

### ✨ 阶段二：交互与可视化升级 (Medium Priority)
**目标**: 提升用户体验和教学演示效果。

3.  **移动端/触摸支持 (Touch Support)**
    *   添加 `touchstart`, `touchmove`, `touchend` 事件监听。
    *   适配多指手势（缩放、平移）。
    *   *价值*: 支持 iPad/平板演示，扩大使用场景。

4.  **算法过程动画 (Algorithm Animation)**
    *   不仅仅展示结果，而是动画化算法执行过程（如 BFS 波纹、Dijkstra 搜索路径、最小生成树生长）。
    *   *价值*: 增强教学和演示的直观性。

### 🛠️ 阶段三：架构重构与深度优化 (Long Term)
**目标**: 降低维护成本，提升性能。

5.  **代码重构 (Refactoring)**
    *   拆分 `app.js`:
        *   `Renderer.js`: 负责 Canvas 绘图。
        *   `InputHandler.js`: 处理鼠标/键盘事件。
        *   `GraphModel.js`: 管理节点和边的数据。
        *   `UIManager.js`: 管理 DOM 元素和侧边栏。
    *   引入 ES Modules。

6.  **性能优化**
    *   对于超大规模图 (>1000节点)，探索 WebGL 渲染 (PixiJS/Three.js)。

---

## 3. 建议立即执行的下一步
**推荐任务**: **依赖本地化** 和 **TikZ 导出**。
这不仅能解决潜在的运行稳定性问题，还能立即提升作为“科研工具”的价值。

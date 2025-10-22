# AGENTS.md

## 项目概述 (Project Overview)

这是一个 Figma 插件项目：  
用户可以上传设计稿截图或在 Figma 中选中某个节点，插件会识别设计稿中的 UI 组件（如 Button、Card、Input 等），并将识别结果反馈给插件 UI 展示，同时未来可能在 Figma 画布上高亮标出组件位置。

核心流程如下：

1. Figma 插件前端（UI + main）负责选取节点、截图、上传、展示结果  
2. 后端服务接收上传图像 / 选区数据，调用 AI 模型进行组件识别  
3. 后端将识别结果（JSON 格式）返回前端  
4. 前端解析识别结果，在插件界面中展示组件类别与位置  
5. （可选）前端通过 Figma 插件 API 在画布上绘制高亮（遮罩 / 边框）

技术栈（初定）：

- 插件前端：React + TypeScript + Figma Plugin UI 库（https://github.com/thomas-lowry/figma-plugin-ds）  
- 后端：Node.js + Express  
- AI 调用：OpenAI / 微软 Florence / 其他视觉 / 多模态模型  
- 部署：初期本地 + ngrok，后期可部署到云端（Vercel / Render / AWS / Azure）  
- 版本控制：Git / GitHub  

---

## 环境搭建 / 启动命令 (Setup / Run Commands)

# 安装依赖
cd backend
npm install

cd frontend
npm install

# 启动后端（例如在 3000 端口）
cd backend
npm run dev

# 启动插件前端（用于开发 UI），watch 模式
cd frontend
npm run dev

# 启动 Figma 插件加载流程（可调用 figma-plugin 的开发工具 / 本地调试脚本）
# （视具体脚本而定，例如：）
npm run watch:plugin  

---

## 代码规范 & 风格 (Code Style Guidelines)

* TypeScript 开启 `strict` 模式
* 使用单引号（'）而非双引号（"）
* 代码缩进 2 空格
* 对 React 组件使用函数式组件 + Hooks
* 尽量保持模块职责单一（前端 UI、后端路由、AI 调用分层）
* 每个功能 / 核心逻辑编写单元测试或至少有注释

---

## 项目结构 / 模块说明 (Project Structure & Module Roles)

根目录/
├── README.md          
├── AGENTS.md          # 开发规范
├── package.json       # 依赖与脚本
├── manifest.json      # 插件配置
├── tsconfig.json      # TypeScript 配置
├── src/               # 源码
│   ├── code.ts
│   └── ui.html
└── dist/              # 编译产物
    └── code.js

---

## 任务指令 & 交互流程 (Agent Tasks & Interaction Flow)

1. **优先理解上下文**：请先阅读 AGENTS.md 和当前目录结构，理解整个项目目的与流程。
2. **切分任务**：若用户请求较大功能（例如“实现组件识别”），请先拆成多个子任务（前端调用、后端路由、AI 客户端）再逐步生成代码。
3. **代码风格一致性**：输出的代码需遵守 Code Style 部分指定的风格。
4. **加注释 / 文档**：每个生成的较复杂函数或模块都应该有简要注释说明其用途。
5. **不要做假设**（除非用户明确）：如果用户未指定某个细节（如 API 返回格式、模型接口），请先向用户确认或者提供几种选项。
6. **输出测试 / 边界判断**：关键逻辑（如解析识别结果、图片上传）应包含错误分支、异常处理、输入校验。
7. **增量交付**：不要一次输出太大文件。可以先输出接口 / types，再逐步输出实现。
8. **及时提问**：对于任何不清楚的地方，都可以要求用户做进一步澄清或提供更多信息。

---

## 特殊注意事项 / 限制 (Caveats & Constraints)

* 插件环境受限：UI 部分运行在 Figma Plugin 的 sandbox 环境，不能访问任意 DOM 或窗口 API
* 图片大小 / 网络延迟：上传图像要有限制（如压缩、分辨率上限），对超大图片做降采样处理
* 模型调用成本：调用外部 AI 接口可能有费用 / 速率限制，建议做缓存 / 本地 mock
* 安全 / 隐私：用户上传的设计稿可能含商业机密。后端处理时请注意临时存储、加密传输、资源清理
* 版本兼容：不同 Figma 客户端可能有细微差别，插件接口要做容错

---
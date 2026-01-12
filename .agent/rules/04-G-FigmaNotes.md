---
trigger: glob
description: "Figma 插件通信协议与安全规范"
globs: frontend/**
---

# 规则: Figma 插件开发注意事项 (Figma Notes)

> **匹配模式 (Glob)**: `frontend/**`

--------------------------------------------------

## 通信
- 必须使用 `parent.postMessage` 进行 UI (`ui.html`) 与逻辑层 (`code.ts`) 之间的通信。
- 严禁尝试从 UI 线程直接访问 Figma 场景图 (DOM)。

--------------------------------------------------

## 安全与防护
- **严禁泄密**: 永远不要在前端代码中硬编码 API Key 或凭据。
- **图像处理**: 优雅地处理大型图像 Blob，以防止 Figma 沙盒崩溃。
- **Feedback**: 在等待后端响应时，必须提供视觉反馈 (如加载动画/遮罩)。
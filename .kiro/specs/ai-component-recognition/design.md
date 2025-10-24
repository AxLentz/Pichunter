# AI 组件识别功能设计文档

## 概述

AI 组件识别功能是一个端到端的系统，包含 Figma 插件前端、后端 API 服务和 AI 识别引擎。系统通过计算机视觉技术自动识别设计稿中的 UI 组件，并提供可视化的识别结果展示。

## 架构

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Figma Plugin  │    │   Backend API   │    │   AI Service    │
│                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │    UI     │  │◄──►│  │  Express  │  │◄──►│  │  Vision   │  │
│  │  (HTML)   │  │    │  │  Server   │  │    │  │   Model   │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │   Main    │  │    │  │   Image   │  │    │  │Component  │  │
│  │ (code.ts) │  │    │  │ Processing│  │    │  │Classifier │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈

**前端 (Figma Plugin):**
- TypeScript
- Figma Plugin API
- HTML/CSS (Figma Plugin DS)

**后端 (API Server):**
- Node.js + Express
- Multer (文件上传)
- Sharp (图像处理)
- Axios (HTTP 客户端)

**AI 服务:**
- OpenAI GPT-4 Vision API
- 或 Microsoft Florence-2 模型
- 或 Google Cloud Vision API

## 组件和接口

### 1. Figma 插件组件

#### 1.1 主线程 (code.ts)
```typescript
interface PluginMessage {
  type: 'exportImage' | 'recognitionResult' | 'error';
  data: any;
}

interface ExportOptions {
  format: 'PNG';
  constraint: { type: 'SCALE'; value: number };
}
```

**核心功能:**
- 监听节点选择事件
- 导出选中节点为图像
- 与 UI 线程通信
- 处理识别结果展示

#### 1.2 UI 组件 (ui.html)
```typescript
interface RecognitionRequest {
  imageData: Uint8Array;
  imageFormat: 'PNG';
  options?: {
    confidence_threshold: number;
    max_components: number;
  };
}

interface ComponentResult {
  type: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
}
```

**UI 状态管理:**
- 图像预览显示
- 识别进度指示
- 结果可视化展示
- 错误处理界面

### 2. 后端 API 组件

#### 2.1 Express 服务器
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

interface RecognitionResponse {
  components: ComponentResult[];
  processing_time: number;
  image_dimensions: {
    width: number;
    height: number;
  };
}
```

**API 端点:**
- `POST /api/recognize` - 组件识别
- `GET /api/health` - 健康检查
- `POST /api/batch-recognize` - 批量识别

#### 2.2 图像处理模块
```typescript
interface ImageProcessor {
  validateImage(buffer: Buffer): Promise<boolean>;
  resizeImage(buffer: Buffer, maxSize: number): Promise<Buffer>;
  convertFormat(buffer: Buffer, format: string): Promise<Buffer>;
}
```

### 3. AI 识别服务

#### 3.1 组件分类器
```typescript
interface ComponentClassifier {
  recognizeComponents(imageBuffer: Buffer): Promise<ComponentResult[]>;
  getSupportedTypes(): string[];
  setConfidenceThreshold(threshold: number): void;
}

// 支持的组件类型
enum ComponentType {
  BUTTON = 'button',
  INPUT = 'input',
  CARD = 'card',
  NAVIGATION = 'navigation',
  ICON = 'icon',
  TEXT = 'text',
  IMAGE = 'image',
  LIST = 'list',
  MODAL = 'modal',
  DROPDOWN = 'dropdown'
}
```

## 数据模型

### 识别结果数据结构
```typescript
interface RecognitionResult {
  id: string;
  timestamp: string;
  image_info: {
    width: number;
    height: number;
    format: string;
    size_bytes: number;
  };
  components: ComponentResult[];
  metadata: {
    processing_time_ms: number;
    model_version: string;
    confidence_threshold: number;
  };
}

interface ComponentResult {
  id: string;
  type: ComponentType;
  label: string;
  confidence: number;
  bbox: BoundingBox;
  attributes?: {
    text_content?: string;
    color_scheme?: string;
    size_category?: 'small' | 'medium' | 'large';
  };
}

interface BoundingBox {
  x: number;      // 左上角 x 坐标 (像素)
  y: number;      // 左上角 y 坐标 (像素)
  width: number;  // 宽度 (像素)
  height: number; // 高度 (像素)
}
```

## 错误处理

### 错误类型定义
```typescript
enum ErrorCode {
  INVALID_IMAGE = 'INVALID_IMAGE',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  retry_after?: number; // 秒数，用于限流错误
}
```

### 错误处理策略
1. **客户端错误处理**: 显示用户友好的错误信息，提供重试选项
2. **网络错误**: 自动重试机制，最多重试 3 次
3. **服务器错误**: 记录详细日志，返回通用错误信息
4. **限流处理**: 显示等待时间，支持队列机制

## 测试策略

### 1. 单元测试
- **前端组件测试**: 图像导出、UI 交互、消息传递
- **后端 API 测试**: 路由处理、图像验证、错误处理
- **AI 服务测试**: 模型调用、结果解析、性能测试

### 2. 集成测试
- **端到端流程测试**: 从图像选择到结果展示的完整流程
- **API 集成测试**: 前端与后端的接口对接
- **AI 服务集成**: 后端与 AI 模型的集成测试

### 3. 性能测试
- **图像处理性能**: 不同大小图像的处理时间
- **并发处理能力**: 多用户同时使用的性能表现
- **内存使用监控**: 防止内存泄漏和过度使用

### 4. 用户体验测试
- **响应时间测试**: 确保在可接受的时间内返回结果
- **界面可用性测试**: 验证界面操作的直观性和易用性
- **错误场景测试**: 验证各种错误情况下的用户体验

## 部署和运维

### 开发环境
- 本地开发: Node.js + ngrok 进行内网穿透
- 热重载: 支持代码修改后自动重启
- 调试工具: 集成 Chrome DevTools 支持

### 生产环境
- **云服务部署**: Vercel/Render/AWS Lambda
- **CDN 加速**: 静态资源使用 CDN 分发
- **负载均衡**: 支持水平扩展
- **监控告警**: 集成性能监控和错误追踪

### 安全考虑
- **图像数据安全**: 上传图像临时存储，处理完成后自动删除
- **API 安全**: 实现 API 密钥认证和请求限流
- **数据传输**: 使用 HTTPS 加密传输
- **隐私保护**: 不保存用户设计稿数据，确保商业机密安全
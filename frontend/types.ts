// ============ 核心数据类型定义 ============

/**
 * UI 组件类型枚举
 */
export enum ComponentType {
  BUTTON = 'button',
  INPUT = 'input',
  CARD = 'card',
  MODAL = 'modal',
  NAVIGATION = 'navigation',
  HEADER = 'header',
  FOOTER = 'footer',
  SIDEBAR = 'sidebar',
  LIST = 'list',
  TABLE = 'table',
  FORM = 'form',
  ICON = 'icon',
  IMAGE = 'image',
  TEXT = 'text',
  CONTAINER = 'container',
  UNKNOWN = 'unknown'
}

/**
 * 组件边界框坐标
 */
export interface BoundingBox {
  x: number;      // 左上角 X 坐标
  y: number;      // 左上角 Y 坐标
  width: number;  // 宽度
  height: number; // 高度
}

/**
 * 识别到的单个组件信息
 */
export interface DetectedComponent {
  id: string;                    // 唯一标识符
  type: ComponentType;           // 组件类型
  confidence: number;            // 置信度 (0-1)
  boundingBox: BoundingBox;      // 边界框坐标
  label: string;                 // 组件标签/名称
  description?: string;          // 组件描述
  properties?: ComponentProperties; // 组件属性
}

/**
 * 组件属性（可扩展）
 */
export interface ComponentProperties {
  text?: string;           // 文本内容
  placeholder?: string;    // 占位符文本
  variant?: string;        // 变体类型 (primary, secondary, etc.)
  size?: string;          // 尺寸 (small, medium, large)
  state?: string;         // 状态 (default, hover, active, disabled)
  color?: string;         // 主色调
  hasIcon?: boolean;      // 是否包含图标
  isInteractive?: boolean; // 是否可交互
}

/**
 * 完整的识别结果
 */
export interface RecognitionResult {
  imageId: string;                    // 图片标识符
  timestamp: number;                  // 识别时间戳
  components: DetectedComponent[];    // 识别到的组件列表
  totalComponents: number;            // 组件总数
  processingTime: number;             // 处理耗时（毫秒）
  imageInfo: ImageInfo;              // 图片信息
}

/**
 * 图片信息
 */
export interface ImageInfo {
  width: number;    // 图片宽度
  height: number;   // 图片高度
  format: string;   // 图片格式 (PNG, JPG, etc.)
  size: number;     // 文件大小（字节）
}

/**
 * 识别状态
 */
export enum RecognitionStatus {
  IDLE = 'idle',           // 空闲状态
  PROCESSING = 'processing', // 处理中
  SUCCESS = 'success',     // 成功
  ERROR = 'error'          // 错误
}

/**
 * 识别状态信息
 */
export interface RecognitionState {
  status: RecognitionStatus;
  result?: RecognitionResult;
  error?: string;
  progress?: number; // 进度百分比 (0-100)
}

/**
 * UI 消息类型
 */
export interface UIMessage {
  type: 'exportImage' | 'clearImage' | 'exportError' | 'recognitionResult' | 'recognitionError' | 'recognitionProgress';
  data?: any;
  error?: string;
}

/**
 * 插件消息类型
 */
export interface PluginMessage {
  type: 'submit' | 'recognize';
  data?: any;
}
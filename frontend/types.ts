import { RecognitionResult } from "./modules/recognition/types/recognition.types";

export * from "./modules/recognition/types/recognition.types";

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
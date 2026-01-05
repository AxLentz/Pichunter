// ============================================================
// 🧠 [业务层 | 识别模型转换器 (Business Layer - Transformer)]
// 职责：将后端 API 原始数据 (DTO) 转换为前端业务模型 (Model)
// ============================================================

import { RecognitionResult } from "../../types/recognition.types";

/**
 * 接口 DTO 定义 (与后端保持一致)
 */
export interface APIRecognitionResponse {
  success: boolean;
  data: {
    image_info: {
      width: number;
      height: number;
      format: string;
      size_bytes: number;
    };
    // list
    components: Array<{ 
      id: string;
      type: string;
      label: string;
      confidence: number;
      bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    metadata: {
      processing_time_ms: number;
      model_version: string;
      confidence_threshold: number;
    };
  };
  timestamp: string;
}

/**
 * 数据转换逻辑
 */
export function transformAPIResponse(
  apiResponse: APIRecognitionResponse
): RecognitionResult {
  // 解构赋值, 等价于 const data = apiResponse.data;
  const { data } = apiResponse;    

  return {
    // 字符串拼接, 等价于 Swift: "img_\(Date().timeIntervalSince1970)"
    imageId: `img_${Date.now()}`,   
    // 实例化一个带有“功能/方法”的类时用 new
    timestamp: new Date(apiResponse.timestamp).getTime(),  
    // 把后端给的"旧格式组件列表"，通过 map 逐个改造成"新格式组件列表"。
    components: data.components.map((comp) => ({
      id: comp.id,
      type: comp.type as any,
      confidence: comp.confidence,
      boundingBox: {
        x: comp.bbox.x,
        y: comp.bbox.y,
        width: comp.bbox.width,
        height: comp.bbox.height,
      },
      label: comp.label,
      description: `置信度: ${(comp.confidence * 100).toFixed(1)}%`,
      properties: {},   // 后端没给, 先空对象占坑
    })),
    totalComponents: data.components.length,
    processingTime: data.metadata.processing_time_ms,
    imageInfo: {
      width: data.image_info.width,
      height: data.image_info.height,
      format: data.image_info.format,
      size: data.image_info.size_bytes,
    },
  };
}

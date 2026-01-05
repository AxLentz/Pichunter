// ============================================================
// 🗼 [网络层 | 识别业务服务 (Network Layer - Service)]
// 职责：封装具体的 API 调用逻辑，处理二进制转换与数据解包
// ============================================================

import { API_CONFIG } from "../../../../core/api/config";
import { RecognitionResult } from "../../types/recognition.types";
import { stringToUint8Array, concatUint8Arrays } from "../../../../core/utils/convert";
import { APIRecognitionResponse, transformAPIResponse } from "../../logic/transformers/recognition.transformer";

/**
 * 【入口】远程调用：组件识别服务
 * 职责：编排识别任务的所有步骤
 */
export async function recognizeComponents(
  imageData: Uint8Array
): Promise<RecognitionResult> {
  try {
    // 1. 构建请求体：将图片打包成 multipart/form-data
    const { body, boundary } = buildMultipartFormData(imageData);

    // 2. 敲门送货：建立连接并等待服务器响应头（抓手 1）
    const response = await sendRecognitionRequest(body, boundary);

    // 3. 卸货解析：拉取完整数据并验证业务合法性（抓手 2）
    const apiResponse = await parseAndValidateResponse(response);

    // 4. 业务转换：将 DTO 翻译为前端舒服的 Model
    return transformAPIResponse(apiResponse);
    
  } catch (error) {
    // 5. 错误收口：统一处理网络或逻辑报错
    handleRecognitionError(error);
  }
}

// ------------------------------------------------------------
// 内部细节 (按调用顺序排列)
// ------------------------------------------------------------

/**
 * Step 1: 手工构建 multipart 表单
 * 因为 Figma 环境没有 FormData API，只能手动拼接字节
 */
function buildMultipartFormData(imageData: Uint8Array): { body: Uint8Array; boundary: string } {
  const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36)}`;
  
  const header = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="screenshot.png"`,
    `Content-Type: image/png`,
    ``,
    ``
  ].join('\r\n');
  
  const footer = `\r\n--${boundary}--\r\n`;
  
  const body = concatUint8Arrays(
    stringToUint8Array(header),
    imageData,
    stringToUint8Array(footer)
  );

  return { body, boundary };
}

/**
 * Step 2: 执行网络通信
 */
async function sendRecognitionRequest(body: Uint8Array, boundary: string): Promise<any> {
  // 抓手 1：建立连接，获取响应头（确认门开了）
  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.recognize}`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败: ${response.status}\n${errorText}`);
  }

  return response;
}

/**
 * Step 3: 数据解析与业务合法性检查
 */
async function parseAndValidateResponse(response: any): Promise<APIRecognitionResponse> {
  // 抓手 2：拉取全文并解析，获取最终数据（等待货卸完）
  const apiResponse: APIRecognitionResponse = await response.json();

  if (!apiResponse.success) {
    throw new Error("识别任务返回失败状态");
  }

  return apiResponse;
}

/**
 * Error Handling: 统一错误翻译器
 */
function handleRecognitionError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("连接后端失败，请检查服务是否运行在 http://localhost:8000");
    }
    throw error;
  }
  throw new Error("识别过程中发生了未知错误");
}

/**
 * 其他独立服务：健康检查
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

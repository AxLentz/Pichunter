import { RecognitionResult } from "../../types/recognition.types";
import { recognizeComponents } from "../../api/services/recognition.service";

/**
 * 业务指挥官：处理识别请求的全生命周期
 * 职责：调用服务、管理 UI 反馈、捕获任务异常
 */
export async function handleRecognitionRequest(imageData: Uint8Array) {
  try {
    // 1. 通知 UI：任务开始，进入 loading 状态
    figma.ui.postMessage({
      type: "recognitionProgress",
      data: { status: "processing", progress: 0 },
    });

    // 2. 调用核心服务：执行网络请求与转换
    const result: RecognitionResult = await recognizeComponents(imageData);

    // 3. 通知 UI：任务成功，发送识别结果
    figma.ui.postMessage({
      type: "recognitionResult",
      data: result,
    });

  } catch (error) {
    // 4. 故障处理：通知 UI 错误信息
    figma.ui.postMessage({
      type: "recognitionError",
      error: error instanceof Error ? error.message : "识别过程中发生未知错误",
    });
  }
}

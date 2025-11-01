import { ImageInfo, RecognitionResult } from "./types";
import { simulateRecognition } from "./mockData";
import { initializeSelectionExport } from "./plugin/selectionExport";

// ============ 初始化 ============
figma.showUI(__html__);
figma.ui.resize(320, 640);

// ============ 工具函数 ============
function sendExportedImage(imgData: Uint8Array) {
  figma.ui.postMessage({ type: "exportImage", data: imgData });
}

function clearSelectionPreview() {
  figma.ui.postMessage({ type: "clearImage" });
}

function notifyExportError(error: string) {
  figma.ui.postMessage({ type: "exportError", error });
}

// 执行初始化“选区导出监听器”函数, 并获取导出执行函数
const triggerSelectionExport = initializeSelectionExport(figma, {
  onImageExported: sendExportedImage,
  onClear: clearSelectionPreview,
  onError: notifyExportError,
});

// 启动插件时主动调用一次导出，确保界面始终反映当前选区（并清掉旧图片）
triggerSelectionExport();

// 监听来自UI的消息
figma.ui.onmessage = async (msg) => {
  if (msg?.type === "submit") {
    const selection = figma.currentPage.selection;
    if (selection.length >= 1) {
      console.log(`Selected node: ${selection[0].name}`);
    }
  } else if (msg?.type === "recognize") {
    // 处理组件识别请求
    await handleRecognitionRequest(msg.data);
  }
};

// 处理识别请求的函数
async function handleRecognitionRequest(imageData: Uint8Array) {
  try {
    // 发送开始识别的消息
    figma.ui.postMessage({
      type: "recognitionProgress",
      data: { status: "processing", progress: 0 },
    });

    // 创建图片信息对象
    const imageInfo: ImageInfo = {
      width: 800, // 这里应该从实际图片获取，暂时用固定值
      height: 600,
      format: "PNG",
      size: imageData.length,
    };

    // 模拟识别过程
    const result: RecognitionResult = await simulateRecognition(imageInfo);

    // 发送识别结果
    figma.ui.postMessage({
      type: "recognitionResult",
      data: result,
    });
  } catch (error) {
    // 发送错误消息
    figma.ui.postMessage({
      type: "recognitionError",
      error: error instanceof Error ? error.message : "识别过程中发生未知错误",
    });
  }
}

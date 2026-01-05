import { initializeSelectionExport, getCurrentSelectionImage } from "./modules/recognition/logic/selectionExport";
import { handleRecognitionRequest } from "./modules/recognition/logic/handlers/recognition.handler";

// ============ 1. 插件初始化 ============
figma.showUI(__html__);
figma.ui.resize(320, 640);

// ============ 2. 设置选区监听与导出 ============
const triggerSelectionExport = initializeSelectionExport(figma, {
  onImageExported: (imgData) => figma.ui.postMessage({ type: "exportImage", data: imgData }),
  onClear: () => figma.ui.postMessage({ type: "clearImage" }),
  onError: (error) => figma.ui.postMessage({ type: "exportError", error }),
});

// 启动时同步一次选区状态
triggerSelectionExport();

// ============ 3. 消息分发中心 ============
figma.ui.onmessage = async (msg) => {
  switch (msg?.type) {
    case "recognize":
      try {
        // [后端直连模式]：
        // 收到 UI 的“开始识别”信号后，在此处(主线程)直接获取最新的选区图片，
        // 而不是依赖 UI 层回传那个只有 3 字节的 mockData。
        const imageData = await getCurrentSelectionImage();
        
        // 将真实的图片传给业务处理器
        await handleRecognitionRequest(imageData);
      } catch (error: any) {
         figma.ui.postMessage({
           type: "recognitionError",
           error: error.message || "获取选区图片失败",
         });
      }
      break;

    case "submit":
      const selection = figma.currentPage.selection;
      if (selection.length >= 1) {
        console.log(`Selected node: ${selection[0].name}`);
      }
      break;
    
    default:
      console.warn("未知的消息类型:", msg?.type);
  }
};

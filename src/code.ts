// ============ 初始化 ============
figma.showUI(__html__);
figma.ui.resize(320, 640);

// ============ 全局变量 ============
// 导出定时器ID，用于延迟导出和防抖
let exportTimer: number | null = null;
// 当前正在进行的导出Promise，用于取消重复导出
let currentExportPromise: Promise<void> | null = null;

// ============ 工具函数 ============
// 将图片数据发送到UI界面显示
function send2UI(imgData: Uint8Array) {
  figma.ui.postMessage({ type: "exportImage", data: imgData });
}

// ============ 核心业务逻辑 ============
// 导出选中元素并发送到UI的主要函数
function exportSelectionAndSend(): void {
  // 获取当前页面的选中元素
  const selection = figma.currentPage.selection;

  // 清除之前的定时器，防止重复导出
  if (exportTimer) {
    clearTimeout(exportTimer);
    exportTimer = null;
  }

  // 检查是否只选中了一个元素，否则清空UI显示
  if (selection.length !== 1) {
    figma.ui.postMessage({ type: "clearImage" });
    return;
  }

  // 获取选中的节点并定义支持的节点类型
  const selectNode = selection[0];
  const supportedTypes = ["RECTANGLE", "FRAME", "GROUP", "COMPONENT", "INSTANCE", "ELLIPSE"];

  // 检查节点类型是否支持导出，不支持则清空UI显示
  if (supportedTypes.indexOf(selectNode.type) === -1) {
    figma.ui.postMessage({ type: "clearImage" });
    return;
  }

  // 设置200ms延迟导出，避免频繁操作时重复导出
  exportTimer = setTimeout(() => {
    // 如果有正在进行的导出任务，取消它
    if (currentExportPromise) {
      console.log("Previous export cancelled");
    }

    // 开始异步导出选中节点为PNG图片
    currentExportPromise = selectNode
      .exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 0.2 },
      })
      .then(
        // 导出成功：发送图片数据到UI并清空当前导出任务
        (resolved) => {
          if (currentExportPromise) {
            send2UI(resolved);
            currentExportPromise = null;
          }
        },
        // 导出失败：记录错误并发送错误信息到UI
        (rejected) => {
          console.error("Export failed:", rejected);
          currentExportPromise = null;
          figma.ui.postMessage({ type: "exportError", error: rejected.message });
        }
      );
  }, 200);
}

// ============ 事件监听器 ============
// 监听选择变化事件，当用户选择不同元素时触发导出
figma.on("selectionchange", () => {
  exportSelectionAndSend();
});

// 监听来自UI的消息
figma.ui.onmessage = (msg) => {
  if (msg?.type === "submit") {
    const selection = figma.currentPage.selection;
    if (selection.length >= 1) {
      console.log(`Selected node: ${selection[0].name}`);
    }
  }
};
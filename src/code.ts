figma.showUI(__html__);

figma.ui.resize(320, 640);

/**
 * 发送图像数据到插件UI界面
 * 作用：将导出的PNG图像数据通过消息传递给UI，让界面显示图像
 * @param imgData - 导出的图像数据（PNG格式的字节数组）
 */
function send2UI(imgData: Uint8Array) {
  console.log(`Sending image data of size: ${imgData.length} bytes`);

  figma.ui.postMessage({ type: "exportImage", data: imgData });
}

/**
 * 导出当前选择并发送到 UI
 * 条件：仅当且仅当选择了一个矩形节点时导出
 */
function exportSelectionAndSend(): void {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === "RECTANGLE") {
    const selectNode = selection[0];
    selectNode
      .exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 0.3 },
      })
      .then(
        (resolved) => {
          send2UI(resolved);
        },
        (rejected) => {
          console.error(rejected);
        }
      );
  } else {
    console.warn("Please select exactly one RECTANGLE to export.");
  }
}

/**
 * 监听Figma画布上的选择变化事件
 * 作用：当用户在画布上选中一个矩形时，自动导出该矩形的图像并发送给UI
 * 触发条件：选中且仅选中一个矩形节点
 */
figma.on("selectionchange", () => {
  exportSelectionAndSend();
});

/**
 * 接收来自 UI 的消息
 * 用于触发导出流程（例如点击 UI 的 Search 按钮）
 */
figma.ui.onmessage = (msg) => {
  if (msg?.type === "submit") {
    const selection = figma.currentPage.selection;
    if (selection.length >= 1) {
      const node = selection[0];
      console.log(`Selected node name: ${node.name}`);
    } else {
      console.warn("No node selected. Please select a node to log its name.");
    }
  }
};

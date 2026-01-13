// 选区导出回调接口
interface SelectionExportCallbacks {
  onImageExported(data: Uint8Array): void;
  onClear(): void;
  onError(error: string): void;
}

// 支持导出的节点类型集合
const SUPPORTED_TYPES = new Set<SceneNode["type"]>([
  "RECTANGLE",
  "FRAME",
  "GROUP",
  "COMPONENT",
  "INSTANCE",
  "ELLIPSE",
]);

// 导出防抖定时器
let exportTimer: number | null = null;
// 当前正在执行的导出 Promise（用于取消重复请求）
let currentExportPromise: Promise<Uint8Array> | null = null;

// 定义初始化“选区导出监听器”函数，返回导出执行函数
export function initializeSelectionExport(
  figmaApi: PluginAPI,
  callbacks: SelectionExportCallbacks
): () => void {
  // 获取导出执行函数
  const handler = () => exportSelectionAndSend(figmaApi, callbacks);
  // 将导出执行函数传给figma自行调用
  figmaApi.on("selectionchange", handler);
  // 返回导出执行函数, 以便在代码中手动触发
  return handler;
}

// 导出选中节点并通过回调发送图片数据
function exportSelectionAndSend(
  figmaApi: PluginAPI,
  callbacks: SelectionExportCallbacks
): void {
  const selection = figmaApi.currentPage.selection;

  if (exportTimer) {
    clearTimeout(exportTimer);
    exportTimer = null;
  }

  if (selection.length !== 1) {
    callbacks.onClear();
    return;
  }

  const selectedNode = selection[0];
  if (!isSupportedNode(selectedNode)) {
    callbacks.onClear();
    return;
  }

  exportTimer = setTimeout(() => {
    if (currentExportPromise) {
      console.log("Previous export cancelled");
    }

    const exportPromise = selectedNode.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 1.0 },
    });

    currentExportPromise = exportPromise;

    exportPromise.then(
      (imageBytes) => {
        if (currentExportPromise !== exportPromise) {
          return;
        }
        callbacks.onImageExported(imageBytes);
        currentExportPromise = null;
      },
      (error) => {
        console.error("Export failed:", error);
        if (currentExportPromise === exportPromise) {
          currentExportPromise = null;
        }
        const message = error instanceof Error ? error.message : "导出失败";
        callbacks.onError(message);
      }
    );
  }, 200);
}

// 检查节点类型是否支持导出
function isSupportedNode(node: SceneNode): boolean {
  return SUPPORTED_TYPES.has(node.type);
}

// 获取当前选中节点的图片数据 (一次性导出)
export async function getCurrentSelectionImage(): Promise<Uint8Array> {
  const selection = figma.currentPage.selection;
  
  if (selection.length !== 1) {
    throw new Error("请选择一个节点进行识别");
  }

  const selectedNode = selection[0];
  if (!isSupportedNode(selectedNode)) {
    throw new Error("当前选中节点类型不支持导出");
  }

  return await selectedNode.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 1.0 },
  });
}

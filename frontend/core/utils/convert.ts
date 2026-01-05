
/**
 * 将字符串转换为 Uint8Array (Figma 环境没有 TextEncoder API)
 */
export function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

/**
 * 合并多个 Uint8Array (用于构建 multipart/form-data)
 * 
 * 工作原理：类似于“拼积木”或“组装火车”
 * 1. 【量尺寸】: 计算所有片段的总长度，以便一次性申请足够的内存
 * 2. 【准备轨道】: 创建一个新的、足够长的 Uint8Array
 * 3. 【挂载车厢】: 遍历每个片段，按顺序将数据“平移”到新数组的对应位置
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  // 1. 【浓缩/归纳】获取总长度
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);

  // 2. 申请一块连续的物理内存空间（初始全为 0）
  const result = new Uint8Array(totalLength);

  // 3. 按顺序“搬运”字节
  let offset = 0; // 记录当前已经填到了哪个位置（光标）
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

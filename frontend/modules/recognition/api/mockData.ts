// ============ 模拟数据生成器 ============

import {
  ComponentType,
  DetectedComponent,
  RecognitionResult,
  ImageInfo,
  BoundingBox,
  ComponentProperties
} from '../types/recognition.types';

/**
 * 生成随机边界框
 */
function generateRandomBoundingBox(imageWidth: number, imageHeight: number): BoundingBox {
  const maxWidth = Math.min(200, imageWidth * 0.4);
  const maxHeight = Math.min(150, imageHeight * 0.3);

  const width = Math.random() * maxWidth + 50;
  const height = Math.random() * maxHeight + 30;

  const x = Math.random() * (imageWidth - width);
  const y = Math.random() * (imageHeight - height);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * 生成组件属性
 */
function generateComponentProperties(type: ComponentType): ComponentProperties {
  const properties: ComponentProperties = {};

  switch (type) {
    case ComponentType.BUTTON:
      properties.text = ['登录', '注册', '提交', '取消', '确认', '保存'][Math.floor(Math.random() * 6)];
      properties.variant = ['primary', 'secondary', 'outline'][Math.floor(Math.random() * 3)];
      properties.size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
      properties.isInteractive = true;
      break;

    case ComponentType.INPUT:
      properties.placeholder = ['请输入用户名', '请输入密码', '搜索...', '请输入邮箱'][Math.floor(Math.random() * 4)];
      properties.variant = ['default', 'outlined', 'filled'][Math.floor(Math.random() * 3)];
      properties.isInteractive = true;
      break;

    case ComponentType.CARD:
      properties.variant = ['default', 'elevated', 'outlined'][Math.floor(Math.random() * 3)];
      properties.hasIcon = Math.random() > 0.5;
      break;

    case ComponentType.TEXT:
      properties.text = ['标题文本', '正文内容', '描述信息', '链接文本'][Math.floor(Math.random() * 4)];
      properties.size = ['small', 'medium', 'large', 'xl'][Math.floor(Math.random() * 4)];
      break;

    case ComponentType.ICON:
      properties.size = ['16', '24', '32', '48'][Math.floor(Math.random() * 4)];
      properties.color = ['primary', 'secondary', 'gray'][Math.floor(Math.random() * 3)];
      break;
  }

  return properties;
}

/**
 * 生成单个模拟组件
 */
function generateMockComponent(id: string, imageWidth: number, imageHeight: number): DetectedComponent {
  // 手动列出所有组件类型，避免使用 Object.values()
  const componentTypes: ComponentType[] = [
    ComponentType.BUTTON,
    ComponentType.INPUT,
    ComponentType.CARD,
    ComponentType.MODAL,
    ComponentType.NAVIGATION,
    ComponentType.HEADER,
    ComponentType.FOOTER,
    ComponentType.SIDEBAR,
    ComponentType.LIST,
    ComponentType.TABLE,
    ComponentType.FORM,
    ComponentType.ICON,
    ComponentType.IMAGE,
    ComponentType.TEXT,
    ComponentType.CONTAINER
  ];
  const randomType = componentTypes[Math.floor(Math.random() * componentTypes.length)];

  return {
    id,
    type: randomType,
    confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0 之间的置信度
    boundingBox: generateRandomBoundingBox(imageWidth, imageHeight),
    label: getComponentLabel(randomType),
    description: getComponentDescription(randomType),
    properties: generateComponentProperties(randomType)
  };
}

/**
 * 获取组件标签
 */
function getComponentLabel(type: ComponentType): string {
  const labels: Record<ComponentType, string> = {
    [ComponentType.BUTTON]: '按钮',
    [ComponentType.INPUT]: '输入框',
    [ComponentType.CARD]: '卡片',
    [ComponentType.MODAL]: '弹窗',
    [ComponentType.NAVIGATION]: '导航',
    [ComponentType.HEADER]: '页头',
    [ComponentType.FOOTER]: '页脚',
    [ComponentType.SIDEBAR]: '侧边栏',
    [ComponentType.LIST]: '列表',
    [ComponentType.TABLE]: '表格',
    [ComponentType.FORM]: '表单',
    [ComponentType.ICON]: '图标',
    [ComponentType.IMAGE]: '图片',
    [ComponentType.TEXT]: '文本',
    [ComponentType.CONTAINER]: '容器',
    [ComponentType.UNKNOWN]: '未知组件'
  };

  return labels[type];
}

/**
 * 获取组件描述
 */
function getComponentDescription(type: ComponentType): string {
  const descriptions: Record<ComponentType, string> = {
    [ComponentType.BUTTON]: '可点击的交互按钮',
    [ComponentType.INPUT]: '用户输入字段',
    [ComponentType.CARD]: '信息展示卡片',
    [ComponentType.MODAL]: '模态对话框',
    [ComponentType.NAVIGATION]: '页面导航组件',
    [ComponentType.HEADER]: '页面头部区域',
    [ComponentType.FOOTER]: '页面底部区域',
    [ComponentType.SIDEBAR]: '侧边导航栏',
    [ComponentType.LIST]: '数据列表组件',
    [ComponentType.TABLE]: '数据表格组件',
    [ComponentType.FORM]: '表单容器',
    [ComponentType.ICON]: '图标元素',
    [ComponentType.IMAGE]: '图片元素',
    [ComponentType.TEXT]: '文本内容',
    [ComponentType.CONTAINER]: '布局容器',
    [ComponentType.UNKNOWN]: '无法识别的组件'
  };

  return descriptions[type];
}

/**
 * 生成模拟识别结果
 */
export function generateMockRecognitionResult(imageInfo: ImageInfo): RecognitionResult {
  const componentCount = Math.floor(Math.random() * 8) + 3; // 3-10 个组件
  const components: DetectedComponent[] = [];

  for (let i = 0; i < componentCount; i++) {
    components.push(generateMockComponent(`comp_${i + 1}`, imageInfo.width, imageInfo.height));
  }

  // 按置信度排序
  components.sort((a, b) => b.confidence - a.confidence);

  return {
    imageId: `img_${Date.now()}`,
    timestamp: Date.now(),
    components,
    totalComponents: componentCount,
    processingTime: Math.random() * 2000 + 1000, // 1-3秒的模拟处理时间
    imageInfo
  };
}

/**
 * 模拟异步识别过程
 */
export function simulateRecognition(imageInfo: ImageInfo): Promise<RecognitionResult> {
  return new Promise((resolve) => {
    const processingTime = Math.random() * 2000 + 1000; // 1-3秒

    setTimeout(() => {
      const result = generateMockRecognitionResult(imageInfo);
      resolve(result);
    }, processingTime);
  });
}
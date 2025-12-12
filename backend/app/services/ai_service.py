# ============================================
# Imports
# ============================================
# 标准库
import os  # 操作系统接口，用于读取环境变量
import json  # JSON 处理，用于解析 AI 返回的数据
import time  # 时间处理，用于生成唯一 ID

# 第三方库
import google.generativeai as genai  # Google Gemini AI SDK
from PIL import Image  # Pillow 图片处理库
from typing import List, Optional  # 类型提示

# 本地模块
from app.schemas import ComponentResult, BoundingBox


# ============================================
# Gemini AI 服务类
# ============================================
class GeminiService:
    """
    Gemini AI 服务类 - 负责调用 Google Gemini API 进行 UI 组件识别

    属性:
        api_key: Google Gemini API 密钥（从环境变量读取）
        model: Gemini 模型实例（用于生成内容）

    核心功能：
    1. 初始化 Gemini 模型（从环境变量读取 API Key）
    2. 发送图片到 Gemini API 进行识别
    3. 解析 AI 返回的 JSON 数据
    4. 将归一化坐标转换为像素坐标
    5. 返回符合项目规范的 ComponentResult 列表
    """

    # 属性类型声明（类似 Swift 的属性声明）
    api_key: Optional[str]
    model: Optional[genai.GenerativeModel]

    def __init__(self) -> None:
        """
        初始化 Gemini 服务

        流程：
        1. 从环境变量 GEMINI_API_KEY 读取 API Key
        2. 配置 Gemini SDK
        3. 创建 Gemini 2.5 Flash 模型实例

        注意：如果环境变量未设置，model 会是 None，调用时会抛出异常
        """
        # 从环境变量获取 API Key
        self.api_key = os.environ.get("GEMINI_API_KEY")

        if self.api_key:
            # 配置 Gemini SDK（全局设置）
            genai.configure(api_key=self.api_key)

            # 使用 Gemini 2.5 Flash 模型（最新版本，速度快，免费额度高）
            # 其他可选模型：gemini-2.5-pro（更强大但稍慢）
            self.model = genai.GenerativeModel("gemini-2.5-flash")
        else:
            # 如果没有 API Key，打印警告并设置 model 为 None
            print("WARNING: GEMINI_API_KEY 环境变量未设置")
            self.model = None

    async def recognize_components(self, image: Image.Image) -> List[ComponentResult]:
        """
        识别图片中的 UI 组件

        Args:
            image: PIL Image 对象（已经过 Pillow 打开和验证）

        Returns:
            ComponentResult 列表，每个元素包含：
            - id: 唯一标识符（格式：gemini-索引-时间戳）
            - type: 组件类型（button, input, image, text, icon, card, unknown）
            - label: 组件标签或描述
            - confidence: 置信度（0.0-1.0）
            - bbox: 边界框（像素坐标）

        Raises:
            ValueError: 如果 API Key 未配置
            Exception: 如果 Gemini API 调用失败

        工作流程：
        1. 检查 API Key 是否配置
        2. 获取图片尺寸（用于坐标转换）
        3. 构建 Prompt（告诉 AI 要做什么）
        4. 调用 Gemini API
        5. 解析 JSON 响应
        6. 转换坐标（归一化 → 像素）
        7. 构建 ComponentResult 对象列表
        """
        # Step 1: 检查 API Key 是否配置
        if not self.model:
            raise ValueError("GEMINI_API_KEY 未配置，无法调用 AI 服务")

        # Step 2: 获取图片尺寸，用于后续坐标转换
        # image.size 返回 (width, height) 元组
        img_width, img_height = image.size

        # Step 3: 构建 Prompt - 告诉 AI 我们需要什么格式的数据
        # 关键点：
        # 1. 明确要求返回 JSON 格式
        # 2. 定义具体的字段结构
        # 3. 使用归一化坐标（0-1000），便于不同尺寸图片统一处理
        prompt = """
        分析这张 UI 截图，识别其中的 UI 组件。
        返回 JSON 数组，每个对象包含以下字段：
        - "type": 组件类型，可选值：["button", "input", "image", "text", "icon", "card", "unknown"]
        - "label": 组件的文本内容或简短描述
        - "confidence": 置信度，0.0-1.0 之间的浮点数
        - "ymin": 上边界坐标（0-1000）
        - "xmin": 左边界坐标（0-1000）
        - "ymax": 下边界坐标（0-1000）
        - "xmax": 右边界坐标（0-1000）

        坐标系统：归一化到 1000x1000 网格。
        只返回 JSON 数组，不要其他内容。
        """

        try:
            # Step 4: 调用 Gemini API
            # generate_content 接受两个参数：[prompt, image]
            # generation_config 强制返回 JSON 格式
            response = self.model.generate_content(
                [prompt, image],
                generation_config={"response_mime_type": "application/json"},
            )

            # Step 5: 解析 JSON 响应
            try:
                # response.text 是字符串，需要用 json.loads 转换为 Python 对象
                raw_results = json.loads(response.text)
            except json.JSONDecodeError:
                # 如果 AI 返回的不是有效 JSON，打印原始内容方便调试
                print(f"JSON 解析失败。原始响应: {response.text}")
                return []  # 返回空列表，避免程序崩溃

            # Step 6: 转换为 ComponentResult 对象列表
            components = []
            for idx, item in enumerate(raw_results):
                # 提取归一化坐标（0-1000 范围）
                # 使用 get() 方法提供默认值 0，防止字段缺失导致错误
                ymin = item.get("ymin", 0)
                xmin = item.get("xmin", 0)
                ymax = item.get("ymax", 0)
                xmax = item.get("xmax", 0)

                # 坐标转换：归一化坐标 → 像素坐标
                # 公式：像素值 = (归一化值 / 1000) * 图片实际尺寸
                # 例如：xmin=500, img_width=1920 → x_px = (500/1000)*1920 = 960
                x_px = int((xmin / 1000) * img_width)
                y_px = int((ymin / 1000) * img_height)
                w_px = int((xmax - xmin) / 1000 * img_width)
                h_px = int((ymax - ymin) / 1000 * img_height)

                # 数据清洗：确保宽高至少为 1 像素（避免无效的边界框）
                w_px = max(1, w_px)
                h_px = max(1, h_px)

                # 构建 ComponentResult 对象
                component = ComponentResult(
                    # 生成唯一 ID：gemini-索引-时间戳
                    # 例如：gemini-0-1733567890
                    id=f"gemini-{idx}-{int(time.time())}",
                    # 组件类型（button, input 等）
                    type=item.get("type", "unknown"),
                    # 组件标签（如按钮上的文字）
                    label=item.get("label", "未知元素"),
                    # 置信度（AI 对识别结果的确信程度）
                    confidence=float(item.get("confidence", 0.0)),
                    # 边界框（像素坐标）
                    bbox=BoundingBox(
                        x=x_px,  # 左上角 X 坐标
                        y=y_px,  # 左上角 Y 坐标
                        width=w_px,  # 宽度
                        height=h_px,  # 高度
                    ),
                )
                components.append(component)

            # Step 7: 返回识别结果
            return components

        except Exception as e:
            # 捕获所有异常（网络错误、API 限流、模型错误等）
            # 打印错误信息方便调试
            print(f"Gemini API 调用失败: {str(e)}")
            # 重新抛出异常，让上层代码处理（main.py 会返回 500 错误）
            raise e

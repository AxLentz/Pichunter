import base64
import io
import json
import logging
import os
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Type

import google.generativeai as genai
from app.schemas import BoundingBox, ComponentResult
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image

# 加载环境变量
load_dotenv()

# 初始化日志记录器
logger = logging.getLogger(__name__)

# ============================================
# 统一识别指令 (Prompt)
# ============================================
UI_RECOGNITION_PROMPT = """
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


# ============================================
# 抽象基类 (接口定义)
# ============================================
class AIProvider(ABC):
    """AI 服务提供商抽象基类，定义统一的识别接口"""

    @abstractmethod
    async def recognize_components(self, image: Image.Image) -> List[ComponentResult]:
        """识别图片中的 UI 组件接口"""
        pass

    def _convert_to_pixel_coords(
        self,
        normalized_results: List[dict],
        width: int,
        height: int,
        provider_name: str,
    ) -> List[ComponentResult]:
        """统一的坐标转换逻辑：归一化(0-1000) -> 像素坐标"""
        components: List[ComponentResult] = []
        for i, item in enumerate(normalized_results):
            # 获取归一化坐标并安全 fallback 为 0
            ymin = item.get("ymin", 0)
            xmin = item.get("xmin", 0)
            ymax = item.get("ymax", item.get("ymin", 0))
            xmax = item.get("xmax", item.get("xmin", 0))

            # 缩放转换
            x_px = int((xmin / 1000) * width)
            y_px = int((ymin / 1000) * height)
            w_px = max(1, int((xmax - xmin) / 1000 * width))
            h_px = max(1, int((ymax - ymin) / 1000 * height))

            components.append(
                ComponentResult(
                    id=f"{provider_name}-{i}-{int(time.time())}",
                    type=item.get("type", "unknown"),
                    label=item.get("label", ""),
                    confidence=float(item.get("confidence", 1.0)),
                    bbox=BoundingBox(x=x_px, y=y_px, width=w_px, height=h_px),
                )
            )
        return components


# ============================================
# Google Gemini 实现
# ============================================
class GeminiProvider(AIProvider):
    """Google Gemini AI 提供商实现"""

    def __init__(self) -> None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY 未设置")
            self.model = None
            return

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-flash-latest")
        logger.info("GeminiProvider 初始化成功")

    async def recognize_components(self, image: Image.Image) -> List[ComponentResult]:
        if not self.model:
            raise ValueError("Gemini API Key 未配置")

        start_time = time.perf_counter()
        logger.info(f"Gemini 开始识别，分辨率: {image.width}x{image.height}")

        response = self.model.generate_content(
            [UI_RECOGNITION_PROMPT, image],
            generation_config={"response_mime_type": "application/json"},
        )

        try:
            results = json.loads(response.text)
        except json.JSONDecodeError:
            logger.error(f"Gemini 返回了非格式化 JSON: {response.text}")
            return []

        duration = (time.perf_counter() - start_time) * 1000
        components = self._convert_to_pixel_coords(
            results, image.width, image.height, "gemini"
        )

        logger.info(
            f"Gemini 识别成功 - 耗时: {duration:.2f}ms, 组件数: {len(components)}"
        )
        return components


# ============================================
# OpenAI 实现
# ============================================
class OpenAIProvider(AIProvider):
    """OpenAI GPT-4o-mini / GPT-4o 提供商实现"""

    def __init__(self) -> None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY 未设置")
            self.client = None
            return

        self.client = OpenAI(api_key=api_key)
        self.model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        logger.info(f"OpenAIProvider ({self.model_name}) 初始化成功")

    async def recognize_components(self, image: Image.Image) -> List[ComponentResult]:
        if not self.client:
            raise ValueError("OpenAI API Key 未配置")

        # 转换 PIL Image 为 Base64 字节流
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        start_time = time.perf_counter()
        logger.info(f"OpenAI 开始识别，模型: {self.model_name}")

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": UI_RECOGNITION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{img_base64}"},
                        },
                    ],
                }
            ],
            response_format={"type": "json_object"},
        )

        # OpenAI 返回的 JSON 在 content 字段中
        content = response.choices[0].message.content
        if not content:
            return []

        try:
            # OpenAI 有时会在 JSON 外套一层字段名，视 prompt 而定
            data = json.loads(content)
            # 如果 AI 返回的是 {"components": [...]} 格式，则提取列表
            results = data.get("components", data) if isinstance(data, dict) else data
            # 如果还是 list 格式则直接使用
            if not isinstance(results, list):
                results = results if isinstance(results, list) else []
        except Exception as e:
            logger.error(f"OpenAI 解析失败: {str(e)}, 原始内容: {content}")
            return []

        duration = (time.perf_counter() - start_time) * 1000
        components = self._convert_to_pixel_coords(
            results, image.width, image.height, "openai"
        )

        logger.info(
            f"OpenAI 识别成功 - 耗时: {duration:.2f}ms, 组件数: {len(components)}"
        )
        return components


# ============================================
# 策略工厂 (即插即用中心)
# ============================================
class AIServiceFactory:
    """提供商工厂，支持根据环境变量动态加载服务"""

    _providers: Dict[str, Type[AIProvider]] = {
        "gemini": GeminiProvider,
        "openai": OpenAIProvider,
    }

    @classmethod
    def create(cls) -> AIProvider:
        provider_name = os.environ.get("AI_PROVIDER", "gemini").lower()
        provider_class = cls._providers.get(provider_name, GeminiProvider)

        logger.info(f"已动态切换至 AI 提供商: {provider_class.__name__}")
        return provider_class()


# 为了保持与 main.py 现状的兼容性，默认导出一个 factory 实例
# 这样原有代码 ai_service.recognize_components 依然有效
ai_service = AIServiceFactory.create()

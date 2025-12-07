import os
import json
import time
import google.generativeai as genai
from typing import List
from PIL import Image
from app.schemas import ComponentResult, BoundingBox


class GeminiService:
    """
    Gemini AI 服务类
    负责调用 Google Gemini API 进行 UI 组件识别
    """
    
    def __init__(self):
        # 从环境变量获取 API Key
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # 使用 Gemini 2.5 Flash 模型（最新版本，速度快，免费额度高）
            self.model = genai.GenerativeModel("gemini-2.5-flash")
        else:
            print("WARNING: GEMINI_API_KEY 环境变量未设置")
            self.model = None

    async def recognize_components(self, image: Image.Image) -> List[ComponentResult]:
        """
        识别图片中的 UI 组件
        
        Args:
            image: PIL Image 对象
            
        Returns:
            ComponentResult 列表
            
        Raises:
            ValueError: 如果 API Key 未配置
        """
        if not self.model:
            raise ValueError("GEMINI_API_KEY 未配置，无法调用 AI 服务")

        # 获取图片尺寸，用于坐标转换
        img_width, img_height = image.size

        # 构建 Prompt
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
            # 调用 Gemini API
            response = self.model.generate_content(
                [prompt, image],
                generation_config={"response_mime_type": "application/json"}
            )
            
            # 解析 JSON 响应
            try:
                raw_results = json.loads(response.text)
            except json.JSONDecodeError:
                print(f"JSON 解析失败。原始响应: {response.text}")
                return []
            
            # 转换为 ComponentResult 对象
            components = []
            for idx, item in enumerate(raw_results):
                # 提取归一化坐标
                ymin = item.get("ymin", 0)
                xmin = item.get("xmin", 0)
                ymax = item.get("ymax", 0)
                xmax = item.get("xmax", 0)

                # 转换为像素坐标
                x_px = int((xmin / 1000) * img_width)
                y_px = int((ymin / 1000) * img_height)
                w_px = int((xmax - xmin) / 1000 * img_width)
                h_px = int((ymax - ymin) / 1000 * img_height)

                # 确保宽高至少为 1
                w_px = max(1, w_px)
                h_px = max(1, h_px)

                # 构建组件对象
                component = ComponentResult(
                    id=f"gemini-{idx}-{int(time.time())}",
                    type=item.get("type", "unknown"),
                    label=item.get("label", "未知元素"),
                    confidence=float(item.get("confidence", 0.0)),
                    bbox=BoundingBox(
                        x=x_px,
                        y=y_px,
                        width=w_px,
                        height=h_px
                    )
                )
                components.append(component)
            
            return components

        except Exception as e:
            print(f"Gemini API 调用失败: {str(e)}")
            raise e

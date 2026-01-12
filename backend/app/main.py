# ============================================
# Imports
# ============================================
# 标准库
from datetime import datetime
from io import BytesIO
from typing import List

# 第三方库
from dotenv import load_dotenv  # 加载环境变量
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError  # 图片处理

# 本地模块
from .schemas import (
    ErrorDetail,
    HealthResponse,
    ImageInfo,
    RecognitionMetadata,
    RecognitionResponse,
    RecognitionResult,
)
from .services.ai_service import GeminiService

# ============================================
# 配置加载
# ============================================
# 加载 .env 环境变量文件 - 优先级：系统环境变量 > .env 文件
load_dotenv()

# ============================================
# 配置常量
# ============================================
# 服务信息
SERVICE_NAME = "Pichunter Backend"
SERVICE_VERSION = "0.1.0"

# 上传相关的硬性约束：10MB 上限，以及目前支持 PNG / JPEG / WebP
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB 上限，后续可抽取到配置
SUPPORTED_CONTENT_TYPES: List[str] = ["image/png", "image/jpeg", "image/webp"]


# ============================================
# 应用初始化
# ============================================
# 创建FastAPI应用实例 - 类似Swift创建UIApplication，是后端服务的核心
app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION)

# 初始化 AI 服务
ai_service = GeminiService()


# 配置跨域中间件 - 类似iOS的App Transport Security设置，允许前端访问后端API
# 现在设置为允许所有来源，后续需要根据前端实际URL进行限制
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten origins when frontend URL is known
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# 路由端点
# ============================================


# 定义健康检查接口 - 类似iOS App的ping接口，用于监控服务状态
# 前端可以通过这个接口判断后端是否正常运行
@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Simple health endpoint for uptime monitoring."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow(),
        service=app.title,  # 使用 app.title 保持一致
    )


# 定义组件识别接口 - 接收图片上传，返回识别出的 UI 组件列表
# 当前使用简单规则引擎，后续将接入 AI 模型（OpenAI GPT-4 Vision）
@app.post("/api/recognize", response_model=RecognitionResponse)
async def recognize_component(file: UploadFile = File(...)) -> RecognitionResponse:
    """Placeholder component recognition endpoint.

    当前仅做输入校验与模拟返回结构，后续将接入真实 AI 模型。
    """

    # Step 1: 校验浏览器声明的 Content-Type，避免明显错误的文件被处理
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=ErrorDetail(
                code="unsupported_media_type",
                message="仅支持 PNG、JPEG 或 WebP 图像",
            ).model_dump(),
        )

    # Step 2: 读取字节流并检查空文件或体积过大
    payload = await file.read()
    if len(payload) == 0:
        raise HTTPException(
            status_code=400,
            detail=ErrorDetail(
                code="empty_file",
                message="上传文件为空",
            ).model_dump(),
        )

    if len(payload) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=ErrorDetail(
                code="file_too_large",
                message="文件超过 10MB 限制",
            ).model_dump(),
        )

    try:
        # Step 3: 使用 Pillow 打开图像，获取宽高及格式；无法解析时抛出异常
        image = Image.open(BytesIO(payload))
        width, height = image.size
        image_format = image.format or "UNKNOWN"
    except UnidentifiedImageError as exc:
        raise HTTPException(
            status_code=400,
            detail=ErrorDetail(
                code="invalid_image",
                message="无法识别的图像格式",
            ).model_dump(),
        ) from exc

    # Step 4: 调用 AI 服务进行识别
    start_time = datetime.utcnow()

    try:
        # 调用 Gemini AI 服务
        components = await ai_service.recognize_components(image)

        # 计算处理时间
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

        # 组织返回结果
        recognition = RecognitionResult(
            image_info=ImageInfo(
                width=width,
                height=height,
                format=image_format,
                size_bytes=len(payload),
            ),
            components=components,
            metadata=RecognitionMetadata(
                processing_time_ms=processing_time,
                model_version="gemini-2.5-flash",
                confidence_threshold=0.0,
            ),
        )

    except Exception as e:
        # AI 服务调用失败（如未配置 API Key）
        print(f"AI 识别失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=ErrorDetail(
                code="ai_service_error",
                message=f"AI 服务错误: {str(e)}",
            ).model_dump(),
        )

    # Step 5: 返回统一的响应格式，便于前端和监控消费
    return RecognitionResponse(
        success=True,
        data=recognition,
        timestamp=datetime.utcnow(),
    )

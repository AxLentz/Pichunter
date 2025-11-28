# 导入必要的模块
from datetime import datetime
from typing import List, Optional, Literal

# 导入Pydantic库，用于数据验证和设置管理
from pydantic import BaseModel, Field


# ============================================
# 通用基础类（不依赖其他业务类）
# ============================================

# 错误详情类 - 用于返回错误信息
#
# Attributes:
#     code: 错误代码，如"INVALID_INPUT"
#     message: 人类可读的错误描述
class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")


# 健康检查响应类 - 用于API健康检查端点
class HealthResponse(BaseModel):
    status: Literal["ok"]  # 服务状态，正常时固定为"ok"
    timestamp: datetime  # 检查时间戳
    service: str  # 服务名称


# ============================================
# 领域模型 - 原子级别（不依赖其他业务类）
# ============================================

# 边界框类 - 用于描述UI组件在图片中的位置和大小
class BoundingBox(BaseModel):
    x: int  # 组件左上角在图片中的X坐标
    y: int  # 组件左上角在图片中的Y坐标
    width: int  # 组件的宽度（像素）
    height: int  # 组件的高度（像素）


# 图片信息类 - 描述输入图片的基本信息
class ImageInfo(BaseModel):
    width: int  # 图片宽度（像素）
    height: int  # 图片高度（像素）
    format: str  # 图片格式，如"JPEG", "PNG"等
    size_bytes: int  # 图片文件大小（字节）


# 组件识别结果类 - 描述识别出的单个UI组件的信息
class ComponentResult(BaseModel):
    id: str  # 组件的唯一标识符
    type: str  # 组件类型，如"button", "text_field", "image"等
    label: str  # 组件的标签或文本内容
    confidence: float = Field(ge=0.0, le=1.0)  # 置信度，0.0-1.0之间，表示识别的准确程度
    bbox: BoundingBox  # 边界框，描述组件在图片中的位置和大小


# ============================================
# 聚合模型 - 组合级别（依赖上面的原子类）
# ============================================

# 识别元数据类 - 描述识别过程的附加信息
class RecognitionMetadata(BaseModel):
    processing_time_ms: int  # 处理时间（毫秒）
    model_version: str  # 使用的AI模型版本
    confidence_threshold: float = Field(ge=0.0, le=1.0)  # 置信度阈值，只有置信度高于此值的组件才会被返回


# 识别结果类 - 包含完整的UI组件识别结果
class RecognitionResult(BaseModel):
    image_info: ImageInfo  # 输入图片的信息
    components: List[ComponentResult]  # 识别出的UI组件列表
    metadata: RecognitionMetadata  # 识别过程的元数据信息


# ============================================
# API 响应包装（最高层，依赖所有业务类）
# ============================================

# API响应类 - 用于返回UI组件识别的API响应
class RecognitionResponse(BaseModel):
    success: bool  # 请求是否成功
    data: Optional[RecognitionResult] = None  # 识别结果数据，成功时存在
    error: Optional[ErrorDetail] = None  # 错误信息，失败时存在
    timestamp: datetime  # 响应生成的时间戳

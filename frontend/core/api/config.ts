
export const API_CONFIG = {
  baseUrl: "http://localhost:8000",          // 拨号基础地址
  endpoints: {
    recognize: "/api/recognize",             // 识别接口路径
    health: "/api/health",                   // 健康检查路径
  },
  timeout: 30000,                            // 30秒超时
};

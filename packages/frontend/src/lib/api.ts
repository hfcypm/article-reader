/**
 * API 请求封装模块
 * 基于 fetch 实现 RESTful 请求，自动携带 JWT token，统一处理响应格式与错误
 */

const API_BASE = "/api";

/** 统一的 API 响应结构 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 从 localStorage 读取 JWT token */
function getToken(): string | null {
  return localStorage.getItem("token");
}

/**
 * 通用 HTTP 请求函数
 * 自动附加 Authorization 头，根据 body 类型自动设置 Content-Type
 * @param endpoint - API 端点路径（不含 /api 前缀）
 * @param options - fetch 请求配置项
 * @returns 统一的 ApiResponse 响应
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // 自动附带 JWT token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // FormData 上传时不设置 Content-Type，由浏览器自动处理 boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  // HTTP 状态码异常时返回统一的错误格式
  if (!res.ok && json.error) {
    return { success: false, error: json.error };
  }

  return json;
}

/**
 * API 请求方法集合
 * 提供 get / post / put / delete 四个常用 REST 方法
 */
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

/** 将 JWT token 持久化到 localStorage */
export function setToken(token: string) {
  localStorage.setItem("token", token);
}

/** 清除已存储的 JWT token */
export function removeToken() {
  localStorage.removeItem("token");
}

/** 判断是否存在有效的 token */
export function hasToken(): boolean {
  return !!getToken();
}

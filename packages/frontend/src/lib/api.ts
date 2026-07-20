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
 * @param timeoutMs - 可选超时时间(ms)，超时后自动 abort
 * @returns 统一的 ApiResponse 响应
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const controller = timeoutMs ? new AbortController() : undefined;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller?.signal,
    });

    const json = await res.json();

    if (!res.ok && json.error) {
      return { success: false, error: json.error };
    }

    return json;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * API 请求方法集合
 * 提供 get / post / put / delete 四个常用 REST 方法
 */
export const api = {
  get: <T>(endpoint: string, timeoutMs?: number) => request<T>(endpoint, {}, timeoutMs),
  post: <T>(endpoint: string, body?: unknown, timeoutMs?: number) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }, timeoutMs),
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

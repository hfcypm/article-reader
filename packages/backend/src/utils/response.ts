/**
 * 统一 API 响应工具模块
 *
 * 定义标准的 API 返回格式，所有接口响应均遵循此结构，
 * 确保前端能统一处理成功和错误两种情况。
 */

/** API 响应的标准数据结构 */
export type ApiResponse<T = unknown> = {
  /** 请求是否成功 */
  success: boolean;
  /** 成功时返回的业务数据 */
  data?: T;
  /** 失败时的错误描述 */
  error?: string;
  /** 成功或失败时的提示消息 */
  message?: string;
};

/**
 * 构造成功响应
 * @param data 业务数据
 * @param message 可选的提示消息
 */
export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

/**
 * 构造失败响应
 * @param message 错误描述信息
 */
export function error(message: string): ApiResponse {
  return { success: false, error: message };
}

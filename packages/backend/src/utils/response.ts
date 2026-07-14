export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function error(message: string): ApiResponse {
  return { success: false, error: message };
}

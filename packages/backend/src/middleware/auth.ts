/**
 * 认证中间件模块
 *
 * 提供可复用的登录鉴权中间件，从请求头中提取 Bearer Token 并验证其有效性。
 * 验证通过后将 userId 注入请求上下文，供后续路由处理器使用。
 */
import { Elysia } from 'elysia';
import { jwtPlugin } from '../utils/jwt';

/**
 * 认证守卫中间件
 *
 * 从 Authorization 请求头中解析 JWT 令牌，验证通过后返回 userId。
 * 未携带令牌或令牌无效时返回 401 状态码。
 */
export const authGuard = (app: Elysia) =>
  app.derive(async ({ jwt, headers, set }) => {
    // 从请求头提取 Authorization 字段
    const authHeader = headers.authorization;
    // 校验是否存在且为 Bearer 格式
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('未登录或 Token 已过期');
    }

    // 截取 "Bearer " 之后的令牌字符串
    const token = authHeader.substring(7);
    try {
      // 验证令牌签名和有效期
      const payload = await jwt.verify(token);
      if (!payload || !payload.userId) {
        set.status = 401;
        throw new Error('Token 无效');
      }
      // 将 userId 注入上下文，供下游路由使用
      return { userId: payload.userId as string };
    } catch {
      set.status = 401;
      throw new Error('Token 验证失败');
    }
  });

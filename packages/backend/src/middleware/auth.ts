import { Elysia } from 'elysia';
import { jwtPlugin } from '../utils/jwt';

export const authGuard = (app: Elysia) =>
  app.derive(async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      throw new Error('未登录或 Token 已过期');
    }

    const token = authHeader.substring(7);
    try {
      const payload = await jwt.verify(token);
      if (!payload || !payload.userId) {
        set.status = 401;
        throw new Error('Token 无效');
      }
      return { userId: payload.userId as string };
    } catch {
      set.status = 401;
      throw new Error('Token 验证失败');
    }
  });

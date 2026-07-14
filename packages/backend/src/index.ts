import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwtPlugin } from './utils/jwt';
import { authRoutes } from './routes/auth';
import { documentRoutes } from './routes/documents';
import { bookshelfRoutes } from './routes/bookshelf';
import { userRoutes } from './routes/user';

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .use(jwtPlugin)
  .use(authRoutes)
  .guard({
    beforeHandle: async ({ jwt, headers, set }) => {
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
      } catch {
        set.status = 401;
        throw new Error('Token 验证失败');
      }
    },
  }, (guarded) =>
    guarded
      .resolve(async ({ jwt, headers }) => {
        const token = headers.authorization!.substring(7);
        const payload = await jwt.verify(token);
        return { userId: (payload as { userId: string }).userId };
      })
      .use(documentRoutes)
      .use(bookshelfRoutes)
      .use(userRoutes)
  )
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  .listen(process.env.PORT || 3001);

console.log(`Article Reader API running at http://localhost:${app.server?.port}`);

export type App = typeof app;

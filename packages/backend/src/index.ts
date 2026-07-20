/**
 * 应用入口文件
 *
 * 创建 Elysia HTTP 服务器，注册全局中间件（CORS、JWT）和路由模块。
 * 除 auth 路由外，其他业务路由均受认证守卫保护。
 * 默认监听 3001 端口（可通过 PORT 环境变量配置）。
 */
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwtPlugin } from './utils/jwt';
import { authRoutes } from './routes/auth';
import { documentRoutes } from './routes/documents';
import { bookshelfRoutes } from './routes/bookshelf';
import { userRoutes } from './routes/user';
import { startGitPullCron } from './cron/gitPullCron';

const app = new Elysia({
  serve: {
    maxRequestBodySize: 200 * 1024 * 1024,
  },
})
  // 注册 CORS 跨域中间件，允许前端项目跨域访问
  .use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  // 注册 JWT 插件，启用令牌签发和验证能力
  .use(jwtPlugin)
  // 注册不需要认证的路由（登录/注册）
  .use(authRoutes)
  // 以下路由需要登录认证，通过 beforeHandle 守卫保护
  .guard({
    beforeHandle: async ({ jwt, headers, set }) => {
      // 校验 Authorization 请求头
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        throw new Error('未登录或 Token 已过期');
      }
      // 提取并验证 JWT 令牌
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
      // 从已验证的令牌中提取 userId 注入上下文
      .resolve(async ({ jwt, headers }) => {
        const token = headers.authorization!.substring(7);
        const payload = await jwt.verify(token);
        return { userId: (payload as { userId: string }).userId };
      })
      // 注册需要认证的业务路由
      .use(documentRoutes)
      .use(bookshelfRoutes)
      .use(userRoutes)
  )
  // 健康检查端点，用于服务可用性探测
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  .listen(process.env.PORT || 3001);

console.log(`Article Reader API running at http://localhost:${app.server?.port}`);

startGitPullCron();

export type App = typeof app;

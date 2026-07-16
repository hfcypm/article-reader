/**
 * 认证路由模块
 *
 * 提供用户注册、登录、验证码发送和密码重置的 HTTP 接口。
 * 所有端点挂载在 /api/auth 前缀下，无需登录认证。
 */
import { Elysia, t } from 'elysia';
import { authService } from '../services/auth.service';
import { success, error } from '../utils/response';

export const authRoutes = new Elysia({ prefix: '/api/auth' })

  /**
   * 用户注册
   * POST /api/auth/register
   * 使用手机号、密码和昵称创建新账户，成功后返回用户信息和 JWT 令牌
   */
  .post('/register', async ({ body, jwt, set }) => {
    try {
      // 调用注册服务创建用户
      const user = await authService.register(body.phone, body.password, body.nickname);
      // 为新用户签发 JWT 令牌
      const token = await jwt.sign({ userId: user.id });
      set.status = 201;
      return success({ user, token }, '注册成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '注册失败';
      set.status = 400;
      return error(message);
    }
  }, {
    // 请求体参数校验
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      password: t.String({ minLength: 8, maxLength: 20 }),
      nickname: t.String({ minLength: 1, maxLength: 20 }),
    }),
  })

  /**
   * 用户登录
   * POST /api/auth/login
   * 支持密码登录和验证码登录两种方式，成功后返回用户信息和 JWT 令牌
   */
  .post('/login', async ({ body, jwt, set }) => {
    try {
      const { password, code } = body;
      let user;

      // 优先使用验证码登录
      if (code) {
        user = await authService.loginWithCode(body.phone, code);
      } else if (password) {
        // 其次使用密码登录
        user = await authService.loginWithPassword(body.phone, password);
      } else {
        set.status = 400;
        return error('请提供密码或验证码');
      }

      // 签发 JWT 令牌
      const token = await jwt.sign({ userId: user.id });
      return success({ user, token }, '登录成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '登录失败';
      set.status = 400;
      return error(message);
    }
  }, {
    // password 和 code 至少提供一个
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      password: t.Optional(t.String()),
      code: t.Optional(t.String()),
    }),
  })

  /**
   * 发送短信验证码
   * POST /api/auth/send-code
   * 向指定手机号发送验证码（当前为占位实现）
   */
  .post('/send-code', async ({ body, set }) => {
    try {
      return success(null, '验证码已发送');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '发送失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
    }),
  })

  /**
   * 重置密码
   * POST /api/auth/reset-password
   * 通过手机号和验证码验证身份后设置新密码
   */
  .post('/reset-password', async ({ body, set }) => {
    try {
      await authService.updatePassword(body.phone, body.code, body.newPassword);
      return success(null, '密码重置成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '重置失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      code: t.String(),
      newPassword: t.String({ minLength: 8, maxLength: 20 }),
    }),
  });

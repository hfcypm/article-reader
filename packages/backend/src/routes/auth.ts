/**
 * 认证路由模块
 *
 * 提供用户注册、登录、验证码发送和密码重置的 HTTP 接口。
 * 所有端点挂载在 /api/auth 前缀下，无需登录认证。
 */
import { Elysia, t } from 'elysia';
import { authService } from '../services/auth.service';
import { generateCaptcha, verifyCaptcha } from '../services/captcha.service';
import { success, error } from '../utils/response';

export const authRoutes = new Elysia({ prefix: '/api/auth' })

  .get('/captcha', () => {
    const { id, svg } = generateCaptcha();
    return success({ id, svg });
  })

  .post('/register', async ({ body, jwt, set }) => {
    try {
      if (!verifyCaptcha(body.captchaId, body.captchaText)) {
        set.status = 400;
        return error('图形验证码错误或已过期');
      }

      const user = await authService.register(body.phone, body.password, body.nickname);
      const token = await jwt.sign({ userId: user.id });
      set.status = 201;
      return success({ user, token }, '注册成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '注册失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      password: t.String({ minLength: 8, maxLength: 20 }),
      nickname: t.String({ minLength: 1, maxLength: 20 }),
      captchaId: t.String(),
      captchaText: t.String(),
    }),
  })

  .post('/login', async ({ body, jwt, set }) => {
    try {
      const { password, code } = body;

      if (!verifyCaptcha(body.captchaId, body.captchaText)) {
        set.status = 400;
        return error('图形验证码错误或已过期');
      }

      let user;

      if (code) {
        user = await authService.loginWithCode(body.phone, code);
      } else if (password) {
        user = await authService.loginWithPassword(body.phone, password);
      } else {
        set.status = 400;
        return error('请提供密码或验证码');
      }

      const token = await jwt.sign({ userId: user.id });
      return success({ user, token }, '登录成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '登录失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      password: t.Optional(t.String()),
      code: t.Optional(t.String()),
      captchaId: t.String(),
      captchaText: t.String(),
    }),
  })

  .post('/send-code', async ({ body, set }) => {
    try {
      if (!verifyCaptcha(body.captchaId, body.captchaText)) {
        set.status = 400;
        return error('图形验证码错误或已过期');
      }

      return success(null, '验证码已发送');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '发送失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      phone: t.String({ minLength: 11, maxLength: 11 }),
      captchaId: t.String(),
      captchaText: t.String(),
    }),
  })

  .post('/reset-password', async ({ body, set }) => {
    try {
      if (!verifyCaptcha(body.captchaId, body.captchaText)) {
        set.status = 400;
        return error('图形验证码错误或已过期');
      }

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
      captchaId: t.String(),
      captchaText: t.String(),
    }),
  });

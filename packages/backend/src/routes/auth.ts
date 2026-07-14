import { Elysia, t } from 'elysia';
import { authService } from '../services/auth.service';
import { success, error } from '../utils/response';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post('/register', async ({ body, jwt, set }) => {
    try {
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
    }),
  })

  .post('/login', async ({ body, jwt, set }) => {
    try {
      const { password, code } = body;
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
    }),
  })

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

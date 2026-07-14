import { Elysia, t } from 'elysia';
import { userService } from '../services/user.service';
import { success, error } from '../utils/response';

export const userRoutes = new Elysia({ prefix: '/api/user' })

  .get('/profile', async ({ userId, set }) => {
    try {
      const profile = await userService.getProfile(userId);
      return success(profile);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '获取用户信息失败';
      set.status = 400;
      return error(message);
    }
  })

  .put('/profile', async ({ userId, body, set }) => {
    try {
      const user = await userService.updateProfile(userId, body);
      return success(user, '资料已更新');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '更新失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      nickname: t.Optional(t.String({ minLength: 1, maxLength: 20 })),
    }),
  })

  .get('/settings', async ({ userId, set }) => {
    try {
      const settings = await userService.getSettings(userId);
      return success(settings);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '获取设置失败';
      set.status = 400;
      return error(message);
    }
  })

  .put('/settings', async ({ userId, body, set }) => {
    try {
      const settings = await userService.updateSettings(userId, body);
      return success(settings, '设置已更新');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '更新设置失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      defaultSpeed: t.Optional(t.Number({ minimum: 0.5, maximum: 3.0 })),
      fontSize: t.Optional(t.String()),
      theme: t.Optional(t.String()),
      ttsEnabled: t.Optional(t.Boolean()),
    }),
  });

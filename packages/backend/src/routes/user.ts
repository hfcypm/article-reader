/**
 * 用户路由模块
 *
 * 提供用户个人资料和设置管理的 HTTP 接口。
 * 包括获取/更新个人资料和获取/更新阅读偏好设置。
 * 所有端点挂载在 /api/user 前缀下，需要登录认证。
 */
import { Elysia, t } from 'elysia';
import { userService } from '../services/user.service';
import { success, error } from '../utils/response';

export const userRoutes = new Elysia({ prefix: '/api/user' })

  /**
   * 获取用户个人资料
   * GET /api/user/profile
   * 返回当前登录用户的基本信息
   */
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

  /**
   * 更新用户个人资料
   * PUT /api/user/profile
   * 修改当前用户的昵称等信息
   */
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

  /**
   * 获取用户阅读设置
   * GET /api/user/settings
   * 返回用户偏好的阅读速度、字体大小、主题和 TTS 开关
   */
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

  /**
   * 更新用户阅读设置
   * PUT /api/user/settings
   * 保存用户的阅读偏好配置
   */
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
      // 默认阅读速度，范围 0.5x ~ 3.0x
      defaultSpeed: t.Optional(t.Number({ minimum: 0.5, maximum: 3.0 })),
      // 字体大小，如 "small"、"medium"、"large"
      fontSize: t.Optional(t.String()),
      // 主题模式，如 "light"、"dark"
      theme: t.Optional(t.String()),
      // 是否开启文本转语音
      ttsEnabled: t.Optional(t.Boolean()),
    }),
  });

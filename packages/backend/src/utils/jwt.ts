/**
 * JWT 认证插件模块
 *
 * 基于 @elysiajs/jwt 封装，提供统一的 JWT 签名和验证能力。
 * 令牌有效期为 7 天，密钥通过环境变量 JWT_SECRET 配置。
 */
import jwt from '@elysiajs/jwt';

/** JWT 插件实例，用于签发和验证用户身份令牌 */
export const jwtPlugin = jwt({
  name: 'jwt',
  // 优先使用环境变量中的密钥，开发环境使用默认值
  secret: process.env.JWT_SECRET || 'article-reader-jwt-secret-key-2026',
  // 令牌有效期：7 天
  exp: '7d',
});

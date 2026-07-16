/**
 * 认证服务模块
 *
 * 处理用户注册、登录（密码/验证码）、密码重置和用户查询等核心认证业务逻辑。
 * 密码使用 bcrypt 哈希存储，验证码为固定值 "123456" 用于开发测试。
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 用户注册
   * 校验手机号唯一性、密码复杂度，创建用户并自动初始化用户设置
   */
  async register(phone: string, password: string, nickname: string) {
    // 检查手机号是否已被注册
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new Error('该手机号已注册');
    }

    // 校验密码长度
    if (password.length < 8 || password.length > 20) {
      throw new Error('密码长度应为 8-20 位');
    }

    // 校验密码必须同时包含字母和数字
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      throw new Error('密码需包含字母和数字');
    }

    // 对密码进行 bcrypt 哈希，强度 10 轮
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户记录，仅返回安全的字段
    const user = await prisma.user.create({
      data: { phone, passwordHash, nickname },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });

    // 为新用户初始化默认设置
    await prisma.userSettings.create({
      data: { userId: user.id },
    });

    return user;
  }

  /**
   * 密码登录
   * 根据手机号查找用户，使用 bcrypt 比对密码
   */
  async loginWithPassword(phone: string, password: string) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new Error('账号或密码错误');
    }

    // 比对输入的密码和数据库中存储的哈希
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('账号或密码错误');
    }

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
    };
  }

  /**
   * 验证码登录
   * 校验验证码（开发阶段固定为 123456），查找已注册用户
   */
  async loginWithCode(phone: string, code: string) {
    // 开发阶段验证码固定为 "123456"
    if (code !== '123456') {
      throw new Error('验证码错误');
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new Error('该手机号未注册，请先注册');
    }

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
    };
  }

  /**
   * 根据 ID 查询用户
   * 用于其他服务需要获取用户基本信息时调用
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }

  /**
   * 重置密码
   * 通过手机号和验证码验证身份，设置新的 bcrypt 哈希密码
   */
  async updatePassword(phone: string, code: string, newPassword: string) {
    if (code !== '123456') {
      throw new Error('验证码错误');
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
      throw new Error('密码长度应为 8-20 位');
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new Error('密码需包含字母和数字');
    }

    // 生成新密码的 bcrypt 哈希
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { phone },
      data: { passwordHash },
    });
  }
}

export const authService = new AuthService();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class AuthService {
  async register(phone: string, password: string, nickname: string) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new Error('该手机号已注册');
    }

    if (password.length < 8 || password.length > 20) {
      throw new Error('密码长度应为 8-20 位');
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      throw new Error('密码需包含字母和数字');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { phone, passwordHash, nickname },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });

    await prisma.userSettings.create({
      data: { userId: user.id },
    });

    return user;
  }

  async loginWithPassword(phone: string, password: string) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new Error('账号或密码错误');
    }

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

  async loginWithCode(phone: string, code: string) {
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

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }

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

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { phone },
      data: { passwordHash },
    });
  }
}

export const authService = new AuthService();

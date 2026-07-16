/**
 * 用户服务模块
 *
 * 管理用户个人资料和阅读设置，包括获取/更新用户信息、
 * 查询/保存用户阅读偏好（速度、字体、主题、TTS）。
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  /**
   * 获取用户个人资料
   * 返回用户基本信息 + 书架统计 + 阅读设置，手机号做脱敏处理
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');

    // 统计书架中的文档数量
    const bookshelfCount = await prisma.bookshelfItem.count({ where: { userId } });

    // 聚合统计已阅读的总句子数
    const totalReadSentences = await prisma.bookshelfItem.aggregate({
      where: { userId },
      _sum: { currentSentence: true },
    });

    // 获取用户阅读设置
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    return {
      ...user,
      // 手机号脱敏：138****1234
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      bookshelfCount,
      totalReadSentences: totalReadSentences._sum.currentSentence || 0,
      settings: settings ? {
        defaultSpeed: settings.defaultSpeed,
        fontSize: settings.fontSize,
        theme: settings.theme,
        ttsEnabled: settings.ttsEnabled,
      } : null,
    };
  }

  /**
   * 更新用户个人资料
   * 当前支持修改昵称，返回脱敏后的手机号
   */
  async updateProfile(userId: string, data: { nickname?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
  }

  /**
   * 获取用户阅读设置
   * 如果用户还没有设置记录，自动创建默认设置
   */
  async getSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      // 自动初始化默认设置
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  /**
   * 更新用户阅读设置
   * 支持的部分更新：阅读速度、字体大小、主题、TTS 开关
   * 如果设置记录不存在则先创建
   */
  async updateSettings(userId: string, data: {
    defaultSpeed?: number;
    fontSize?: string;
    theme?: string;
    ttsEnabled?: boolean;
  }) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      // 不存在则创建
      settings = await prisma.userSettings.create({
        data: { userId, ...data },
      });
    } else {
      // 存在则更新
      settings = await prisma.userSettings.update({
        where: { userId },
        data,
      });
    }
    return settings;
  }
}

export const userService = new UserService();

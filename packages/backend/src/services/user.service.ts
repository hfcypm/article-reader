import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');

    const bookshelfCount = await prisma.bookshelfItem.count({ where: { userId } });
    const totalReadSentences = await prisma.bookshelfItem.aggregate({
      where: { userId },
      _sum: { currentSentence: true },
    });

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    return {
      ...user,
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

  async updateProfile(userId: string, data: { nickname?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, phone: true, nickname: true, createdAt: true },
    });
  }

  async getSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }
    return settings;
  }

  async updateSettings(userId: string, data: {
    defaultSpeed?: number;
    fontSize?: string;
    theme?: string;
    ttsEnabled?: boolean;
  }) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId, ...data },
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { userId },
        data,
      });
    }
    return settings;
  }
}

export const userService = new UserService();

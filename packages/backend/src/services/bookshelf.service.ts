/**
 * 书架服务模块
 *
 * 管理用户书架的核心业务逻辑，包括添加/移除文档、获取/搜索书架列表、
 * 更新阅读进度和获取继续阅读推荐。
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BookshelfService {
  /**
   * 添加文档到书架
   * 仅在文档属于当前用户时才允许添加，避免重复添加
   */
  async addToBookshelf(userId: string, docId: string) {
    // 确认文档存在且属于当前用户
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    // 检查是否已在书架中（利用复合唯一索引 userId_docId）
    const existing = await prisma.bookshelfItem.findUnique({
      where: { userId_docId: { userId, docId } },
    });

    // 已存在则直接返回
    if (existing) return existing;

    const sentences = JSON.parse(doc.sentences);
    const totalSentences = sentences.length;

    // 创建书架条目，初始进度为 0
    return prisma.bookshelfItem.create({
      data: {
        userId,
        docId,
        currentSentence: 0,
        progress: 0,
      },
    });
  }

  /**
   * 获取书架列表
   * 支持按 lastReadAt（最近阅读）、title（书名）、addedAt（添加时间）排序
   */
  async getBookshelf(userId: string, sortBy = 'lastReadAt') {
    const orderBy: Record<string, string> = {};
    if (sortBy === 'title') {
      // 按书名升序排列（通过关联文档的 title 字段）
      orderBy.document = { title: 'asc' };
    } else if (sortBy === 'addedAt') {
      orderBy.addedAt = 'desc';
    } else {
      // 默认按最近阅读时间降序
      orderBy.lastReadAt = 'desc';
    }

    const items = await prisma.bookshelfItem.findMany({
      where: { userId },
      // 包含关联的文档信息
      include: {
        document: {
          select: {
            id: true,
            title: true,
            format: true,
            wordCount: true,
            importedAt: true,
            sentences: true,
          },
        },
      },
      orderBy: orderBy as unknown,
    });

    // 映射为前端友好的扁平结构，附送句子总数
    return items.map(item => ({
      id: item.id,
      docId: item.docId,
      title: item.document.title,
      format: item.document.format,
      wordCount: item.document.wordCount,
      currentSentence: item.currentSentence,
      progress: item.progress,
      addedAt: item.addedAt,
      lastReadAt: item.lastReadAt,
      sentenceCount: JSON.parse(item.document.sentences).length,
    }));
  }

  /**
   * 搜索书架
   * 按书名模糊匹配搜索用户书架中的文档
   */
  async searchBookshelf(userId: string, query: string) {
    const items = await prisma.bookshelfItem.findMany({
      where: {
        userId,
        document: {
          // 按书名模糊匹配（contains）
          title: { contains: query },
        },
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            format: true,
            wordCount: true,
            importedAt: true,
            sentences: true,
          },
        },
      },
    });

    return items.map(item => ({
      id: item.id,
      docId: item.docId,
      title: item.document.title,
      format: item.document.format,
      wordCount: item.document.wordCount,
      currentSentence: item.currentSentence,
      progress: item.progress,
      addedAt: item.addedAt,
      lastReadAt: item.lastReadAt,
      sentenceCount: JSON.parse(item.document.sentences).length,
    }));
  }

  /**
   * 根据文档 ID 获取书架条目
   * 用于恢复阅读进度等场景，返回扁平化的条目信息
   */
  async getByDocId(userId: string, docId: string) {
    const item = await prisma.bookshelfItem.findUnique({
      where: { userId_docId: { userId, docId } },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            format: true,
            wordCount: true,
            importedAt: true,
            sentences: true,
          },
        },
      },
    });
    if (!item) return null;
    return {
      id: item.id,
      docId: item.docId,
      title: item.document.title,
      format: item.document.format,
      wordCount: item.document.wordCount,
      currentSentence: item.currentSentence,
      progress: item.progress,
      addedAt: item.addedAt,
      lastReadAt: item.lastReadAt,
      sentenceCount: JSON.parse(item.document.sentences).length,
    };
  }

  /**
   * 从书架移除文档
   * 校验书架条目属于当前用户后才执行删除
   */
  async removeFromBookshelf(userId: string, itemId: string) {
    const item = await prisma.bookshelfItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new Error('书架记录不存在');

    await prisma.bookshelfItem.delete({ where: { id: itemId } });
  }

  /**
   * 更新阅读进度
   * 记录当前阅读到的句子索引，自动计算百分比进度并更新最后阅读时间
   */
  async updateProgress(userId: string, docId: string, currentSentence: number) {
    let item = await prisma.bookshelfItem.findUnique({
      where: { userId_docId: { userId, docId } },
    });
    if (!item) {
      item = await this.addToBookshelf(userId, docId);
    }

    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    // 根据总句子数计算阅读进度百分比
    const sentences = JSON.parse(doc.sentences);
    const totalSentences = sentences.length;
    const progress = totalSentences > 0 ? Math.round((currentSentence / totalSentences) * 100) / 100 : 0;

    return prisma.bookshelfItem.update({
      where: { userId_docId: { userId, docId } },
      data: {
        currentSentence,
        progress,
        // 更新最近阅读时间
        lastReadAt: new Date(),
      },
    });
  }

  /**
   * 获取继续阅读推荐
   * 返回最近有阅读活动的前 N 条书架记录，默认 5 条
   */
  async getContinueReading(userId: string, limit = 5) {
    const items = await prisma.bookshelfItem.findMany({
      where: { userId },
      orderBy: { lastReadAt: 'desc' },
      take: limit,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            format: true,
            wordCount: true,
            sentences: true,
          },
        },
      },
    });

    return items.map(item => ({
      id: item.id,
      docId: item.docId,
      title: item.document.title,
      format: item.document.format,
      currentSentence: item.currentSentence,
      progress: item.progress,
      lastReadAt: item.lastReadAt,
      sentenceCount: JSON.parse(item.document.sentences).length,
    }));
  }
}

export const bookshelfService = new BookshelfService();

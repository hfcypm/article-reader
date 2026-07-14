import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BookshelfService {
  async addToBookshelf(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    const existing = await prisma.bookshelfItem.findUnique({
      where: { userId_docId: { userId, docId } },
    });

    if (existing) return existing;

    const sentences = JSON.parse(doc.sentences);
    const totalSentences = sentences.length;

    return prisma.bookshelfItem.create({
      data: {
        userId,
        docId,
        currentSentence: 0,
        progress: 0,
      },
    });
  }

  async getBookshelf(userId: string, sortBy = 'lastReadAt') {
    const orderBy: Record<string, string> = {};
    if (sortBy === 'title') {
      orderBy.document = { title: 'asc' };
    } else if (sortBy === 'addedAt') {
      orderBy.addedAt = 'desc';
    } else {
      orderBy.lastReadAt = 'desc';
    }

    const items = await prisma.bookshelfItem.findMany({
      where: { userId },
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

  async searchBookshelf(userId: string, query: string) {
    const items = await prisma.bookshelfItem.findMany({
      where: {
        userId,
        document: {
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

  async removeFromBookshelf(userId: string, itemId: string) {
    const item = await prisma.bookshelfItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new Error('书架记录不存在');

    await prisma.bookshelfItem.delete({ where: { id: itemId } });
  }

  async updateProgress(userId: string, docId: string, currentSentence: number) {
    const item = await prisma.bookshelfItem.findUnique({
      where: { userId_docId: { userId, docId } },
    });
    if (!item) return null;

    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    const sentences = JSON.parse(doc.sentences);
    const totalSentences = sentences.length;
    const progress = totalSentences > 0 ? Math.round((currentSentence / totalSentences) * 100) / 100 : 0;

    return prisma.bookshelfItem.update({
      where: { userId_docId: { userId, docId } },
      data: {
        currentSentence,
        progress,
        lastReadAt: new Date(),
      },
    });
  }

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

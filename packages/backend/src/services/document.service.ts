import { PrismaClient } from '@prisma/client';
import { splitSentences, countWords, detectEncoding, parseTextContent, extractPdfText, extractMobiText } from '../utils/text-parser';

const prisma = new PrismaClient();

async function processDocument(docId: string, buffer: ArrayBuffer, ext: string, title: string) {
  try {
    await prisma.document.update({
      where: { id: docId },
      data: { progress: 10 },
    });

    let text: string;
    if (ext === 'pdf') {
      text = await extractPdfText(buffer);
    } else if (ext === 'mobi') {
      text = extractMobiText(buffer);
    } else {
      const encoding = detectEncoding(buffer);
      text = parseTextContent(buffer, encoding);
    }

    await prisma.document.update({
      where: { id: docId },
      data: { progress: 30 },
    });

    if (text.trim().length === 0) {
      await prisma.document.update({
        where: { id: docId },
        data: { status: 'failed', progress: 0 },
      });
      return;
    }

    const sentences = splitSentences(text);
    await prisma.document.update({
      where: { id: docId },
      data: { progress: 60 },
    });

    const wordCount = countWords(text);

    await prisma.document.update({
      where: { id: docId },
      data: { progress: 80 },
    });

    await prisma.document.update({
      where: { id: docId },
      data: {
        title,
        format: ext,
        wordCount,
        sentences: JSON.stringify(sentences),
        content: text,
        status: 'completed',
        progress: 100,
      },
    });
  } catch (e) {
    await prisma.document.update({
      where: { id: docId },
      data: { status: 'failed', progress: 0 },
    });
  }
}

export class DocumentService {
  async importDocument(userId: string, file: File) {
    const allowedFormats = ['txt', 'mobi', 'pdf'];
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (!allowedFormats.includes(ext)) {
      throw new Error(`不支持的格式：${ext}，V1.0 支持 TXT、MOBI、PDF`);
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件大小超过 50MB 限制');
    }

    const title = fileName.replace(/\.[^.]+$/, '');
    const buffer = await file.arrayBuffer();

    const document = await prisma.document.create({
      data: {
        userId,
        title,
        format: ext,
        status: 'processing',
        progress: 0,
      },
    });

    processDocument(document.id, buffer, ext, title);

    return document;
  }

  async getProgress(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, userId },
      select: { id: true, status: true, progress: true, title: true, format: true, wordCount: true, sentences: true },
    });
    if (!doc) throw new Error('文档不存在');
    return {
      ...doc,
      sentenceCount: doc.status === 'completed' ? JSON.parse(doc.sentences).length : 0,
    };
  }

  async checkDuplicate(userId: string, fileName: string) {
    const title = fileName.replace(/\.[^.]+$/, '');
    const doc = await prisma.document.findFirst({
      where: { userId, title },
    });
    return doc;
  }

  async getDocument(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, userId },
    });
    if (!doc) throw new Error('文档不存在');
    return {
      ...doc,
      sentences: JSON.parse(doc.sentences),
    };
  }

  async getRecentImports(userId: string, limit = 10) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { importedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        format: true,
        wordCount: true,
        importedAt: true,
      },
    });
  }

  async updateTitle(userId: string, docId: string, title: string) {
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    return prisma.document.update({
      where: { id: docId },
      data: { title },
    });
  }

  async deleteDocument(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    await prisma.document.delete({ where: { id: docId } });
  }
}

export const documentService = new DocumentService();

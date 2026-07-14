import { PrismaClient } from '@prisma/client';
import { splitSentences, countWords, detectEncoding, parseTextContent, extractPdfText, extractMobiText } from '../utils/text-parser';

const prisma = new PrismaClient();

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

    const buffer = await file.arrayBuffer();
    let text: string;

    if (ext === 'pdf') {
      text = await extractPdfText(buffer);
    } else if (ext === 'mobi') {
      text = extractMobiText(buffer);
    } else {
      const encoding = detectEncoding(buffer);
      text = parseTextContent(buffer, encoding);
    }

    if (text.trim().length === 0) {
      throw new Error('文件内容为空或无法识别');
    }

    const title = fileName.replace(/\.[^.]+$/, '');
    const sentences = splitSentences(text);
    const wordCount = countWords(text);

    const document = await prisma.document.create({
      data: {
        userId,
        title,
        format: ext,
        wordCount,
        sentences: JSON.stringify(sentences),
        content: text,
      },
    });

    return {
      ...document,
      sentences: JSON.parse(document.sentences),
      sentenceCount: sentences.length,
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

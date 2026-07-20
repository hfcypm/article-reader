/**
 * 文档服务模块
 *
 * 管理文档的导入、解析、查询和删除。支持 TXT、PDF、MOBI、MP3、MP4 格式，
 * 文件上传后异步解析文本内容（媒体文件通过语音识别）并分句存储。
 */
import { PrismaClient } from '@prisma/client';
import { splitSentences, countWords, detectEncoding, parseTextContent, extractPdfText, extractMobiText } from '../utils/text-parser';
import { transcribeMedia } from '../utils/media-transcriber';

const prisma = new PrismaClient();

/**
 * 异步处理文档解析流水线
 *
 * 根据文件扩展名选择对应的解析方式，将结果分句后存储。
 * 通过文档的 progress 字段记录解析进度（0 → 10 → 30 → 60 → 80 → 100），
 * 解析失败时将 status 设为 "failed"。
 */
async function processDocument(docId: string, buffer: ArrayBuffer, ext: string, title: string) {
  try {
    await prisma.document.update({
      where: { id: docId },
      data: { progress: 10 },
    });

    let text: string;
    const isMedia = ext === 'mp3' || ext === 'mp4';

    if (isMedia) {
      await prisma.document.update({
        where: { id: docId },
        data: { progress: 20 },
      });
      text = await transcribeMedia(buffer, ext);

      await prisma.document.update({
        where: { id: docId },
        data: { progress: 50 },
      });
    } else if (ext === 'pdf') {
      text = await extractPdfText(buffer);
    } else if (ext === 'mobi') {
      text = extractMobiText(buffer);
    } else {
      const encoding = detectEncoding(buffer);
      text = parseTextContent(buffer, encoding);
    }

    if (!isMedia) {
      await prisma.document.update({
        where: { id: docId },
        data: { progress: 30 },
      });
    }

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
  /**
   * 导入文档
   * 校验文件格式和大小限制，创建数据库记录后启动异步解析
   */
  async importDocument(userId: string, file: File) {
    const allowedFormats = ['txt', 'mobi', 'pdf', 'mp3', 'mp4'];
    const fileName = file.name;
    // 提取文件扩展名（不含点号）
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // 校验文件格式
    if (!allowedFormats.includes(ext)) {
      throw new Error(`不支持的格式：${ext}，支持 TXT、MOBI、PDF、MP3、MP4`);
    }

    // 校验文件大小（最大 50MB）
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件大小超过 50MB 限制');
    }

    // 从文件名中提取标题（去除扩展名）
    const title = fileName.replace(/\.[^.]+$/, '');
    // 读取文件二进制数据
    const buffer = await file.arrayBuffer();

    // 创建文档记录，初始状态为 processing
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        format: ext,
        status: 'processing',
        progress: 0,
      },
    });

    // 启动异步解析，不阻塞接口响应
    processDocument(document.id, buffer, ext, title);

    return document;
  }

  /**
   * 获取文档解析进度
   * 返回文档的当前状态、进度百分比以及解析后的句子数量
   */
  async getProgress(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: docId, userId },
      select: { id: true, status: true, progress: true, title: true, format: true, wordCount: true, sentences: true },
    });
    if (!doc) throw new Error('文档不存在');
    return {
      ...doc,
      // 仅在解析完成时计算句子数，避免 JSON.parse 报错
      sentenceCount: doc.status === 'completed' ? JSON.parse(doc.sentences).length : 0,
    };
  }

  /**
   * 检查文档是否重复
   * 根据文件名（去除扩展名后）判断当前用户是否已导入过同名文档
   */
  async checkDuplicate(userId: string, fileName: string) {
    const title = fileName.replace(/\.[^.]+$/, '');
    const doc = await prisma.document.findFirst({
      where: { userId, title },
    });
    return doc;
  }

  /**
   * 获取文档详情
   * 返回文档完整信息，sentences 解析为 JSON 数组供前端使用
   */
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

  /**
   * 获取最近导入的文档
   * 返回最近导入的 N 条文档摘要信息，默认 10 条
   */
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

  /**
   * 更新文档标题
   * 允许用户自定义修改已导入文档的书名
   */
  async updateTitle(userId: string, docId: string, title: string) {
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    return prisma.document.update({
      where: { id: docId },
      data: { title },
    });
  }

  /**
   * 删除文档
   * 级联删除文档及其关联的书架条目
   */
  async deleteDocument(userId: string, docId: string) {
    const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
    if (!doc) throw new Error('文档不存在');

    await prisma.document.delete({ where: { id: docId } });
  }
}

export const documentService = new DocumentService();

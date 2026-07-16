/**
 * 文档路由模块
 *
 * 提供文档管理的 HTTP 接口，包括导入文档、重复检查、获取最近导入、
 * 查看文档详情/进度、更新标题和删除文档等操作。
 * 所有端点挂载在 /api/documents 前缀下，需要登录认证。
 */
import { Elysia, t } from 'elysia';
import { documentService } from '../services/document.service';
import { success, error } from '../utils/response';

export const documentRoutes = new Elysia({ prefix: '/api/documents' })

  /**
   * 导入文档
   * POST /api/documents/import
   * 上传文本文件，解析内容并存储到数据库中
   */
  .post('/import', async ({ body, set, userId }) => {
    try {
      const file = body.file as unknown as File;
      const doc = await documentService.importDocument(userId, file);
      set.status = 201;
      return success(doc, '导入成功');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '导入失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })

  /**
   * 检查文档是否重复
   * POST /api/documents/check-duplicate
   * 根据文件名判断当前用户是否已导入过同名文档
   */
  .post('/check-duplicate', async ({ body, set, userId }) => {
    try {
      const doc = await documentService.checkDuplicate(userId, body.fileName);
      return success({ exists: !!doc }, doc ? '该文件已导入' : undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '检查失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      fileName: t.String(),
    }),
  })

  /**
   * 获取最近导入
   * GET /api/documents/recent
   * 返回当前用户最近导入的文档列表
   */
  .get('/recent', async ({ userId }) => {
    const docs = await documentService.getRecentImports(userId);
    return success(docs);
  })

  /**
   * 获取文档详情
   * GET /api/documents/:id
   * 返回指定文档的完整内容（含解析后的句子列表）
   */
  .get('/:id', async ({ params, userId, set }) => {
    try {
      const doc = await documentService.getDocument(userId, params.id);
      return success(doc);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '获取失败';
      set.status = 404;
      return error(message);
    }
  })

  /**
   * 获取阅读进度
   * GET /api/documents/:id/progress
   * 返回用户对指定文档的阅读进度信息
   */
  .get('/:id/progress', async ({ params, userId, set }) => {
    try {
      const progress = await documentService.getProgress(userId, params.id);
      return success(progress);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '查询失败';
      set.status = 404;
      return error(message);
    }
  })

  /**
   * 更新文档标题
   * PUT /api/documents/:id/title
   * 允许用户修改已导入文档的书名
   */
  .put('/:id/title', async ({ params, body, userId, set }) => {
    try {
      const doc = await documentService.updateTitle(userId, params.id, body.title);
      return success(doc, '书名已更新');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '更新失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 100 }),
    }),
  })

  /**
   * 删除文档
   * DELETE /api/documents/:id
   * 删除指定文档及其关联数据
   */
  .delete('/:id', async ({ params, userId, set }) => {
    try {
      await documentService.deleteDocument(userId, params.id);
      return success(null, '文档已删除');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '删除失败';
      set.status = 400;
      return error(message);
    }
  });

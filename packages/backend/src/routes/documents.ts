import { Elysia, t } from 'elysia';
import { documentService } from '../services/document.service';
import { success, error } from '../utils/response';

export const documentRoutes = new Elysia({ prefix: '/api/documents' })

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

  .get('/recent', async ({ userId }) => {
    const docs = await documentService.getRecentImports(userId);
    return success(docs);
  })

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

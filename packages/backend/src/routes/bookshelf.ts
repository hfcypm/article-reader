/**
 * 书架路由模块
 *
 * 提供用户书架管理的 HTTP 接口，包括获取书架列表、添加文档、
 * 继续阅读推荐、更新阅读进度和移除文档等操作。
 * 所有端点挂载在 /api/bookshelf 前缀下，需要登录认证。
 */
import { Elysia, t } from 'elysia';
import { bookshelfService } from '../services/bookshelf.service';
import { success, error } from '../utils/response';

export const bookshelfRoutes = new Elysia({ prefix: '/api/bookshelf' })

  /**
   * 获取书架列表
   * GET /api/bookshelf?sortBy=lastReadAt&search=关键字
   * 支持按字段排序和关键词搜索
   */
  .get('/', async ({ query, userId }) => {
    const sortBy = (query?.sortBy as string) || 'lastReadAt';
    const search = query?.search as string;

    // 如果有搜索关键词，执行搜索
    if (search) {
      const items = await bookshelfService.searchBookshelf(userId, search);
      return success(items);
    }

    // 否则按排序字段获取全部书架
    const items = await bookshelfService.getBookshelf(userId, sortBy);
    return success(items);
  })

  /**
   * 添加文档到书架
   * POST /api/bookshelf
   * 将指定文档添加到当前用户的书架中
   */
  .post('/', async ({ body, userId, set }) => {
    try {
      const item = await bookshelfService.addToBookshelf(userId, body.docId);
      set.status = 201;
      return success(item, '已加入书架');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '加入书架失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      docId: t.String(),
    }),
  })

  /**
   * 获取继续阅读推荐
   * GET /api/bookshelf/continue-reading
   * 返回最近有阅读进度的文档，方便用户快速继续
   */
  .get('/continue-reading', async ({ userId }) => {
    const items = await bookshelfService.getContinueReading(userId);
    return success(items);
  })

  /**
   * 根据文档 ID 获取书架条目
   * GET /api/bookshelf/by-doc/:docId
   * 用于恢复阅读进度等场景
   */
  .get('/by-doc/:docId', async ({ params, userId, set }) => {
    try {
      const item = await bookshelfService.getByDocId(userId, params.docId);
      if (!item) {
        set.status = 404;
        return error('文档未在书架中');
      }
      return success(item);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '查询失败';
      set.status = 400;
      return error(message);
    }
  })

  /**
   * 更新阅读进度
   * PUT /api/bookshelf/:docId/progress
   * 保存用户对指定文档的阅读进度（当前句子索引）
   */
  .put('/:docId/progress', async ({ params, body, userId, set }) => {
    try {
      const item = await bookshelfService.updateProgress(userId, params.docId, body.currentSentence);
      if (!item) {
        return success(null, '文档未在书架中，进度已临时保存');
      }
      return success(item, '进度已保存');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '保存进度失败';
      set.status = 400;
      return error(message);
    }
  }, {
    body: t.Object({
      // 当前阅读到的句子索引，从 0 开始
      currentSentence: t.Number({ minimum: 0 }),
    }),
  })

  /**
   * 从书架移除文档
   * DELETE /api/bookshelf/:itemId
   * 将指定书架条目从用户书架中删除
   */
  .delete('/:itemId', async ({ params, userId, set }) => {
    try {
      await bookshelfService.removeFromBookshelf(userId, params.itemId);
      return success(null, '已从书架移除');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '移除失败';
      set.status = 400;
      return error(message);
    }
  });

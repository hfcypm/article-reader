import { Elysia, t } from 'elysia';
import { bookshelfService } from '../services/bookshelf.service';
import { success, error } from '../utils/response';

export const bookshelfRoutes = new Elysia({ prefix: '/api/bookshelf' })

  .get('/', async ({ query, userId }) => {
    const sortBy = (query?.sortBy as string) || 'lastReadAt';
    const search = query?.search as string;

    if (search) {
      const items = await bookshelfService.searchBookshelf(userId, search);
      return success(items);
    }

    const items = await bookshelfService.getBookshelf(userId, sortBy);
    return success(items);
  })

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

  .get('/continue-reading', async ({ userId }) => {
    const items = await bookshelfService.getContinueReading(userId);
    return success(items);
  })

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
      currentSentence: t.Number({ minimum: 0 }),
    }),
  })

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

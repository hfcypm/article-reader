import jwt from '@elysiajs/jwt';

export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET || 'article-reader-jwt-secret-key-2026',
  exp: '7d',
});

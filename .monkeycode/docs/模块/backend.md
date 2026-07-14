# 后端 API

基于 Elysia (Bun) 的 RESTful API 服务，运行在端口 3001，使用 Prisma + SQLite 数据层。

## 结构

```
backend/
├── prisma/
│   └── schema.prisma       # 数据库模型 (User, Document, BookshelfItem, UserSettings)
├── src/
│   ├── index.ts            # 应用入口，Elysia 实例配置，路由注册
│   ├── routes/
│   │   ├── auth.ts         # 认证路由 (注册/登录/验证码/重置密码)
│   │   ├── documents.ts    # 文档路由 (导入/查询/更新标题/删除)
│   │   ├── bookshelf.ts    # 书架路由 (增删改查/进度更新/继续阅读)
│   │   └── user.ts         # 用户路由 (资料/设置)
│   ├── services/
│   │   ├── auth.service.ts    # 注册/登录/密码重置逻辑
│   │   ├── document.service.ts # 文档导入/解析/查询逻辑
│   │   ├── bookshelf.service.ts # 书架/进度管理逻辑
│   │   └── user.service.ts    # 用户资料/设置逻辑
│   ├── middleware/
│   │   └── auth.ts         # JWT 鉴权守卫 (未实际使用)
│   └── utils/
│       ├── jwt.ts          # JWT 插件配置
│       ├── response.ts     # 统一响应格式 (success/error)
│       └── text-parser.ts  # 文本解析 (分句/字数/PDF/MOBI)
└── .env                    # 环境变量 (DATABASE_URL)
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `src/index.ts` | 应用组装入口，CORS/JWT 插件注册，路由分组 (公开/受保护) |
| `src/routes/auth.ts` | 4 个公开端点，处理注册、密码登录、验证码登录、密码重置 |
| `src/services/document.service.ts` | 文档导入的核心逻辑，调用 text-parser 处理不同格式 |
| `src/utils/text-parser.ts` | 文本处理引擎，分句算法、编码检测、PDF/MOBI 解析 |
| `prisma/schema.prisma` | 4 个数据模型，定义表结构、关系和约束 |

## 依赖

**本模块依赖**:
- `@elysiajs/cors` — CORS 跨域支持
- `@elysiajs/jwt` — JWT 认证
- `bcryptjs` — 密码哈希
- `unpdf` — PDF 文本提取
- `@prisma/client` — 数据库 ORM

**依赖本模块的**:
- 前端应用 — 通过 Vite 代理调用 API

## 规范

### 文件命名
- 路由: `[domain].ts`
- 服务: `[domain].service.ts`
- 工具: `kebab-case.ts`

### 代码模式

**路由-服务分离**:
```typescript
// routes/auth.ts — 只做参数验证和响应
app.post('/api/auth/login', async ({ body }) => {
  const result = await authService.loginWithPassword(body.phone, body.password);
  return success(result, '登录成功');
});

// services/auth.service.ts — 业务逻辑
async loginWithPassword(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  // ... 验证 + 返回
}
```

**统一响应**:
```typescript
success(data, message)  // → { success: true, data, message }
error(errorMsg, userMsg) // → { success: false, error, message }
```

**Elysia Schema 验证**:
```typescript
app.post('/api/example', async ({ body }) => {
  // ...
}, {
  body: t.Object({
    field: t.String(),
    count: t.Number(),
  })
});
```

### 错误处理
- Service 层抛出具体错误信息
- Route 层捕获并转为统一错误响应
- 用户不感知内部错误详情

### 测试
当前未配置测试框架。建议使用 Bun 内置 `bun test` 编写 Service 层单元测试。

## 添加新端点

1. 在 `src/services/` 中添加业务方法
2. 在 `src/routes/` 中添加路由处理
3. 如需认证，在 `src/index.ts` 的 guard 内注册路由
4. 更新 [接口文档](../INTERFACES.md)

# 开发者指南

## 项目目的

Article Reader 是一个移动端优先的逐句阅读器应用，帮助用户在碎片化时间中高效阅读长文本。支持 TXT、PDF、MOBI 格式文档导入，提供逐句高亮、阅读速度控制、TTS 语音朗读和书架管理功能。

**核心职责**:
- 文档导入与解析 (TXT/PDF/MOBI)
- 逐句阅读与进度追踪
- 书架管理与阅读历史
- 用户认证与个性化设置

---

## 环境搭建

### 前置条件

- Bun >= 1.3
- 现代浏览器 (Chrome / Firefox / Safari)

### 安装

```bash
# 克隆仓库
git clone <repo-url>
cd article-reader

# 安装依赖
bun install

# 配置后端环境变量
cp packages/backend/.env.example packages/backend/.env
```

### 环境变量

| 变量 | 必需 | 描述 | 示例 |
|------|------|------|------|
| `DATABASE_URL` | 是 | SQLite 数据库路径 | `file:./dev.db` |
| `JWT_SECRET` | 否 | JWT 签名密钥 | `your-secret-key` |

环境变量定义在 `packages/backend/.env` 中。

### 初始化数据库

```bash
# 生成 Prisma 客户端
bun run db:generate

# 同步 Schema 到 SQLite (创建 dev.db)
bun run db:push
```

### 运行

```bash
# 启动前后端开发服务器
bun run dev

# 仅启动后端 (端口 3001)
bun run dev:backend

# 仅启动前端 (端口 5173)
bun run dev:frontend

# 生产构建
bun run build
```

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Vite Dev Server | 5173 | 自动代理 `/api` 到后端 |
| 后端 Elysia API | 3001 | REST API |

---

## 项目架构约定

### 后端分层

```
routes/  → 请求参数验证、调用 service、封装响应
services/ → 业务逻辑、Prisma 查询、数据处理
middleware/ → 认证守卫、通用中间件
utils/ → 工具函数、JWT 配置、响应格式、文本解析
```

**编码模式**:
- 每个 Service 是单例导出的类，包含静态方法
- 路由文件使用 Elysia 的 Schema 验证 (`t.Object({...})`)
- 所有响应通过 `success()` / `error()` 工具函数统一格式

### 前端分层

```
pages/ → 页面级组件，负责数据获取和页面布局
components/layout/ → 布局组件 (MainLayout, Header, TabBar)
components/ui/ → 可复用 UI 组件 (Button, Card, Dialog, Toast)
store/ → Zustand 全局状态 (auth, app)
lib/ → API 封装、工具函数
types/ → TypeScript 类型定义
```

**编码模式**:
- 页面组件内部使用 `useState` + `useEffect` 管理局部状态
- 全局认证状态使用 Zustand `useAuthStore`
- API 调用通过 `lib/api.ts` 统一封装，自动注入 Bearer Token

---

## 常见任务

### 添加新 API 端点

**需修改的文件**:
1. `packages/backend/src/routes/<domain>.ts` — 添加路由处理
2. `packages/backend/src/services/<domain>.service.ts` — 添加业务逻辑
3. (新建) `packages/frontend/src/pages/<NewPage>.tsx` — 如需新页面

**步骤**:
1. 在 service 中添加业务方法
2. 在 route 中定义端点，使用 Elysia Schema 验证请求体
3. 通过 `success()` / `error()` 工具函数返回统一格式
4. 如需认证，在已有 guard 内注册路由

### 添加新数据库字段

**需修改的文件**:
1. `packages/backend/prisma/schema.prisma` — 添加字段定义
2. 相关 Service 文件 — 更新查询和创建逻辑

**步骤**:
1. 在 `schema.prisma` 对应模型中添加字段
2. 运行 `bun run db:push` 同步到数据库
3. 更新 Service 中相关的 Prisma 查询 (select/include)
4. 更新前端 TypeScript 类型 (`packages/frontend/src/types/index.ts`)

### 添加新前端页面

**需修改的文件**:
1. `packages/frontend/src/pages/<NewPage>.tsx` — 创建页面组件
2. `packages/frontend/src/App.tsx` — 添加路由

**步骤**:
1. 在 `pages/` 下创建新页面组件
2. 在 `App.tsx` 中导入并添加 `<Route>` 定义
3. 认证页面放在 `ProtectedRoute` 外部，其他放在内部
4. 如需底部 Tab，将路由放在 `MainLayout` 的 `<Route>` 下
5. 独立页面 (如阅读器) 直接放在 `ProtectedRoute` 下

### 添加新 UI 组件

**需修改的文件**:
1. `packages/frontend/src/components/ui/<component>.tsx` — 创建组件

**步骤**:
1. 在 `components/ui/` 下创建组件文件
2. 使用 TailwindCSS 编写样式
3. 使用 `forwardRef` 支持 ref 转发
4. 使用 `cn()` 工具函数合并 className
5. 可选：使用 `class-variance-authority` 定义变体

---

## 数据库管理

### Prisma 命令

```bash
# 生成 Prisma 客户端代码
bun run db:generate

# 推送 Schema 到数据库 (无迁移文件)
bun run db:push

# 创建数据库迁移 (生产环境推荐)
bun run db:migrate

# 打开 Prisma Studio 可视化工具
bun run db:studio
```

数据库文件位置: `packages/backend/prisma/dev.db` (已在 `.gitignore` 中)

### 重置数据库

```bash
# 删除并重建数据库
rm packages/backend/prisma/dev.db
bun run db:push
```

---

## 前端主题定制

主题变量定义在 `packages/frontend/src/index.css` 的 `@theme` 指令中。支持亮色/暗色双模式。

```css
/* 主要颜色 */
--color-primary: #6c5ce7
--color-primary-light: #a29bfe
--color-primary-dark: #5a4bd1

/* 强调色 */
--color-accent-green: #00b894
--color-accent-orange: #fdcb6e
--color-accent-red: #ff7675
--color-accent-blue: #74b9ff
```

修改全局样式时，优先使用 Tailwind 工具类或调整 CSS 变量，避免覆写组件内部样式。

---

## 测试

当前项目尚未配置测试框架。如需添加测试：

前端推荐使用 Vitest + React Testing Library，后端推荐使用 Bun 内置测试工具。

```bash
# 后端测试示例
bun test

# 前端测试示例
cd packages/frontend && npx vitest
```

---

## 构建与部署

```bash
# 开发环境
bun run dev

# 生产构建
bun run build

# 生产环境运行
cd packages/backend && bun run start
```

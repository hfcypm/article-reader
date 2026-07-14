# Article Reader 文档

Article Reader 是一个移动端优先的逐句阅读器应用，本文档涵盖系统架构、API 接口、开发指南和核心概念。

**快速链接**: [架构](./ARCHITECTURE.md) | [接口](./INTERFACES.md) | [开发者指南](./DEVELOPER_GUIDE.md)

---

## 核心文档

### [架构](./ARCHITECTURE.md)
系统设计、技术栈、子系统划分、数据流和数据库模型关系。从这里开始了解系统整体运作方式。

### [接口](./INTERFACES.md)
后端 REST API 完整参考 (16 个端点) 和前端路由定义。包含请求/响应格式、认证方式和参数说明。

### [开发者指南](./DEVELOPER_GUIDE.md)
环境搭建、开发工作流、编码规范和常见任务指南。新贡献者必读。

---

## 模块

| 模块 | 描述 |
|------|------|
| [后端 API](./模块/backend.md) | Elysia 服务，路由-服务分层架构 |
| [前端应用](./模块/frontend.md) | React SPA，移动端优先设计 |

---

## 核心概念

| 概念 | 描述 |
|------|------|
| [用户与认证](./专有概念/user-and-auth.md) | 用户注册、JWT 登录、个人设置 |
| [文档](./专有概念/document.md) | 文档导入、格式解析、分句存储 |
| [书架与阅读进度](./专有概念/bookshelf.md) | 书架管理、进度追踪、继续阅读 |
| [阅读器](./专有概念/reader.md) | 逐句阅读、速度控制、TTS 语音 |

---

## 入门指南

### 项目新人
1. **[架构](./ARCHITECTURE.md)** — 了解系统全貌
2. **[核心概念](#核心概念)** — 学习领域术语
3. **[开发者指南](./DEVELOPER_GUIDE.md)** — 搭建开发环境
4. **[接口](./INTERFACES.md)** — 探索 API 设计

### 首次贡献
1. 阅读 [开发者指南](./DEVELOPER_GUIDE.md) 搭建环境
2. 浏览 [常见任务](./DEVELOPER_GUIDE.md#常见任务) 了解开发模式
3. 参考 [接口文档](./INTERFACES.md) 了解 API 契约

---

## 快速参考

### 命令

```bash
bun install          # 安装依赖
bun run dev          # 启动前后端
bun run dev:backend  # 仅启动后端
bun run dev:frontend # 仅启动前端
bun run db:generate  # 生成 Prisma 客户端
bun run db:push      # 同步数据库 Schema
bun run build        # 生产构建
```

### 端口

| 服务 | 端口 |
|------|------|
| 前端 Vite | 5173 |
| 后端 API | 3001 |

### 重要文件

| 文件 | 目的 |
|------|------|
| `packages/backend/prisma/schema.prisma` | 数据库模型 |
| `packages/backend/src/index.ts` | 后端入口 |
| `packages/frontend/src/App.tsx` | 前端路由 |
| `packages/frontend/vite.config.ts` | Vite 配置 |

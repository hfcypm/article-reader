# 接口文档

## 概述

Article Reader API 是一个基于 Elysia 的 RESTful HTTP API，运行在端口 3001。所有接口返回统一的 JSON 响应格式。

**Base URL**: `http://localhost:3001/api`

**认证方式**: Bearer Token (JWT)，在请求头中携带 `Authorization: Bearer <token>`

**统一响应格式**:

```typescript
// 成功响应
{ "success": true, "data": <T>, "message": "操作成功" }

// 错误响应
{ "success": false, "error": "错误描述", "message": "用户提示" }
```

---

## 公开接口 (无需认证)

### `GET /api/health`

健康检查。

**响应** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

---

### `POST /api/auth/register`

注册新用户，成功后返回 JWT Token 即完成登录。

**请求体**:
```json
{
  "phone": "13800138000",
  "password": "abc12345",
  "nickname": "张三"
}
```

**参数说明**:
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号，需唯一 |
| password | string | 是 | 密码，8-20 位，须含字母和数字 |
| nickname | string | 是 | 用户昵称 |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "phone": "13800138000",
      "nickname": "张三",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOi..."
  },
  "message": "注册成功"
}
```

**错误响应** (400):
```json
{ "success": false, "error": "手机号已注册", "message": "该手机号已被注册" }
```

---

### `POST /api/auth/login`

用户登录，支持密码登录和验证码登录两种模式。

**请求体 (密码登录)**:
```json
{
  "phone": "13800138000",
  "password": "abc12345"
}
```

**请求体 (验证码登录)**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**参数说明**:
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| password | string | 否 | 密码 (与 code 二选一) |
| code | string | 否 | 验证码 (当前固定为 "123456") |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": { "id": "clx...", "phone": "13800138000", "nickname": "张三" },
    "token": "eyJhbGciOi..."
  },
  "message": "登录成功"
}
```

---

### `POST /api/auth/send-code`

发送短信验证码 (当前为桩实现，直接返回成功)。

**请求体**:
```json
{ "phone": "13800138000" }
```

**成功响应** (200):
```json
{ "success": true, "message": "验证码已发送" }
```

---

### `POST /api/auth/reset-password`

通过验证码重置密码。

**请求体**:
```json
{
  "phone": "13800138000",
  "code": "123456",
  "newPassword": "newPass123"
}
```

**成功响应** (200):
```json
{ "success": true, "message": "密码重置成功" }
```

---

## 需认证接口

所有以下接口需在请求头中携带 `Authorization: Bearer <token>`。未认证或 Token 过期返回 401。

---

### 文档管理

#### `POST /api/documents/import`

导入 TXT/PDF/MOBI 文档。

**请求格式**: `multipart/form-data`

**参数**:
| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| file | File | 是 | 文档文件 (.txt / .pdf / .mobi) |

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "文档标题",
    "format": "txt",
    "wordCount": 5000,
    "sentenceCount": 120,
    "content": "..."
  },
  "message": "导入成功"
}
```

**错误响应** (400):
```json
{ "success": false, "error": "不支持的文件格式", "message": "不支持的文件格式: .epub" }
```

---

#### `POST /api/documents/check-duplicate`

检查文件是否已被导入（按标题去重）。

**请求体**:
```json
{ "fileName": "my_document" }
```

**成功响应** (200):
```json
{
  "success": true,
  "data": { "exists": true, "document": { "id": "clx...", "title": "my_document" } }
}
```

---

#### `GET /api/documents/recent`

获取当前用户最近导入的 10 个文档。

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "文档A",
      "format": "pdf",
      "wordCount": 3000,
      "importedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/documents/:id`

获取单个文档详情 (包含分句数据)。

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 文档 ID |

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "文档标题",
    "format": "txt",
    "wordCount": 5000,
    "sentences": [
      { "index": 0, "text": "第一句话。", "start": 0, "end": 6 },
      { "index": 1, "text": "第二句话。", "start": 6, "end": 12 }
    ],
    "content": "...",
    "importedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**错误响应** (404):
```json
{ "success": false, "error": "文档不存在", "message": "文档不存在或无权访问" }
```

---

#### `PUT /api/documents/:id/title`

修改文档标题。

**请求体**:
```json
{ "title": "新标题" }
```

**成功响应** (200):
```json
{ "success": true, "data": { "id": "clx...", "title": "新标题" }, "message": "标题更新成功" }
```

---

#### `DELETE /api/documents/:id`

删除文档（级联删除该书架记录）。

**成功响应** (200):
```json
{ "success": true, "message": "文档已删除" }
```

---

### 书架管理

#### `GET /api/bookshelf`

获取当前用户书架列表，支持排序和搜索。

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| sortBy | string | 否 | 排序方式: `recent` (最近阅读) / `added` (加入时间) / `title` (标题) |
| search | string | 否 | 搜索关键词 (按文档标题模糊匹配) |

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "docId": "clx...",
      "document": {
        "id": "clx...",
        "title": "文档标题",
        "wordCount": 5000
      },
      "currentSentence": 42,
      "progress": 35.0,
      "addedAt": "2026-01-01T00:00:00.000Z",
      "lastReadAt": "2026-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### `POST /api/bookshelf`

将文档添加到书架。

**请求体**:
```json
{ "docId": "clx..." }
```

**成功响应** (201):
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "docId": "clx...",
    "currentSentence": 0,
    "progress": 0,
    "addedAt": "2026-01-01T00:00:00.000Z"
  },
  "message": "已添加到书架"
}
```

**错误响应** (400):
```json
{ "success": false, "error": "文档已在书架中", "message": "该文档已在书架中" }
```

---

#### `GET /api/bookshelf/continue-reading`

获取继续阅读列表 (最近阅读的 5 本书)。

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "docId": "clx...",
      "document": { "id": "...", "title": "文档标题" },
      "currentSentence": 30,
      "progress": 25.0,
      "lastReadAt": "2026-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### `PUT /api/bookshelf/:docId/progress`

更新阅读进度。

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| docId | string | 文档 ID |

**请求体**:
```json
{ "currentSentence": 42 }
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "currentSentence": 42,
    "progress": 35.0
  },
  "message": "进度已更新"
}
```

---

#### `DELETE /api/bookshelf/:itemId`

从书架移除文档。

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| itemId | string | 书架条目 ID |

**成功响应** (200):
```json
{ "success": true, "message": "已从书架移除" }
```

---

### 用户管理

#### `GET /api/user/profile`

获取当前用户个人资料 (含书架统计)。

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "phone": "138****8000",
    "nickname": "张三",
    "bookshelfCount": 5,
    "totalReadSentences": 1200,
    "settings": {
      "defaultSpeed": 1.0,
      "fontSize": "medium",
      "theme": "light",
      "ttsEnabled": false
    }
  }
}
```

---

#### `PUT /api/user/profile`

更新用户昵称。

**请求体**:
```json
{ "nickname": "新昵称" }
```

**成功响应** (200):
```json
{
  "success": true,
  "data": { "id": "clx...", "nickname": "新昵称" },
  "message": "资料更新成功"
}
```

---

#### `GET /api/user/settings`

获取用户阅读设置。

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "defaultSpeed": 1.0,
    "fontSize": "medium",
    "theme": "light",
    "ttsEnabled": false
  }
}
```

**设置字段说明**:
| 字段 | 类型 | 可选值 | 默认值 | 说明 |
|------|------|--------|--------|------|
| defaultSpeed | float | 0.5 - 3.0 | 1.0 | 默认阅读速度倍率 |
| fontSize | string | "small" / "medium" / "large" | "medium" | 字号 |
| theme | string | "light" / "dark" | "light" | 主题 |
| ttsEnabled | boolean | true / false | false | 语音朗读开关 |

---

#### `PUT /api/user/settings`

更新用户阅读设置 (支持部分更新)。

**请求体**:
```json
{
  "defaultSpeed": 1.5,
  "fontSize": "large",
  "theme": "dark",
  "ttsEnabled": true
}
```

**成功响应** (200):
```json
{ "success": true, "message": "设置更新成功" }
```

---

## 错误码说明

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 失效 |
| 404 | 资源不存在或无权限访问 |
| 500 | 服务器内部错误 |

## 前端路由

前端 SPA 路由定义 (react-router-dom)：

| 路径 | 页面 | 认证要求 |
|------|------|----------|
| `/login` | 登录页 | 无需认证 |
| `/register` | 注册页 | 无需认证 |
| `/` | 首页 (导入、继续阅读、最近导入) | 需要认证 |
| `/bookshelf` | 书架 (搜索、排序、管理) | 需要认证 |
| `/profile` | 个人中心 (资料、统计、退出) | 需要认证 |
| `/detail/:docId` | 文档详情 (统计、预览、书架操作) | 需要认证 |
| `/reader/:docId` | 阅读器 (逐句播放、速度控制、TTS) | 需要认证 |

# 前端应用

基于 React 19 + Vite + TailwindCSS 的移动端优先单页应用 (SPA)，运行在端口 5173。

## 结构

```
frontend/
├── index.html
├── vite.config.ts            # Vite 配置 (API 代理 + allowedHosts)
└── src/
    ├── main.tsx              # 应用入口 (BrowserRouter 挂载)
    ├── App.tsx               # 路由定义 + ProtectedRoute 认证保护
    ├── index.css             # 全局样式 + Tailwind @theme 变量 + CSS 动画
    ├── lib/
    │   ├── api.ts            # API 请求封装 (fetch + Bearer Token)
    │   └── utils.ts          # cn() 工具函数 + 日期格式化
    ├── types/
    │   └── index.ts          # 全部类型定义 (User, Document, BookshelfItem 等)
    ├── store/
    │   └── authStore.ts      # Zustand stores (useAuthStore + useAppStore)
    ├── components/
    │   ├── layout/
    │   │   ├── MainLayout.tsx   # 主布局 (Outlet + TabBar + Toast)
    │   │   ├── Header.tsx       # 通用页头 (标题 + 返回按钮)
    │   │   └── TabBar.tsx       # 底部 Tab 导航 (首页/书架/我的)
    │   └── ui/
    │       ├── button.tsx       # Button 组件 (变体: default/outline/ghost)
    │       ├── card.tsx         # Card 卡片容器
    │       ├── input.tsx        # Input 输入框
    │       ├── dialog.tsx       # Dialog 模态框
    │       ├── badge.tsx        # Badge 标签
    │       ├── toast.tsx        # Toast 消息 (全局 showToast)
    │       ├── empty-state.tsx  # EmptyState 空状态占位
    │       └── progress-bar.tsx # ProgressBar 进度条
    └── pages/
        ├── LoginPage.tsx        # 登录 (密码/验证码双模式)
        ├── RegisterPage.tsx     # 注册 (昵称+手机号+密码)
        ├── HomePage.tsx         # 首页 (导入/继续阅读/最近导入)
        ├── BookshelfPage.tsx    # 书架 (搜索/排序/移除)
        ├── DetailPage.tsx       # 文档详情 (统计/预览/书架操作)
        ├── ReaderPage.tsx       # 阅读器 (逐句/速度/TTS)
        └── ProfilePage.tsx      # 个人中心 (资料/统计/退出)
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `App.tsx` | 路由中心，定义 7 个路由，ProtectedRoute 认证保护，检查 localStorage token |
| `lib/api.ts` | API 封装层，`/api` 基地址，自动注入 `Authorization: Bearer <token>` |
| `store/authStore.ts` | 全局状态管理 (用户信息/认证态/当前 Tab/滑动方向) |
| `ReaderPage.tsx` | 核心阅读器，逐句高亮、自动翻句、TTS 语音、进度同步 |
| `index.css` | 主题系统，CSS 变量定义、暗色模式、页面切换动画 |
| `vite.config.ts` | 开发代理配置 (`/api` -> `localhost:3001`) |

## 依赖

**本模块依赖**:
- `react` + `react-dom` (19.0)
- `react-router-dom` (7.3) — 路由
- `zustand` (5.0) — 状态管理
- `@tailwindcss/vite` — TailwindCSS v4 集成
- 后端 API 服务 (端口 3001)

**依赖本模块的**:
- 无 (前端是终端消费层)

## 规范

### 文件命名
- 页面: `PascalCasePage.tsx`
- UI 组件: `kebab-case.tsx`
- 工具库: `camelCase.ts`

### 代码模式

**API 调用**:
```typescript
import { api } from '@/lib/api';
const response = await api.get('/documents/recent');
const data = await api.post('/documents/import', formData, true); // FormData
```

**Zustand Store**:
```typescript
import { useAuthStore } from '@/store/authStore';
const { user, isAuthenticated, login } = useAuthStore();
```

**UI 组件**:
```typescript
import { cn } from '@/lib/utils';
<button className={cn("base-class", variant === 'primary' && "primary-class")}>
```

### 样式约定
- 优先使用 TailwindCSS 工具类
- 自定义颜色通过 `index.css` 的 `@theme` 变量定义
- 暗色模式使用 `.dark` 类 + CSS 变量切换
- 移动端视口 `max-width: 480px`，居中显示

### 状态管理
- 全局状态: Zustand (auth, app)
- 页面状态: React `useState` + `useEffect`
- Token 持久化: `localStorage`

## 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/App.tsx` 添加路由
3. 公共页面 (无需认证) 放在 ProtectedRoute 外部
4. 带底部 Tab 的页面放在 MainLayout 的 Route 下
5. 独立页面直接放在 ProtectedRoute 下

## 添加新 UI 组件

1. 在 `src/components/ui/` 创建组件文件
2. 使用 `forwardRef` 支持 ref 转发
3. 使用 `cn()` 合并 className
4. 可选: 使用 `class-variance-authority` 定义组件变体

/**
 * 全局类型定义
 * 定义用户、文档、书架、认证等核心业务实体的 TypeScript 接口
 */

/** 用户基本信息 */
export interface User {
  id: string;
  phone: string;
  nickname: string;
  createdAt: string;
}

/** 用户完整资料（含统计和设置） */
export interface UserProfile extends User {
  bookshelfCount: number;
  totalReadSentences: number;
  settings: UserSettings | null;
}

/** 用户偏好设置 */
export interface UserSettings {
  /** 默认阅读速度倍率 */
  defaultSpeed: number;
  /** 字体大小标识 */
  fontSize: string;
  /** 主题：浅色/深色 */
  theme: 'light' | 'dark';
  /** 是否启用 TTS 语音朗读 */
  ttsEnabled: boolean;
}

/** 导入的文档（文章） */
export interface Document {
  id: string;
  userId: string;
  title: string;
  /** 文档格式，如 txt、pdf 等 */
  format: string;
  wordCount: number;
  /** 按句子切分后的数组 */
  sentences: Sentence[];
  content: string;
  importedAt: string;
}

/** 单个句子 */
export interface Sentence {
  /** 句子序号（从 0 开始） */
  index: number;
  text: string;
  /** 在原文本中的起始字符位置 */
  startChar: number;
  /** 在原文本中的结束字符位置 */
  endChar: number;
}

/** 书架中的条目 */
export interface BookshelfItem {
  id: string;
  docId: string;
  title: string;
  format: string;
  wordCount: number;
  /** 当前阅读到的句子索引 */
  currentSentence: number;
  /** 阅读进度（0~1） */
  progress: number;
  addedAt: string;
  lastReadAt: string;
  sentenceCount: number;
}

/** 文档摘要（列表展示用） */
export interface DocumentSummary {
  id: string;
  title: string;
  format: string;
  wordCount: number;
  importedAt: string;
  sentenceCount?: number;
}

/** 书架排序方式 */
export type SortBy = 'lastReadAt' | 'title' | 'addedAt';
/** 阅读速度倍率 */
export type SpeedOption = 0.75 | 1.0 | 1.25 | 1.5 | 2.0;
/** 底部 Tab 页面标识 */
export type TabPage = 'home' | 'bookshelf' | 'profile';

/** 登录/注册成功响应 */
export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  phone: string;
  nickname: string;
  createdAt: string;
}

export interface UserProfile extends User {
  bookshelfCount: number;
  totalReadSentences: number;
  settings: UserSettings | null;
}

export interface UserSettings {
  defaultSpeed: number;
  fontSize: string;
  theme: 'light' | 'dark';
  ttsEnabled: boolean;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  format: string;
  wordCount: number;
  sentences: Sentence[];
  content: string;
  importedAt: string;
}

export interface Sentence {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
}

export interface BookshelfItem {
  id: string;
  docId: string;
  title: string;
  format: string;
  wordCount: number;
  currentSentence: number;
  progress: number;
  addedAt: string;
  lastReadAt: string;
  sentenceCount: number;
}

export interface DocumentSummary {
  id: string;
  title: string;
  format: string;
  wordCount: number;
  importedAt: string;
  sentenceCount?: number;
}

export type SortBy = 'lastReadAt' | 'title' | 'addedAt';
export type SpeedOption = 0.75 | 1.0 | 1.25 | 1.5 | 2.0;
export type TabPage = 'home' | 'bookshelf' | 'profile';

export interface AuthResponse {
  user: User;
  token: string;
}

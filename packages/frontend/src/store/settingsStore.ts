/**
 * 用户偏好设置管理（Zustand + localStorage 持久化）
 * 管理字体大小、主题、语言、默认阅读速度和 TTS 开关等偏好项
 */

import { create } from 'zustand';
import { type SpeedOption } from '../lib/utils';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type Theme = 'light' | 'dark';
export type Language = 'zh-CN' | 'zh-TW' | 'en';

/** 设置状态接口 */
interface SettingsState {
  fontSize: FontSize;
  theme: Theme;
  language: Language;
  defaultSpeed: SpeedOption;
  ttsEnabled: boolean;
  setFontSize: (size: FontSize) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setDefaultSpeed: (speed: SpeedOption) => void;
  setTtsEnabled: (enabled: boolean) => void;
  /** 从 localStorage 加载已保存的设置 */
  load: () => void;
}

const STORAGE_KEY = 'article-reader-settings';

/** 从 localStorage 读取设置（解析失败时静默返回空对象） */
function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

/** 合并写入设置到 localStorage（写入失败时静默忽略） */
function saveToStorage(state: Partial<SettingsState>) {
  try {
    const existing = loadFromStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...state }));
  } catch {}
}

/** 默认设置值 */
const defaults = {
  fontSize: 'medium' as FontSize,
  theme: 'light' as Theme,
  language: 'zh-CN' as Language,
  defaultSpeed: 1.0 as SpeedOption,
  ttsEnabled: false,
};

/**
 * 设置 Store
 * 每次修改单项设置时自动同步到 localStorage
 * 应用启动时通过 load() 恢复用户上次保存的偏好
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,

  setFontSize: (fontSize) => {
    saveToStorage({ fontSize });
    set({ fontSize });
  },
  setTheme: (theme) => {
    saveToStorage({ theme });
    set({ theme });
  },
  setLanguage: (language) => {
    saveToStorage({ language });
    set({ language });
  },
  setDefaultSpeed: (defaultSpeed) => {
    saveToStorage({ defaultSpeed });
    set({ defaultSpeed });
  },
  setTtsEnabled: (ttsEnabled) => {
    saveToStorage({ ttsEnabled });
    set({ ttsEnabled });
  },
  load: () => {
    const stored = loadFromStorage();
    set({
      fontSize: stored.fontSize || defaults.fontSize,
      theme: stored.theme || defaults.theme,
      language: stored.language || defaults.language,
      defaultSpeed: stored.defaultSpeed || defaults.defaultSpeed,
      ttsEnabled: stored.ttsEnabled ?? defaults.ttsEnabled,
    });
  },
}));

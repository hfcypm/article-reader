import { create } from 'zustand';
import { type SpeedOption } from '../lib/utils';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type Theme = 'light' | 'dark';
export type Language = 'zh-CN' | 'zh-TW' | 'en';

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
  load: () => void;
}

const STORAGE_KEY = 'article-reader-settings';

function loadFromStorage(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveToStorage(state: Partial<SettingsState>) {
  try {
    const existing = loadFromStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...state }));
  } catch {}
}

const defaults = {
  fontSize: 'medium' as FontSize,
  theme: 'light' as Theme,
  language: 'zh-CN' as Language,
  defaultSpeed: 1.0 as SpeedOption,
  ttsEnabled: false,
};

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

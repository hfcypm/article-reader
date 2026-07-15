import { useSettingsStore, type Language } from '../store/settingsStore';

type TranslationMap = Record<string, Record<Language, string>>;

const translations: TranslationMap = {
  'app.name': {
    'zh-CN': '文章阅读',
    'zh-TW': '文章閱讀',
    'en': 'Article Reader',
  },
  'settings.title': {
    'zh-CN': '阅读设置',
    'zh-TW': '閱讀設置',
    'en': 'Reading Settings',
  },
  'settings.fontSize': {
    'zh-CN': '字体大小',
    'zh-TW': '字體大小',
    'en': 'Font Size',
  },
  'settings.theme': {
    'zh-CN': '主题颜色',
    'zh-TW': '主題顏色',
    'en': 'Theme',
  },
  'settings.language': {
    'zh-CN': '界面语言',
    'zh-TW': '界面語言',
    'en': 'Language',
  },
  'settings.speed': {
    'zh-CN': '默认播放速度',
    'zh-TW': '默認播放速度',
    'en': 'Default Speed',
  },
  'settings.tts': {
    'zh-CN': '默认开启朗读',
    'zh-TW': '默認開啟朗讀',
    'en': 'TTS by Default',
  },
  'settings.fontSize.small': {
    'zh-CN': '小',
    'zh-TW': '小',
    'en': 'Small',
  },
  'settings.fontSize.medium': {
    'zh-CN': '中',
    'zh-TW': '中',
    'en': 'Medium',
  },
  'settings.fontSize.large': {
    'zh-CN': '大',
    'zh-TW': '大',
    'en': 'Large',
  },
  'settings.fontSize.xlarge': {
    'zh-CN': '特大',
    'zh-TW': '特大',
    'en': 'X-Large',
  },
  'settings.theme.light': {
    'zh-CN': '浅色',
    'zh-TW': '淺色',
    'en': 'Light',
  },
  'settings.theme.dark': {
    'zh-CN': '深色',
    'zh-TW': '深色',
    'en': 'Dark',
  },
  'settings.language.zh-CN': {
    'zh-CN': '简体中文',
    'zh-TW': '簡體中文',
    'en': 'Simplified Chinese',
  },
  'settings.language.zh-TW': {
    'zh-CN': '繁体中文',
    'zh-TW': '繁體中文',
    'en': 'Traditional Chinese',
  },
  'settings.language.en': {
    'zh-CN': 'English',
    'zh-TW': 'English',
    'en': 'English',
  },
  'profile': {
    'zh-CN': '我的',
    'zh-TW': '我的',
    'en': 'Profile',
  },
  'profile.settings': {
    'zh-CN': '阅读设置',
    'zh-TW': '閱讀設置',
    'en': 'Reading Settings',
  },
  'profile.settings.desc': {
    'zh-CN': '倍速、字号、主题',
    'zh-TW': '倍速、字型、主題',
    'en': 'Speed, Font, Theme',
  },
  'profile.privacy': {
    'zh-CN': '隐私设置',
    'zh-TW': '隱私設置',
    'en': 'Privacy',
  },
  'profile.privacy.desc': {
    'zh-CN': '数据与权限管理',
    'zh-TW': '數據與權限管理',
    'en': 'Data & Permissions',
  },
  'profile.about': {
    'zh-CN': '关于',
    'zh-TW': '關於',
    'en': 'About',
  },
  'profile.about.desc': {
    'zh-CN': '版本 1.0.0',
    'zh-TW': '版本 1.0.0',
    'en': 'Version 1.0.0',
  },
  'profile.logout': {
    'zh-CN': '退出登录',
    'zh-TW': '退出登錄',
    'en': 'Logout',
  },
  'profile.bookshelf': {
    'zh-CN': '书架数量',
    'zh-TW': '書架數量',
    'en': 'Bookshelf',
  },
  'profile.sentences': {
    'zh-CN': '已读句数',
    'zh-TW': '已讀句數',
    'en': 'Sentences',
  },
  'profile.articles': {
    'zh-CN': '已读篇数',
    'zh-TW': '已讀篇數',
    'en': 'Articles',
  },
  'home.title': {
    'zh-CN': '首页',
    'zh-TW': '閱頁',
    'en': 'Home',
  },
  'home.import': {
    'zh-CN': '导入本地文档',
    'zh-TW': '導入本地文檔',
    'en': 'Import Document',
  },
  'home.import.hint': {
    'zh-CN': '支持 TXT / MOBI / PDF 格式，最大 50MB',
    'zh-TW': '支援 TXT / MOBI / PDF 格式，最大 50MB',
    'en': 'Supports TXT / MOBI / PDF, up to 50MB',
  },
  'home.continueReading': {
    'zh-CN': '继续阅读',
    'zh-TW': '繼續閱讀',
    'en': 'Continue Reading',
  },
  'home.recentImport': {
    'zh-CN': '最近导入',
    'zh-TW': '最近導入',
    'en': 'Recent Imports',
  },
  'home.noImports': {
    'zh-CN': '尚无导入记录',
    'zh-TW': '尚無導入記錄',
    'en': 'No imports yet',
  },
  'home.noImports.desc': {
    'zh-CN': '点击上方按钮导入你的第一篇文档',
    'zh-TW': '點擊上方按鈕導入你的第一篇文檔',
    'en': 'Tap the button above to import your first document',
  },
  'home.loading': {
    'zh-CN': '加载中...',
    'zh-TW': '加載中...',
    'en': 'Loading...',
  },
  'bookshelf': {
    'zh-CN': '书架',
    'zh-TW': '書架',
    'en': 'Bookshelf',
  },
  'bookshelf.loading': {
    'zh-CN': '加载中...',
    'zh-TW': '加載中...',
    'en': 'Loading...',
  },
  'bookshelf.search': {
    'zh-CN': '搜索书名...',
    'zh-TW': '搜索書名...',
    'en': 'Search books...',
  },
  'bookshelf.noResults': {
    'zh-CN': '暂无书籍',
    'zh-TW': '暫無書籍',
    'en': 'No books found',
  },
  'bookshelf.noResults.desc': {
    'zh-CN': '在详情页将文档加入书架',
    'zh-TW': '在詳情頁將文檔加入書架',
    'en': 'Add documents from the detail page',
  },
  'reader.sentence': {
    'zh-CN': '第 {current} 句',
    'zh-TW': '第 {current} 句',
    'en': 'Sentence {current}',
  },
  'reader.total': {
    'zh-CN': '共 {total} 句',
    'zh-TW': '共 {total} 句',
    'en': '{total} total',
  },
  'reader.speed': {
    'zh-CN': '播放速度',
    'zh-TW': '播放速度',
    'en': 'Speed',
  },
  'reader.tts': {
    'zh-CN': '朗读',
    'zh-TW': '朗讀',
    'en': 'TTS',
  },
  'reader.settings': {
    'zh-CN': '阅读设置',
    'zh-TW': '閱讀設置',
    'en': 'Settings',
  },
  'dialog.loading': {
    'zh-CN': '加载中...',
    'zh-TW': '加載中...',
    'en': 'Loading...',
  },
  'dialog.importing': {
    'zh-CN': '正在解析...',
    'zh-TW': '正在解析...',
    'en': 'Importing...',
  },
  'dialog.importSuccess': {
    'zh-CN': '导入完成',
    'zh-TW': '導入完成',
    'en': 'Import Complete',
  },
  'dialog.importFailed': {
    'zh-CN': '导入失败',
    'zh-TW': '導入失敗',
    'en': 'Import Failed',
  },
  'dialog.viewDetail': {
    'zh-CN': '查看详情',
    'zh-TW': '查看詳情',
    'en': 'View Details',
  },
  'dialog.retry': {
    'zh-CN': '重新导入',
    'zh-TW': '重新導入',
    'en': 'Retry',
  },
};

export function t(key: string, params?: Record<string, string | number>): string {
  const lang = useSettingsStore.getState().language;
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[lang] || entry['zh-CN'] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export { type Language };

import { create } from 'zustand';
import type { User, TabPage } from '../types';
import { api, setToken, removeToken, hasToken } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password?: string, code?: string) => Promise<void>;
  register: (phone: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (phone, password, code) => {
    const body: Record<string, string> = { phone };
    if (code) body.code = code;
    if (password) body.password = password;
    const res = await api.post<{ user: User; token: string }>('/auth/login', body);
    if (!res.success || !res.data) throw new Error(res.error || '登录失败');
    setToken(res.data.token);
    set({ user: res.data.user, isAuthenticated: true });
  },

  register: async (phone, password, nickname) => {
    const res = await api.post<{ user: User; token: string }>('/auth/register', { phone, password, nickname });
    if (!res.success || !res.data) throw new Error(res.error || '注册失败');
    setToken(res.data.token);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    removeToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    set({ isAuthenticated: hasToken(), isLoading: false });
  },
}));

interface AppState {
  activeTab: TabPage;
  setActiveTab: (tab: TabPage) => void;
  slideDirection: 'left' | 'right' | null;
  setSlideDirection: (dir: 'left' | 'right' | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  slideDirection: null,
  setSlideDirection: (dir) => set({ slideDirection: dir }),
}));

/**
 * 认证与应用状态管理（Zustand）
 * 提供登录、注册、登出等认证操作，以及底部 Tab 切换状态
 */

import { create } from 'zustand';
import type { User, TabPage } from '../types';
import { api, setToken, removeToken, hasToken } from '../lib/api';

/** 认证状态接口 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** 登录：支持密码或验证码两种方式 */
  login: (phone: string, password?: string, code?: string) => Promise<void>;
  /** 用户注册 */
  register: (phone: string, password: string, nickname: string) => Promise<void>;
  /** 登出 */
  logout: () => void;
  /** 检查本地 token 是否存在以恢复登录态 */
  checkAuth: () => void;
}

/**
 * 认证 Store
 * 管理用户登录状态、注册流程与 token 持久化
 */
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

/** 应用 Tab 状态接口 */
interface AppState {
  activeTab: TabPage;
  setActiveTab: (tab: TabPage) => void;
  /** Tab 页面切换的滑动方向，用于动画效果 */
  slideDirection: 'left' | 'right' | null;
  setSlideDirection: (dir: 'left' | 'right' | null) => void;
}

/**
 * 应用全局 UI 状态 Store
 * 管理底部 Tab 切换及页面过渡动画方向
 */
export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  slideDirection: null,
  setSlideDirection: (dir) => set({ slideDirection: dir }),
}));

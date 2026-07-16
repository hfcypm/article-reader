/**
 * 通用工具函数模块
 * 提供样式合并、日期格式化、文本截断、阅读速度与字号配置等辅助功能
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 类名合并工具
 * 将 clsx 和 tailwind-merge 组合，自动处理类名冲突与去重
 * @param inputs - 可变的 CSS 类名列表（支持条件类名）
 * @returns 合并去重后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日期格式化
 * 将日期字符串或 Date 对象格式化为中文短日期格式（如 "2024/01/15"）
 * @param date - 日期字符串或 Date 对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 文本截断
 * 超出最大长度时截断并追加省略号
 * @param text - 原始文本
 * @param maxLength - 最大字符数
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * 阅读进度百分比格式化
 * 将 0~1 的小数进度转换为百分数字符串
 * @param progress - 0~1 之间的进度值
 * @returns 百分比字符串，如 "75%"
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

/** 可选的阅读速度倍率列表 */
export const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0] as const;

/** 阅读速度倍率类型 */
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

/** 字体大小对应的 Tailwind CSS 类名映射 */
export const FONT_SIZES = {
  small: "text-base",
  medium: "text-lg",
  large: "text-xl",
  xlarge: "text-2xl",
} as const;

/**
 * 根据字号标识获取对应的 Tailwind CSS 类名
 * @param size - 字号标识（small/medium/large/xlarge）
 * @returns 对应的 Tailwind 类名，默认返回 medium
 */
export function getFontSizeClass(size: string): string {
  return FONT_SIZES[size as keyof typeof FONT_SIZES] || FONT_SIZES.medium;
}

/**
 * 根据文本长度和阅读速度计算展示时长
 * 基础时间为 1500ms，每个字符额外增加 150ms，再除以速度倍率
 * @param text - 文本内容
 * @param speed - 阅读速度倍率
 * @returns 推荐的展示时长（毫秒）
 */
export function getSentenceDuration(
  text: string,
  speed: number
): number {
  const baseTime = 1500;
  const charTime = 150;
  const duration = baseTime + text.length * charTime;
  return duration / speed;
}

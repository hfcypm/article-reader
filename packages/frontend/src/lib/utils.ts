import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

export const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0] as const;

export const FONT_SIZES = {
  small: "text-base",
  medium: "text-lg",
  large: "text-xl",
  xlarge: "text-2xl",
} as const;

export function getFontSizeClass(size: string): string {
  return FONT_SIZES[size as keyof typeof FONT_SIZES] || FONT_SIZES.medium;
}

export function getSentenceDuration(
  text: string,
  speed: number
): number {
  const baseTime = 1500;
  const charTime = 150;
  const duration = baseTime + text.length * charTime;
  return duration / speed;
}

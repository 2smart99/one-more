export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp as TelegramWebApp | undefined ?? null;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready(): void;
  expand(): void;
  close(): void;
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    setText(text: string): void;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(fn: () => void): void;
    offClick(fn: () => void): void;
  };
}

export function haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error') {
  const twa = getTelegramWebApp();
  if (!twa) return;
  if (type === 'success') twa.HapticFeedback.notificationOccurred('success');
  else if (type === 'error') twa.HapticFeedback.notificationOccurred('error');
  else twa.HapticFeedback.impactOccurred(type);
}

export function brzycki1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function totalVolume(sets: { weight: number; reps: number; completed: boolean }[]): number {
  return sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weight * s.reps, 0);
}

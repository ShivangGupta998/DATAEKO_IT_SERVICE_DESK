import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'bottom-right' | 'top-right';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
    position?: ToastPosition
  ) => void;
  success: (title: string, message?: string, position?: ToastPosition) => void;
  error: (title: string, message?: string, position?: ToastPosition) => void;
  warning: (title: string, message?: string, position?: ToastPosition) => void;
  info: (title: string, message?: string, position?: ToastPosition) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

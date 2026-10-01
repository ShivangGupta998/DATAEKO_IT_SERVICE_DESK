import { useContext } from 'react';
import {
  ToastContext,
  ToastContextType,
  Toast,
  ToastType,
  ToastPosition,
} from '../context/toastContextDef';

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export type { Toast, ToastType, ToastPosition, ToastContextType };

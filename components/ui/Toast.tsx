"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50';
      default:
        return 'bg-gray-800 text-white shadow-lg';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <FaCheckCircle className="text-2xl flex-shrink-0" />;
      case 'error':
        return <FaExclamationTriangle className="text-2xl flex-shrink-0" />;
      case 'warning':
        return <FaExclamationTriangle className="text-2xl flex-shrink-0" />;
      case 'info':
        return <FaInfoCircle className="text-2xl flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        rounded-lg p-4 max-w-sm w-full
        flex items-center gap-3
        animate-slide-in-right pointer-events-auto
        backdrop-blur-sm
      `}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-white hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
        aria-label="Close notification"
      >
        <FaTimes className="text-lg" />
      </button>
    </div>
  );
}

// Add animation styles to globals.css
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }

'use client';

import { useEffect, useState } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const Toast = () => {
    if (!toast.visible) return null;
    return (
      <div className="fixed top-6 left-4 right-4 z-[100] animate-slide-down">
        <div
          className={`px-4 py-3 rounded-2xl text-sm font-semibold text-center backdrop-blur-xl border ${
            toast.type === 'success'
              ? 'bg-success/20 text-success border-success/30'
              : 'bg-danger/20 text-danger border-danger/30'
          }`}
        >
          {toast.message}
        </div>
      </div>
    );
  };

  return { showToast, Toast };
}

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const borderColor = isSuccess ? '#10b981' : isError ? '#ef4444' : '#C9A56A';
          const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;
          const iconColor = isSuccess ? '#10b981' : isError ? '#ef4444' : '#C9A56A';

          return (
            <div
              key={toast.id}
              className="animate-fade-in card-shadow"
              style={{
                pointerEvents: 'all',
                background: '#ffffff',
                border: '1px solid rgba(10,31,68,0.08)',
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: 12,
                padding: '12px 16px',
                minWidth: 300,
                maxWidth: 420,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                boxShadow: '0 8px 30px rgba(10,31,68,0.12)'
              }}
            >
              <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0A1F44', marginBottom: 2 }}>
                  {toast.title}
                </div>
                {toast.message && (
                  <div style={{ fontSize: 12, color: 'rgba(10,31,68,0.65)', lineHeight: 1.45 }}>
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(10,31,68,0.3)',
                  padding: 2,
                  display: 'flex'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (title, msg) => console.log(`[Toast] ${title}: ${msg}`) };
  }
  return context;
}

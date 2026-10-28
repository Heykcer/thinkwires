import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import '../components/common/errorBoundary.css';

const GlobalErrorContext = createContext(null);

export const useGlobalError = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
};

let toastCounter = 0;

export const GlobalErrorProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'error', title, message, duration = 6000 }) => {
      const id = `tw_toast_${Date.now()}_${++toastCounter}`;
      const newToast = {
        id,
        type,
        title: title || (type === 'error' ? 'Error Notice' : type === 'warning' ? 'System Advisory' : 'Notification'),
        message: typeof message === 'string' ? message : message?.message || 'An unexpected condition was reported.',
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration && duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const showError = useCallback(
    (message, title = 'Operation Failed') => {
      return addToast({ type: 'error', title, message, duration: 7000 });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message, title = 'Advisory Notice') => {
      return addToast({ type: 'warning', title, message, duration: 6000 });
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message, title = 'Success') => {
      return addToast({ type: 'success', title, message, duration: 5000 });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (message, title = 'Information') => {
      return addToast({ type: 'info', title, message, duration: 5000 });
    },
    [addToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Global browser listeners for uncaught async errors & unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      // Don't show redundant alerts for canceled browser requests or react-router redirects
      if (
        event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('aborted') ||
        event.reason?.message?.includes('canceled')
      ) {
        return;
      }

      console.error('[GlobalErrorContext] Unhandled Promise Rejection:', event.reason);

      const message =
        event.reason?.message ||
        (typeof event.reason === 'string' ? event.reason : 'An asynchronous task encountered an unhandled error.');

      // Check if it's a known network connection failure
      const isNetworkError =
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('ECONNREFUSED');

      showError(
        isNetworkError
          ? 'Network connectivity lost or server temporarily unavailable. Please verify your connection.'
          : message,
        isNetworkError ? 'Network Disruption' : 'Background Task Error'
      );
    };

    const handleWindowError = (event) => {
      // Ignore routine browser script cross-origin noise or resize observer loops
      if (
        event.message?.includes('ResizeObserver loop') ||
        event.message?.includes('Script error.')
      ) {
        return;
      }

      console.error('[GlobalErrorContext] Uncaught Global Window Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Avoid showing toast if it originated inside React component rendering (caught by ErrorBoundary)
      if (event.error?.name === 'ChunkLoadError' || event.message?.includes('Loading chunk')) {
        showWarning(
          'A new version of Thinkwires has been deployed. Please reload the page to load updated assets.',
          'Asset Version Update'
        );
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, [showError, showWarning]);

  const value = {
    showError,
    showWarning,
    showSuccess,
    showInfo,
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <GlobalErrorContext.Provider value={value}>
      {children}
      {/* Toast Render Stack */}
      {toasts.length > 0 && (
        <div className="tw-global-toast-container" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`tw-global-toast tw-global-toast-${toast.type}`}
              role="alert"
            >
              <div className="tw-toast-icon">
                {toast.type === 'error' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {toast.type === 'success' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              <div className="tw-toast-body">
                <div className="tw-toast-title">{toast.title}</div>
                <p className="tw-toast-message">{toast.message}</p>
              </div>

              <button
                type="button"
                className="tw-toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </GlobalErrorContext.Provider>
  );
};

export default GlobalErrorContext;

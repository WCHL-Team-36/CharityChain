import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const [animatingToasts, setAnimatingToasts] = useState<Set<string>>(new Set());

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};

    toasts.forEach((toast) => {
      if (!timers[toast.id] && !animatingToasts.has(toast.id)) {
        timers[toast.id] = setTimeout(() => {
          handleRemoveToast(toast.id);
        }, 5000);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [toasts]);

  const handleRemoveToast = (id: string) => {
    setAnimatingToasts(prev => new Set(prev).add(id));
    setTimeout(() => {
      removeToast(id);
      setAnimatingToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 250); // Match exit animation duration
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full sm:max-w-md md:max-w-lg lg:max-w-sm px-4 sm:px-0">
      {toasts.map((toast) => {
        const isExiting = animatingToasts.has(toast.id);
        return (
          <div
            key={toast.id}
            className={`
              w-full bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
              ${isExiting ? 'toast-exit' : 'toast-enter'}
              transition-all duration-200 hover:shadow-2xl transform-gpu
              ${toast.type === 'success' ? 'border-l-4 border-green-500' :
                toast.type === 'error' ? 'border-l-4 border-red-500' :
                toast.type === 'warning' ? 'border-l-4 border-yellow-500' :
                'border-l-4 border-blue-500'
              }
            `}
            style={{
              maxWidth: '100vw',
              width: 'min(350px, calc(100vw - 2rem))'
            }}
            role="alert"
            aria-live="polite"
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'error' && (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'warning' && (
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    </div>
                  )}
                  {toast.type === 'info' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-tight break-words">
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed break-words">
                      {toast.message}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 p-1"
                    onClick={() => handleRemoveToast(toast.id)}
                    aria-label="Close notification"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            <div className="h-1 bg-gray-100">
              <div 
                className={`h-1 toast-progress ${
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { ToastContainer };

import React, { useEffect, useState } from 'react';
import { IconCheck, IconWarning, IconError, IconInfo, IconClose } from '../icons/IconLibrary';

export interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onClose?: () => void;
  persistent?: boolean;
  autoFadeMs?: number;
  linkHref?: string;
  linkLabel?: string;
}

export const Toast = ({
  message,
  type = 'info',
  onClose,
  persistent = false,
  autoFadeMs = 4000,
  linkHref,
  linkLabel,
}: ToastProps) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const shouldPersist = persistent || type === 'error';

  useEffect(() => {
    if (shouldPersist) return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 250);
    }, autoFadeMs);
    return () => clearTimeout(timer);
  }, [shouldPersist, autoFadeMs, onClose]);

  if (!visible) return null;

  const icons = {
    success: <IconCheck size={18} />,
    warning: <IconWarning size={18} />,
    error: <IconError size={18} />,
    info: <IconInfo size={18} />,
  };

  const styles = {
    success: 'bg-[var(--color-accent-success)]/10 border-[var(--color-accent-success)] text-[var(--color-accent-success)]',
    warning: 'bg-[var(--color-accent-warning)]/10 border-[var(--color-accent-warning)] text-[var(--color-accent-warning)]',
    error: 'bg-[var(--color-accent-danger)]/10 border-[var(--color-accent-danger)] text-[var(--color-accent-danger)]',
    info: 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]',
  };

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        rounded-[var(--radius-md)]
        border
        shadow-[var(--shadow-overlay)]
        ${styles[type]}
        transition-all duration-200
        ${linkHref ? 'cursor-pointer hover:brightness-110 active:brightness-95' : ''}
      `}
      style={{
        animation: exiting ? 'toastOut 200ms ease-in forwards' : 'toastIn 200ms ease-out',
      }}
      onClick={linkHref ? () => window.open(linkHref, '_blank') : undefined}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)]">
          {message}
        </p>
        {linkLabel && (
          <span className="text-xs text-[var(--color-text-accent)] underline mt-0.5 inline-block">
            {linkLabel}
          </span>
        )}
      </div>
      {(onClose || shouldPersist) && (
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Dismiss"
        >
          <IconClose size={16} />
        </button>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
};

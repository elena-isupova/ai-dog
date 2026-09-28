import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hideCloseButton?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = 'md',
  hideCloseButton = false 
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    setTimeout(() => {
      const focusable = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  const trapFocus = (e: KeyboardEvent) => {
    const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-[340px]',
    md: 'max-w-[420px]',
    lg: 'max-w-[560px]',
  };

  return createPortal(
    <Fragment>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-[var(--overlay-heavy)] animate-fade-in"
        style={{ zIndex: 'var(--z-modal)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={clsx(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-5',
          'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)]',
          'shadow-[var(--shadow-modal)] animate-modal-enter',
          sizes[size]
        )}
        style={{ zIndex: 'calc(var(--z-modal) + 1)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        onClick={e => e.stopPropagation()}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
            <div>
              {title && (
                <h2 id="modal-title" className="text-h3 text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-body-sm text-[var(--text-secondary)] mt-1.5">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="touch-target text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-md)]"
                aria-label="Close"
              >
                <X size={22} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        <div className="p-5">
          {children}
        </div>
      </div>
    </Fragment>,
    document.body
  );
}

// Bottom Sheet
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  hideHandle?: boolean;
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  hideHandle = false 
}: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    previousActiveElement.current = document.activeElement as HTMLElement;
    
    setTimeout(() => {
      const focusable = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <Fragment>
      <div
        className="fixed inset-0 bg-[var(--overlay-scrim)] animate-fade-in"
        style={{ zIndex: 'var(--z-sheet)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={clsx(
          'fixed bottom-0 left-0 right-0',
          'bg-[var(--bg-elevated)] border-t border-[var(--border)]',
          'rounded-t-[var(--radius-xl)] rounded-tr-[var(--radius-xl)]',
          'shadow-[var(--shadow-sheet)] animate-slide-up',
          'max-h-[85vh] flex flex-col'
        )}
        style={{ zIndex: 'var(--z-sheet)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        onClick={e => e.stopPropagation()}
      >
        {!hideHandle && (
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-elevated)] z-10">
            <h2 id="sheet-title" className="text-h3 text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="touch-target text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-md)]"
              aria-label="Close"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {children}
        </div>
      </div>
    </Fragment>,
    document.body
  );
}

// Toast
interface ToastProps {
  message: string;
  type?: 'default' | 'success' | 'warning' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'default', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const types = {
    default: 'bg-[var(--text-primary)] text-[var(--text-inverse)]',
    success: 'bg-[var(--success)] text-[var(--text-inverse)]',
    warning: 'bg-[var(--warning)] text-[var(--text-inverse)]',
    error: 'bg-[var(--distress)] text-[var(--text-inverse)]',
  };

  return createPortal(
    <div
      className={clsx(
        'fixed bottom-28 left-1/2 -translate-x-1/2',
        'px-5 py-3.5 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]',
        'animate-toast-enter',
        types[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <p className="text-body">{message}</p>
        <button
          onClick={onClose}
          className="touch-target-sm opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>,
    document.body
  );
}

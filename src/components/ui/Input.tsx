import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-caption text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full h-[52px] px-4',
            'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
            error
              ? 'border-[var(--distress)] focus:border-[var(--distress)] focus:ring-[var(--distress-subtle)]'
              : 'hover:border-[var(--border-strong)]',
            props.disabled && 'opacity-40 cursor-not-allowed'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={clsx(errorId, helperId)}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-body-sm text-[var(--distress)]" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-body-sm text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label htmlFor={inputId} className="block text-caption text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full min-h-[120px] px-4 py-3 resize-y',
            'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
            'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
            error
              ? 'border-[var(--distress)] focus:border-[var(--distress)] focus:ring-[var(--distress-subtle)]'
              : 'hover:border-[var(--border-strong)]',
            props.disabled && 'opacity-40 cursor-not-allowed'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={clsx(errorId, helperId)}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-body-sm text-[var(--distress)]" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-body-sm text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label htmlFor={selectId} className="block text-caption text-[var(--text-secondary)] mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full h-[56px] px-5 pr-12 appearance-none',
            'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)]',
            'text-[var(--text-primary)]',
            'transition-all duration-[var(--duration-fast)]',
            'focus:outline-none focus:ring-3 focus:ring-[var(--focus-ring)]',
            error
              ? 'border-[var(--distress)] focus:border-[var(--distress)] focus:ring-[var(--distress-subtle)]'
              : 'hover:border-[var(--border-strong)] focus:border-[var(--accent)]',
            props.disabled && 'opacity-40 cursor-not-allowed'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={clsx(errorId, helperId)}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-2 text-body-sm text-[var(--distress)]" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-body-sm text-[var(--text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
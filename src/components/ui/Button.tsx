import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'fab';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'default', 
    isLoading = false, 
    children, 
    className = '', 
    disabled, 
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-fast)] ease-out
      focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]
      disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98] active:transition-[transform_80ms_linear]
      select-none
    `;

    const variants = {
      primary: `
        bg-[var(--text-primary)] text-[var(--text-inverse)] border border-[var(--text-primary)]
        hover:bg-[var(--text-primary)] active:bg-[var(--text-primary)]
        shadow-[0_8px_24px_rgba(26,24,22,0.12)]
      `,
      secondary: `
        bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]
        hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]
        active:bg-[var(--bg-subtle)]
      `,
      ghost: `
        bg-transparent text-[var(--text-secondary)] border border-transparent
        hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]
        active:bg-[var(--border)]
      `,
      destructive: `
        bg-[var(--distress)] text-[var(--text-inverse)] border border-[var(--distress)]
        hover:opacity-95 active:opacity-90
        shadow-[0_8px_24px_rgba(168,92,74,0.14)]
      `,
    };

    const sizes = {
      default: `h-[52px] px-5 text-body-sm`,
      sm: `h-[42px] px-4 text-body-sm`,
      lg: `h-[56px] px-6 text-body`,
      icon: `w-[52px] h-[52px] p-0`,
      fab: `w-[64px] h-[64px] rounded-full p-0 shadow-[var(--shadow-lg)]`,
    };

    const radius = size === 'fab' ? 'rounded-full' : 'rounded-[var(--radius-md)]';

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          radius,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="3" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
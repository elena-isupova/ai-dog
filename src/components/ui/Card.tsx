import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'default' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    padding = 'default', 
    children, 
    className = '', 
    ...props 
  }, ref) => {
    const variants = {
      default: `
        bg-[var(--bg-elevated)] border border-[var(--border)]
        rounded-[var(--radius-lg)]
      `,
      elevated: `
        bg-[var(--bg-elevated)]
        rounded-[var(--radius-lg)]
        shadow-[var(--shadow-sm)]
      `,
      outlined: `
        bg-[var(--bg-elevated)] border border-[var(--border)]
        rounded-[var(--radius-lg)]
      `,
    };

    const paddings = {
      none: '',
      default: 'p-[var(--space-inset)]',
      lg: 'p-[var(--space-inset-lg)]',
    };

    return (
      <div
        ref={ref}
        className={clsx(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={clsx('text-h3 text-[var(--text-primary)]', className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={clsx('text-body-sm text-[var(--text-secondary)] mt-1', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={clsx('', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={clsx('mt-6 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
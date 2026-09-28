import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode, useState } from 'react';
import { clsx } from 'clsx';

type ChipVariant = 'default' | 'success' | 'warning' | 'distress' | 'neutral';
type ChipSize = 'default' | 'sm';

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  variant?: ChipVariant;
  size?: ChipSize;
  selected?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect?: (selected: boolean) => void;
  children: ReactNode;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({
    variant = 'neutral',
    size = 'default',
    selected = false,
    onSelect,
    children,
    className = '',
    disabled,
    onClick,
    ...props
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-[var(--duration-fast)] ease-out
      rounded-[var(--radius-md)] border
      focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]
      disabled:opacity-40 disabled:cursor-not-allowed
      active:scale-[0.98] active:transition-[transform_80ms_linear]
    `;

    const variants = {
      default: {
        base: `
          bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]
          hover:bg-[var(--border)] hover:text-[var(--text-primary)]
        `,
        selected: `
          bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]
        `,
      },
      success: {
        base: `
          bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success-muted)]
          hover:bg-[var(--success-muted)] hover:text-[var(--success)]
        `,
        selected: `
          bg-[var(--success)] text-[var(--text-inverse)] border-[var(--success)]
        `,
      },
      warning: {
        base: `
          bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning-muted)]
          hover:bg-[var(--warning-muted)] hover:text-[var(--warning)]
        `,
        selected: `
          bg-[var(--warning)] text-[var(--text-inverse)] border-[var(--warning)]
        `,
      },
      distress: {
        base: `
          bg-[var(--distress-subtle)] text-[var(--distress)] border-[var(--distress-muted)]
          hover:bg-[var(--distress-muted)] hover:text-[var(--distress)]
        `,
        selected: `
          bg-[var(--distress)] text-[var(--text-inverse)] border-[var(--distress)]
          animate-[distress-pulse_1s_ease-out]
        `,
      },
      neutral: {
        base: `
          bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]
          hover:bg-[var(--border)] hover:text-[var(--text-primary)]
        `,
        selected: `
          bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]
        `,
      },
    };

    const sizes = {
      default: 'px-3.5 py-2 text-body-sm',
      sm: 'px-3 py-1.5 text-body-sm',
    };

    const isRadio = variant === 'distress' && selected;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (isRadio && selected) return;
      const newSelected = isRadio ? true : !selected;
      onSelect?.(newSelected);
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={clsx(
          baseStyles,
          variants[variant].base,
          selected && variants[variant].selected,
          sizes[size],
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={selected}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Chip.displayName = 'Chip';

export function useChipGroup<T extends string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = (value: T) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const isSelected = (value: T) => selected.has(value);

  return { selected, toggle, isSelected, setSelected };
}
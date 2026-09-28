import { ChangeEvent, forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  onChange?: (value: boolean) => void;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className = '', id, checked, onChange, ...props }, ref) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked);
    };

    return (
      <div className={clsx('flex items-start gap-4', className)}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            checked={checked}
            onChange={handleChange}
            className="peer h-7 w-[52px] appearance-none bg-[var(--border)] rounded-full transition-colors duration-[var(--duration-base)]
              checked:bg-[var(--accent)]
              focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2
              disabled:opacity-40 disabled:cursor-not-allowed"
            {...props}
          />
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-5 bg-[var(--text-inverse)] rounded-full shadow-[var(--shadow-sm)]
            transition-transform duration-[var(--duration-base)]
            peer-checked:translate-x-6
            peer-hover:scale-105" />
        </div>
        {(label || description) && (
          <div className="pt-1.5">
            {label && (
              <label htmlFor={toggleId} className="text-body text-[var(--text-primary)] cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-body-sm text-[var(--text-muted)] mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

// Segmented Control
interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl({ options, value, onChange, className = '', disabled }: SegmentedControlProps) {
  return (
    <div 
      className={clsx(
        'flex bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-lg)] p-1',
        className
      )}
      role="radiogroup"
      aria-disabled={disabled}
    >
      {options.map(({ value: optionValue, label }) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={value === optionValue}
          onClick={() => !disabled && onChange(optionValue)}
          disabled={disabled}
          className={clsx(
            'flex-1 px-5 py-2.5 text-body-sm font-medium rounded-[var(--radius-md)]',
            'transition-all duration-[var(--duration-fast)]',
            value === optionValue
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            disabled && 'opacity-40 cursor-not-allowed'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

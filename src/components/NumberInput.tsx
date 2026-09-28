import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  /** When true, clearing the field yields undefined (shown as the placeholder, e.g. "Livre"). */
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  /** Field background: 'raised' on cards, 'sunken' inside modals with a lighter surface. */
  surface?: 'raised' | 'sunken';
  'aria-label'?: string;
}

// Rounds to the step's precision so 0.1 + 0.2 shows as 0.3
const roundToStep = (value: number, step: number) => {
  const decimals = (String(step).split('.')[1] || '').length;
  return Number(value.toFixed(decimals));
};

/**
 * Numeric field with − / + buttons in the app's style, replacing the browser's spinner arrows.
 * The field stays editable by typing, with the numeric keyboard on mobile.
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  allowEmpty = false,
  placeholder,
  className = '',
  surface = 'raised',
  'aria-label': ariaLabel,
}) => {
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

  const bump = (direction: 1 | -1) => {
    if (value === undefined) {
      // Empty ("Livre"): "+" starts at the minimum, or at one step when the minimum is 0
      if (direction === 1) onChange(clamp(min && min > 0 ? min : step));
      return;
    }
    onChange(clamp(roundToStep(value + direction * step, step)));
  };

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    if (raw === '') {
      onChange(allowEmpty ? undefined : min ?? 0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  const atMin = value !== undefined && min !== undefined && value <= min;
  const atMax = value !== undefined && max !== undefined && value >= max;
  const buttonClass =
    'flex w-9 sm:w-7 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-emerald-400 active:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-400';

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border border-neutral-700 focus-within:border-emerald-500 ${
        surface === 'sunken' ? 'bg-neutral-950' : 'bg-neutral-900'
      } ${className}`}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={() => bump(-1)}
        disabled={atMin || value === undefined}
        className={buttonClass}
        aria-label="Diminuir"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode={Number.isInteger(step) ? 'numeric' : 'decimal'}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={handleType}
        onBlur={() => value !== undefined && onChange(clamp(value))}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 sm:py-2 text-center font-mono tabular-nums text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => bump(1)}
        disabled={atMax}
        className={buttonClass}
        aria-label="Aumentar"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

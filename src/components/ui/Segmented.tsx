import { useId } from 'react';

import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A small two-or-three-way switch, as a radio group so arrow keys move
 * between the options and the choice is announced.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const name = useId();

  return (
    <fieldset className="flex gap-0.5 rounded-lg border border-hairline bg-surface/60 p-0.5">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              'cursor-pointer rounded-md px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-wide transition has-focus-visible:outline-2 has-focus-visible:outline-brand',
              checked
                ? 'bg-card text-brand shadow-sm shadow-black/30'
                : 'text-ink-dim hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => {
                onChange(option.value);
              }}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}

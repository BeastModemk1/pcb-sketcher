'use client'

import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const inputClass =
  'h-8 w-full min-w-0 rounded-md border border-input bg-input/30 px-2 font-mono text-xs text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'

export function NumberField({
  label,
  value,
  onCommit,
  step = 0.1,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  onCommit: (value: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
}) {
  const id = useId()
  const commit = (raw: string) => {
    const n = Number.parseFloat(raw)
    if (Number.isNaN(n)) return
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
    if (clamped !== value) onCommit(clamped)
  }
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          key={value}
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          defaultValue={Number(value.toFixed(3))}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value)
          }}
          className={cn(inputClass, suffix && 'pr-8')}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-md border border-input bg-input/20 p-0.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-7 flex-1 rounded-[5px] px-1.5 font-mono text-[11px] transition-colors',
              o.value === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{children}</h3>
}

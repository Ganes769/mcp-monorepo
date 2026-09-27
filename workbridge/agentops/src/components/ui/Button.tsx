import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'success' | 'accent'
type Size = 'xs' | 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary: 'bg-slate-950 text-white shadow-sm hover:bg-slate-800 active:bg-slate-900',
  accent: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800',
  secondary: 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'border border-slate-200 bg-white text-red-600 shadow-sm hover:border-red-200 hover:bg-red-50',
  destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 gap-1.5 rounded-lg px-2.5 text-xs',
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-9 gap-2 rounded-xl px-3.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
})

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function IconButton({ className, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900',
          className,
        )}
        {...props}
      />
    )
  },
)

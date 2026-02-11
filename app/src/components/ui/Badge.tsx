import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accept' | 'reject' | 'info' | 'warning' | 'default'
  color?: string
  className?: string
}

const variantStyles = {
  accept: 'bg-green-50 text-green-700 border-green-200',
  reject: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  default: 'bg-gray-50 text-gray-700 border-gray-200',
}

export function Badge({ children, variant = 'default', color, className }: BadgeProps) {
  if (color) {
    return (
      <span
        className={cn('inline-block px-2 py-0.5 rounded text-xs font-bold border', className)}
        style={{ color, backgroundColor: color + '15', borderColor: color + '30' }}
      >
        {children}
      </span>
    )
  }

  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-bold border', variantStyles[variant], className)}>
      {children}
    </span>
  )
}

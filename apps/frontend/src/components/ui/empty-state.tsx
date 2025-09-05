import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TProps = {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  align?: 'center' | 'left'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  actions,
  align = 'center',
  size = 'md',
  className,
}: TProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'
  const spacing = size === 'sm' ? 'py-6 gap-2' : size === 'lg' ? 'py-16 gap-4' : 'py-10 gap-3'
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg'
  const descriptionSize = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <div className={cn('flex flex-col', alignment, spacing, className)}>
      {icon ? <div className="mb-1 text-muted-foreground">{icon}</div> : null}
      <h3 className={cn('font-medium text-foreground', titleSize)}>{title}</h3>
      {description ? (
        <p className={cn('text-muted-foreground', descriptionSize)}>{description}</p>
      ) : null}
      {actions ? <div className={cn(align === 'center' ? 'mt-2' : 'mt-3')}>{actions}</div> : null}
    </div>
  )
}


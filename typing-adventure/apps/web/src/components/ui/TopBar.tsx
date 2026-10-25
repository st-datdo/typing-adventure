import Link from 'next/link'
import type { ReactNode } from 'react'

type BackAction =
  | { href: string; onClick?: never; label: string; icon?: string }
  | { onClick: () => void; href?: never; label: string; icon?: string }

interface TopBarProps {
  title?: ReactNode
  subtitle?: ReactNode
  back?: BackAction
  start?: ReactNode
  end?: ReactNode
}

export function TopBar({ title, subtitle, back, start, end }: TopBarProps) {
  const icon = back?.icon ?? (back?.href === '/' ? '🏠' : '⬅️')
  return (
    <header className="ui-topbar">
      <div className="ui-topbar-start">
        {back && back.href !== undefined && (
          <Link href={back.href} className="ui-chip" aria-label={back.label} title={back.label}>
            {icon}
          </Link>
        )}
        {back && back.onClick && (
          <button type="button" className="ui-chip" aria-label={back.label} title={back.label} onClick={back.onClick}>
            {icon}
          </button>
        )}
        {start}
      </div>
      {title ? (
        <h1 className="ui-topbar-title">
          {title}
          {subtitle && <span className="ui-topbar-sub">{subtitle}</span>}
        </h1>
      ) : (
        <span />
      )}
      <div className="ui-topbar-end">{end}</div>
    </header>
  )
}

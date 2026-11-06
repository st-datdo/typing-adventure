import { ICONS, type IconDef, type IconName } from './icons'

interface IconProps {
  name: IconName
  size?: number
  title?: string
  className?: string
}

export function Icon({ name, size = 24, title, className }: IconProps) {
  const def: IconDef = ICONS[name]
  const a11y = title ? { role: 'img' as const } : { 'aria-hidden': true as const }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      focusable="false"
      data-icon={name}
      className={className ? `kr-icon ${className}` : 'kr-icon'}
      fill={def.fill ? 'currentColor' : 'none'}
      stroke={def.fill ? 'none' : 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {title && <title>{title}</title>}
      {def.d.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

interface LoadingScreenProps {
  icon?: string
  label?: string
  inline?: boolean
}

export function LoadingScreen({ icon = '🦉', label, inline = false }: LoadingScreenProps) {
  return (
    <div className={inline ? 'ui-loading ui-loading--inline' : 'ui-loading'} role="status" aria-live="polite">
      <span className="ui-loading-icon" aria-hidden>{icon}</span>
      {label && <span>{label}</span>}
    </div>
  )
}

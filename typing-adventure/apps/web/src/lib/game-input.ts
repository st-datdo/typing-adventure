export interface SpaceCaptureInput {
  key: string
  panelOpen: boolean
  navOpen: boolean
  isFinished: boolean
  targetInSideNav: boolean
}

export function shouldCaptureSpace({
  key,
  panelOpen,
  navOpen,
  isFinished,
  targetInSideNav,
}: SpaceCaptureInput): boolean {
  if (key !== ' ') return false
  if (panelOpen || navOpen || isFinished || targetInSideNav) return false
  return true
}

type SceneVariant = 'game' | 'picker' | 'hub'

export function SceneBackdrop({ variant }: { variant: SceneVariant }) {
  return (
    <>
      <div aria-hidden="true" className={`kr-scene kr-scene--${variant} kr-scene--top kr-loop`} />
      <div aria-hidden="true" className={`kr-scene kr-scene--${variant} kr-scene--bottom`} />
    </>
  )
}

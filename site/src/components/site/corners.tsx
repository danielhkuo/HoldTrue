/** Four thin corner brackets, inset from the edges of a relatively positioned parent. */
export function Corners({ inset = "1.5rem" }: { inset?: string }) {
  const base = "absolute w-3 h-3 border-white/20 pointer-events-none"
  return (
    <>
      <div className={`${base} border-t border-l`} style={{ top: inset, left: inset }} />
      <div className={`${base} border-t border-r`} style={{ top: inset, right: inset }} />
      <div className={`${base} border-b border-l`} style={{ bottom: inset, left: inset }} />
      <div className={`${base} border-b border-r`} style={{ bottom: inset, right: inset }} />
    </>
  )
}

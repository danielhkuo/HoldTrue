import { useEffect, useRef, useState } from "react"
import { Reveal } from "@/components/site/reveal"

const TARGET = 0.178

/** Counts from 0 to the target once the number scrolls into view. */
function useCountUp(target: number, duration = 1800) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        if (reduced) {
          setValue(target)
          return
        }
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 4)
          setValue(target * eased)
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [target, duration])

  return { ref, value }
}

export function Figure() {
  const { ref, value } = useCountUp(TARGET)

  return (
    <section className="relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden bg-ink px-6 py-32 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(96,165,250,0.08),transparent_60%)]" />

      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.35em] text-white/40 uppercase">
          How well you know what you don't
        </p>
      </Reveal>

      <Reveal delay={200} className="mt-10">
        <span
          ref={ref}
          className="font-mono text-[clamp(5rem,20vw,16rem)] leading-none font-light tracking-tighter text-white tabular-nums"
        >
          {value.toFixed(3).replace(/^0/, "")}
        </span>
      </Reveal>

      <Reveal delay={500} className="mt-10">
        <p className="font-serif text-2xl text-white/70 italic md:text-3xl">Near chance.</p>
      </Reveal>
    </section>
  )
}

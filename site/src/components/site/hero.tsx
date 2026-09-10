import { ChevronDown } from "lucide-react"
import ParticleDrift from "@/components/ui/particle-drift"
import { Corners } from "@/components/site/corners"
import { Reveal } from "@/components/site/reveal"

export function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-ink">
      {/* The particle field. The iframe keeps pointer events so the field reacts to the mouse. */}
      <div className="absolute inset-0">
        <ParticleDrift mode="dark" density={1.2} length={1.1} className="h-full w-full" />
      </div>

      {/* Vignette so the type stays legible over the field. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030509_95%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />

      <Corners />

      {/* Top rail */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-10 py-9 font-mono text-[11px] tracking-[0.35em] text-white/40 uppercase md:px-14">
        <Reveal as="span" className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 border border-signal" />
          HoldTrue
        </Reveal>
        <Reveal as="span" delay={200}>
          Soon
        </Reveal>
      </header>

      {/* Centre */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <Reveal delay={300}>
          <h1 className="font-serif text-[clamp(3.5rem,11vw,9.5rem)] leading-[0.95] tracking-tight text-white">
            Hold <em className="text-signal not-italic italic">true</em>.
          </h1>
        </Reveal>
        <Reveal delay={900} className="mt-10">
          <p className="font-mono text-[12px] tracking-[0.3em] text-white/45 uppercase md:text-[13px]">
            Say what you know. Out loud.
          </p>
        </Reveal>
      </div>

      {/* Bottom rail */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-10 py-9 font-mono text-[11px] tracking-[0.35em] text-white/40 uppercase md:px-14">
        <Reveal as="span" delay={1200}>
          Turn 0 / 12
        </Reveal>
        <Reveal as="span" delay={1200} className="drift-down text-signal">
          <ChevronDown className="h-4 w-4" strokeWidth={1.25} aria-hidden="true" />
        </Reveal>
        <Reveal as="span" delay={1200}>
          MMXXVI
        </Reveal>
      </footer>
    </section>
  )
}

import { ArrowUpRight } from "lucide-react"
import { Corners } from "@/components/site/corners"
import { Reveal } from "@/components/site/reveal"

const REPO = "https://github.com/danielhkuo/HoldTrue"

export function Closing() {
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center">
      <img
        src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=80"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#030509_85%)]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ink to-transparent" />

      <Corners />

      <div className="relative">
        <Reveal>
          <p className="font-mono text-[11px] tracking-[0.35em] text-white/40 uppercase">
            A study application
          </p>
        </Reveal>
        <Reveal delay={200}>
          <h2 className="mt-8 font-serif text-[clamp(3rem,10vw,8rem)] leading-none text-white">
            Coming.
          </h2>
        </Reveal>
        <Reveal delay={500} className="mt-14">
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-mono text-[11px] tracking-[0.3em] text-white/70 uppercase backdrop-blur-sm transition-colors hover:border-signal/40 hover:text-signal"
          >
            Source
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </a>
        </Reveal>
      </div>

      <footer className="absolute inset-x-0 bottom-0 flex items-center justify-between px-10 py-9 font-mono text-[10px] tracking-[0.35em] text-white/30 uppercase md:px-14">
        <span>HoldTrue</span>
        <span>AGPL-3.0</span>
      </footer>
    </section>
  )
}

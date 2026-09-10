import { Reveal } from "@/components/site/reveal"
import { cn } from "@/lib/utils"

type Line = { who: "you" | "child"; text: string }

const LINES: Line[] = [
  { who: "you", text: "Water boils sooner up there. Less pressure." },
  { who: "child", text: "Why is there less pressure?" },
  { who: "you", text: "Less air on top of it." },
  { who: "child", text: "Why does less air make it boil?" },
  { who: "you", text: "…" },
]

export function Exchange() {
  return (
    <section className="relative bg-ink px-6 py-32 md:py-40">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <p className="mb-16 font-mono text-[11px] tracking-[0.35em] text-white/40 uppercase">
            Turn 7 / 12
          </p>
        </Reveal>

        <ol className="space-y-9">
          {LINES.map((line, i) => (
            <Reveal key={i} as="li" delay={i * 220}>
              <p
                className={cn(
                  "font-serif text-2xl leading-snug md:text-3xl",
                  line.who === "child" ? "text-signal" : "text-white/85",
                  i === LINES.length - 1 && "cursor-blink text-white/50",
                )}
              >
                {line.who === "child" ? <span aria-hidden="true">— </span> : null}
                {line.text}
              </p>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={LINES.length * 220 + 300} className="mt-20">
          <p className="font-mono text-[12px] tracking-[0.3em] text-white/60 uppercase">
            There it is.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

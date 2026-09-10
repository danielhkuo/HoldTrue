import { Reveal } from "@/components/site/reveal"

type Fragment = {
  index: string
  word: string
  note: string
  image: string
  alt: string
}

const FRAGMENTS: Fragment[] = [
  {
    index: "01",
    word: "Say it.",
    note: "From memory.",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    alt: "Mist over a dark forested ridge",
  },
  {
    index: "02",
    word: "Why?",
    note: "Something will ask.",
    image:
      "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=80",
    alt: "The Milky Way over a horizon",
  },
  {
    index: "03",
    word: "Again.",
    note: "Until it holds.",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    alt: "A snowbound peak under a night sky",
  },
]

export function Fragments() {
  return (
    <section className="relative bg-ink px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 md:grid-cols-3">
        {FRAGMENTS.map((fragment, i) => (
          <Reveal key={fragment.index} delay={i * 150}>
            <figure className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] md:aspect-[4/5]">
              <img
                src={fragment.image}
                alt={fragment.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale transition-all duration-[1400ms] ease-out group-hover:scale-[1.04] group-hover:opacity-80 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute inset-0 bg-signal/10 mix-blend-color opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

              <figcaption className="absolute inset-0 flex flex-col justify-between p-7">
                <span className="font-mono text-[11px] tracking-[0.35em] text-white/40">
                  {fragment.index}
                </span>
                <div>
                  <p className="font-serif text-4xl leading-none text-white md:text-5xl">
                    {fragment.word}
                  </p>
                  <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-signal/80 uppercase">
                    {fragment.note}
                  </p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

import { Hero } from "@/components/site/hero"
import { Fragments } from "@/components/site/fragments"
import { Figure } from "@/components/site/figure"
import { Exchange } from "@/components/site/exchange"
import { Closing } from "@/components/site/closing"

export default function App() {
  return (
    <main className="relative">
      <div className="grain" aria-hidden="true" />
      <Hero />
      <Fragments />
      <Figure />
      <Exchange />
      <Closing />
    </main>
  )
}

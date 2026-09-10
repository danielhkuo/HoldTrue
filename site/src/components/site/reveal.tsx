import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  as?: "div" | "p" | "h2" | "span" | "li"
}

/** Fades the child in once when it enters the viewport. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add("is-in")
            observer.disconnect()
          }
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const Tag = as as "div"
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}

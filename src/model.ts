/**
 * The model, as the caller has it configured.
 *
 * Reads identity from the thing that answers rather than from settings, so an attribution names
 * what actually ran. Ollama only for now; a bring-your-own-key path is the same shape behind the
 * same interface.
 *
 * `ask` returns `string | null` and NEVER throws. That is the convention the whole product rests
 * on: a model that cannot be reached is a result, not an exception, which is what lets a turn end
 * in a stated silence instead of an error banner.
 *
 * No `schema` parameter. Only the old extractor passed one, and five probes on 2026-08-12 showed
 * this backend ignores `format` entirely — a bogus format value returned HTTP 200. A parameter
 * that is ignored is worse than no parameter.
 */

const HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'

export type Attribution = {
  readonly model_id: string
  readonly runtime: string
  /** No calibration procedure exists. The honest word is the only inhabited value. */
  readonly calibration: 'uncalibrated'
}

export type ModelHandle = {
  readonly identify: () => Promise<Attribution>
  readonly ask: (system: string, user: string) => Promise<string | null>
}

type TagList = { models?: { name?: string }[] }

export const ollama = (model?: string): ModelHandle => {
  let chosen = model

  const resolve = async (): Promise<string | null> => {
    if (chosen !== undefined) return chosen
    try {
      const res = await fetch(`${HOST}/api/tags`)
      if (!res.ok) return null
      const body = (await res.json()) as TagList
      chosen = body.models?.[0]?.name
      return chosen ?? null
    } catch {
      return null
    }
  }

  return {
    identify: async () => ({
      model_id: (await resolve()) ?? 'unreachable',
      runtime: `ollama @ ${HOST}`,
      calibration: 'uncalibrated',
    }),

    ask: async (system, user) => {
      const name = await resolve()
      if (name === null) return null
      try {
        const res = await fetch(`${HOST}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model: name,
            stream: false,
            think: false,
            // Temperature 0 does NOT buy byte-determinism on this runner — re-probed across
            // sessions, turns 1-4 matched and 5-6 did not. It stays because nothing has shown a
            // higher temperature buys fluency the prompt cannot. The model also ships its own
            // top_k and top_p, and this overrides only temperature.
            options: { temperature: 0 },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
          }),
        })
        if (!res.ok) return null
        const body = (await res.json()) as { message?: { content?: string } }
        return body.message?.content ?? null
      } catch {
        return null
      }
    },
  }
}

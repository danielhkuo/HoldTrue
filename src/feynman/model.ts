/**
 * The model, as the caller has it configured.
 *
 * Reads identity from the thing that answers rather than from settings, so an attribution
 * names what actually ran — Law 2 in docs/philosophy.md. Ollama only, for now; a
 * bring-your-own-key path is the same shape behind the same interface.
 *
 * SKELETON. docs/specs/supply.md ruling 8 says this type belongs to a model-client module
 * that does not exist yet. This is that module, started.
 */

const HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'

export type Attribution = {
  readonly model_id: string
  readonly runtime: string
  /** `philosophy.md` requires the app to state this, and records that no procedure exists. */
  readonly calibration: 'uncalibrated'
}

export type ModelHandle = {
  readonly identify: () => Promise<Attribution>
  /**
   * Returns whatever came back, as a string. Never throws; an unreachable model is null.
   *
   * `schema` is a property of the REQUEST, not of the client. Omit it and no `format` key is sent
   * at all. It used to be baked in, so every call — the child's line included — asked for
   * link-extraction JSON; that was inert only because this backend ignores `format` entirely. Five
   * probes on 2026-08-12: the schema was ignored, `"json"` was ignored, and a bogus format value
   * returned HTTP 200 rather than an error. Do not rely on that.
   */
  readonly ask: (
    system: string,
    user: string,
    schema?: Readonly<Record<string, unknown>>,
  ) => Promise<string | null>
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

    ask: async (system, user, schema) => {
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
            // Every call, the child's included. Decided 2026-08-12 rather than inherited: a probe
            // held the prompt fixed and returned byte-identical lines three times out of three at
            // 0, and three distinct lines at 0.8. Determinism is being bought and is worth it.
            options: { temperature: 0 },
            // Only when the caller asks. `validate` still takes `unknown` and never throws,
            // because a backend that ignores the schema is the case we actually have.
            ...(schema === undefined ? {} : { format: schema }),
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


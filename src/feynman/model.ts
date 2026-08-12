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
  /** Returns whatever came back, as a string. Never throws; an unreachable model is null. */
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
            options: { temperature: 0 },
            // Asked for, and honoured only some of the time — one probe returned prose and
            // the next returned JSON from the same call at temperature 0. That is why
            // `validate` takes `unknown` and never throws.
            format: LINK_SCHEMA,
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

const LINK_SCHEMA = {
  type: 'object',
  properties: {
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cause: { type: 'string' },
          effect: { type: 'string' },
          relation: { type: 'string', enum: ['causes', 'enables', 'prevents', 'requires'] },
        },
        required: ['cause', 'effect', 'relation'],
      },
    },
  },
  required: ['links'],
} as const

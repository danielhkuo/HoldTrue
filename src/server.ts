/**
 * The front door. `npm run app`, then open the address it prints.
 *
 * Four routes and one array. There is no framework, no build step, and no bundler — the page is a
 * string read off disk.
 *
 * **One conversation at a time, in memory.** Two browser tabs share it, and closing the process
 * loses it. Both are deliberate for now: nothing is persisted, and the day a second conversation
 * matters this becomes a `Map` keyed by id, which is ten minutes of work.
 *
 * The server is the single source of truth for the transcript, and `GET /api/state` exists so a
 * page reload can recover it. The old build kept history in the server and the transcript in the
 * DOM, so a reload gave you a blank screen talking to a server that remembered four turns.
 *
 * **Typed input, not voice.** The decided design is voice — you do not type at a child sitting in
 * front of you, and the roleplay is the product. This types because no speech sidecar exists. The
 * page funnels everything through one `send()` so swapping in speech is a change to one place.
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ollama } from './model.js'
import { speak, type Exchange } from './child.js'
import { TOPICS } from './topics.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 4517)

const model = ollama()
const who = await model.identify()

let topic = ''
let history: Exchange[] = []

const json = (res: import('node:http').ServerResponse, code: number, body: unknown): void => {
  res.writeHead(code, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

const readBody = async (req: import('node:http').IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(readFileSync(join(HERE, 'page.html'), 'utf8'))
      return
    }

    // Everything the page needs on load, in one request.
    if (req.method === 'GET' && req.url === '/api/boot') {
      return json(res, 200, { who, topics: TOPICS })
    }

    // The transcript, so a reload recovers rather than starting blank.
    if (req.method === 'GET' && req.url === '/api/state') {
      return json(res, 200, { topic, history })
    }

    if (req.method === 'POST' && req.url === '/api/start') {
      const { topic: t } = JSON.parse(await readBody(req)) as { topic?: unknown }
      topic = typeof t === 'string' && t.trim() !== '' ? t.trim() : 'how something works'
      history = []
      return json(res, 200, { topic })
    }

    if (req.method === 'POST' && req.url === '/api/turn') {
      const { said } = JSON.parse(await readBody(req)) as { said?: unknown }
      if (typeof said !== 'string' || said.trim() === '') {
        return json(res, 400, { error: 'nothing said' })
      }
      const you = said.trim()
      const started = Date.now()
      const child = await speak(history, you, model)
      const exchange: Exchange = { you, child, seconds: (Date.now() - started) / 1000 }
      history.push(exchange)
      return json(res, 200, exchange)
    }

    res.writeHead(404).end('not found')
  } catch (err) {
    // A 500 means the server itself broke. A model that will not answer is a `silent` exchange
    // and comes back 200, which is why the page has no error branch for it.
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}).listen(PORT, () => {
  console.log(`\n  ${who.model_id} · ${who.runtime} · ${who.calibration}`)
  console.log(`\n  http://localhost:${PORT}\n`)
  console.log(`  one model call a turn. typed input, one conversation, nothing saved.\n`)
})

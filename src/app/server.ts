/**
 * The skeleton's front door. `npm run app`, then open the page it prints.
 *
 * SKELETON. Two things it does that the design does not permit in a release, stated here rather
 * than discovered later:
 *
 *   1. **Typed input, not voice.** `decisions.md`'s *Voice in, not typing* is a decided row and this
 *      violates it. The reason is availability, not disagreement: the speech engine was chosen on
 *      2026-08-12 and the `whisper-server` sidecar does not exist. `features/feynman.md` already
 *      names "whether a first release could ship against typed text" as an open question; this does
 *      not answer it and must not be read as answering it.
 *   2. **A local page, not an Electron window.** Electron is the decided stack and is not in
 *      `package.json`. Electron loads a URL, so this page is what a window would show anyway.
 *
 * No persistence. Close the process and the session is gone — `decisions.md` notes that supersession
 * has nowhere to live until something writes, and nothing here writes.
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ollama } from '../feynman/model.js'
import { Session, type TurnReport } from './session.js'
import { SAMPLES } from './samples.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 4517)

const model = ollama()
const who = await model.identify()

/**
 * One session in memory. Starting a new topic throws the old one away entirely, which is the only
 * honest option while nothing persists — `decisions.md`'s *The `Doc` is the turn* records that
 * supersession has nowhere to live until something writes, and nothing here writes.
 */
let session = new Session(model, 'how something works')

/** Anchors do not survive JSON usefully. Send the quotes the page actually renders. */
const plain = (report: TurnReport) => ({
  you: report.you,
  child: report.child,
  links: report.links,
  dropped: report.dropped,
  seconds: Number(report.seconds.toFixed(1)),
  shapes: report.shapes.map(s => {
    if (s.kind === 'dangling' || s.kind === 'rootless') return { kind: s.kind, text: s.concept }
    if (s.kind === 'unlinkedPair') return { kind: s.kind, text: `${s.a} · ${s.b}`, via: s.via }
    return { kind: s.kind, text: `${s.a.cause.quote} ${s.a.relation} ${s.a.effect.quote}` }
  }),
  introduced: report.introduced.map(i =>
    i.kind === 'link'
      ? { kind: i.kind, text: `${i.cause} —${i.relation}→ ${i.effect}` }
      : i.kind === 'word'
        ? { kind: i.kind, text: i.word }
        : { kind: i.kind, text: i.reason },
  ),
  debts: session.ledger.filter(r => r.item.kind === 'link').length,
})

const body = async (req: import('node:http').IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(readFileSync(join(HERE, 'index.html'), 'utf8'))
      return
    }

    if (req.method === 'GET' && req.url === '/who') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(who))
      return
    }

    if (req.method === 'GET' && req.url === '/samples') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(SAMPLES))
      return
    }

    if (req.method === 'POST' && req.url === '/start') {
      const { topic } = JSON.parse(await body(req)) as { topic?: unknown }
      // The topic is not decoration: the child speaks in ellipsis, so a debt reading
      // "it empties causes the toilet fills up" has no referent for "it" without it.
      session = new Session(model, typeof topic === 'string' && topic.trim() !== '' ? topic.trim() : 'how something works')
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ started: true }))
      return
    }

    // Step 5 of the review. Slow — one model call per debt — so the review screen renders its
    // bookkeeping first and asks for this second.
    if (req.method === 'POST' && req.url === '/settle') {
      const settled = await session.settleDebts()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify(
          settled.map(s => ({
            claim: `${s.debt.cause} —${s.debt.relation}→ ${s.debt.effect}`,
            kind: s.verdict.kind,
            text: s.verdict.kind === 'unsettled' ? s.verdict.reason : s.verdict.closing,
            by: `${s.attribution.model_id} · ${s.attribution.calibration}`,
          })),
        ),
      )
      return
    }

    if (req.method === 'GET' && req.url === '/review') {
      const r = session.review()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(
        JSON.stringify({
          transcript: r.transcript,
          turns: r.turns,
          links: r.links,
          standing: r.standing.map(s => {
            if (s.kind === 'dangling' || s.kind === 'rootless') return { kind: s.kind, text: s.concept }
            if (s.kind === 'unlinkedPair') return { kind: s.kind, text: `${s.a} · ${s.b}` }
            return { kind: s.kind, text: `${s.a.cause.quote} ${s.a.relation} ${s.a.effect.quote}` }
          }),
          debts: r.ledger
            .filter(x => x.item.kind === 'link')
            .map(x => {
              const i = x.item as Extract<typeof x.item, { kind: 'link' }>
              return { turn: x.turn, text: `${i.cause} —${i.relation}→ ${i.effect}` }
            }),
          notes: r.ledger
            .filter(x => x.item.kind === 'word')
            .map(x => {
              const i = x.item as Extract<typeof x.item, { kind: 'word' }>
              return { turn: x.turn, text: i.word }
            }),
        }),
      )
      return
    }

    if (req.method === 'POST' && req.url === '/turn') {
      const { line } = JSON.parse(await body(req)) as { line?: unknown }
      if (typeof line !== 'string' || line.trim() === '') {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'nothing said' }))
        return
      }
      const report = await session.take(line)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(plain(report)))
      return
    }

    res.writeHead(404).end('not found')
  } catch (err) {
    // A model that is unreachable is a result, never a crash — extract.md ruling 6, applied to the
    // one surface a person is looking at.
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
  }
}).listen(PORT, () => {
  console.log(`\n  ${who.model_id} · ${who.runtime} · ${who.calibration}`)
  console.log(`\n  http://localhost:${PORT}\n`)
  console.log(`  skeleton: typed input, no voice, no persistence, nothing closes the ledger.\n`)
})

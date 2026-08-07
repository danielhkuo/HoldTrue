#!/usr/bin/env node
// The within-sentence rate. Build order step 0, first of three falsification measurements.
//
// Reads every explanation in ./explanations, counts the links you marked as within one
// sentence against those you marked as split, and reports the fraction.
//
// Kill number, fixed before any data existed: below 60% and invariant 8 needs renegotiating
// rather than obeying. Still 60%, but under review — the premise it was chosen against was
// falsified on 2026-08-07, before any data existed. README.md lays out the options and the rule:
// settle it before the first explanation is written, then never touch it again.

import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KILL = 0.6
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'explanations')

const WITHIN = '## Links — within one sentence'
const SPLIT = '## Links — split across sentences'

/**
 * The two free columns on a split link, tagged by hand in brackets at the end of its line:
 * did the effect's sentence open with a causal connective, and was the cause in the immediately
 * preceding sentence. Returns null when either tag is missing, so an untagged link is reported
 * rather than quietly counted as a `no`.
 */
const tagsOf = line => {
  const m = /\[([^\]]*)\]\s*$/.exec(line)
  if (m === null) return null
  const t = m[1].toLowerCase()
  const connective = /\bno[\s-]*connective\b/.test(t) ? false : /\bconnective\b/.test(t) ? true : null
  const adjacent = /\badjacent\b/.test(t) ? true : /\bearlier\b/.test(t) ? false : null
  return connective === null || adjacent === null ? null : { connective, adjacent }
}

/** Bullet lines under `heading`, up to the next `## ` heading. Blank lines and comments ignored. */
const linksUnder = (text, heading) => {
  const start = text.indexOf(heading)
  if (start === -1) return null
  const after = text.slice(start + heading.length)
  const end = after.search(/^## /m)
  return (end === -1 ? after : after.slice(0, end))
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('- ') && l.length > 2)
}

const files = (await readdir(DIR)).filter(f => f.endsWith('.md')).sort()

if (files.length === 0) {
  console.error(`No explanations in ${DIR}. Write some first — see README.md.`)
  process.exit(1)
}

let within = 0
let split = 0
let connective = 0
let adjacent = 0
let untagged = 0
const problems = []
const rows = []

for (const f of files) {
  const text = await readFile(join(DIR, f), 'utf8')
  const w = linksUnder(text, WITHIN)
  const s = linksUnder(text, SPLIT)

  if (w === null || s === null) {
    problems.push(`${f}: missing a "${w === null ? WITHIN : SPLIT}" heading — both must be present, even if empty`)
    continue
  }
  if (w.length + s.length === 0) {
    problems.push(`${f}: no links marked at all. Either it has none, which is itself worth knowing, or it was not marked`)
  }

  let bare = 0
  for (const line of s) {
    const t = tagsOf(line)
    if (t === null) {
      bare += 1
      continue
    }
    if (t.connective) connective += 1
    if (t.adjacent) adjacent += 1
  }
  if (bare) {
    problems.push(`${f}: ${bare} split link${bare === 1 ? '' : 's'} missing the [connective, adjacent] tags — counted in the rate, left out of the two columns`)
  }

  within += w.length
  split += s.length
  untagged += bare
  rows.push({ f, w: w.length, s: s.length })
}

const total = within + split
const pad = Math.max(...rows.map(r => r.f.length), 4)

console.log('')
for (const r of rows) {
  const n = r.w + r.s
  const pct = n ? ` ${Math.round((r.w / n) * 100)}%` : ''
  console.log(`  ${r.f.padEnd(pad)}  within ${String(r.w).padStart(3)}   split ${String(r.s).padStart(3)}${pct}`)
}

const skipped = files.length - rows.length
console.log('')
console.log(`  ${rows.length} explanations counted${skipped ? `, ${skipped} skipped as malformed` : ''}, ${total} links marked`)

if (total === 0) {
  console.log('\n  No links marked. Nothing to report.')
  process.exit(1)
}

const rate = within / total
console.log(`  within-sentence rate: ${within}/${total} = ${(rate * 100).toFixed(1)}%`)

// A rate on ~100 items carries about seven percentage points either way. Below that count the
// interval is wider still, so say so rather than let a small sample read as precise.
if (total < 100) {
  console.log(`  ${total} links is a small sample — treat this as indicative, not as a measured rate`)
}

// The two free columns. Nothing published covers spoken from-memory explanation, so these are the
// only figures on the question that describe the person actually using this.
const tagged = split - untagged
if (tagged > 0) {
  const pct = n => `${Math.round((n / tagged) * 100)}%`
  console.log('')
  console.log(`  of ${tagged} tagged split link${tagged === 1 ? '' : 's'}:`)
  console.log(`    ${connective} open the effect sentence with a causal connective (${pct(connective)})`)
  console.log(`    ${adjacent} have the cause in the immediately preceding sentence (${pct(adjacent)})`)
}
if (untagged) {
  console.log(`  ${untagged} split link${untagged === 1 ? '' : 's'} untagged, so left out of those two counts`)
}

console.log('')
console.log(rate >= KILL
  ? `  ABOVE the ${KILL * 100}% kill number. Invariant 8 stands; per-sentence extraction is viable.`
  : `  BELOW the ${KILL * 100}% kill number. Invariant 8 needs renegotiating rather than obeying —\n  most of how you explain things would be structurally invisible to a per-sentence extractor.`)
console.log(`\n  The ${KILL * 100}% line is under review: the premise it was chosen against was falsified\n  before any data existed. See README.md. If it was not settled before these explanations\n  were written, it is frozen now — a threshold moved after the data is not a gate.`)

if (problems.length) {
  console.log('\n  Problems:')
  for (const p of problems) console.log(`    ${p}`)
}
console.log('')

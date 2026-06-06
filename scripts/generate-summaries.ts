/**
 * generate-summaries.ts
 *
 * Pre-generates AI summaries for each Marian apparition entry using the Claude API.
 * Writes the updated data back to src/data/apparitions.ts.
 *
 * Usage:
 *   npm run generate-summaries
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment before running.
 *   Option 1: export ANTHROPIC_API_KEY=sk-ant-... && npm run generate-summaries
 *   Option 2: Create a .env file and run: source .env && npm run generate-summaries
 *   (dotenv is not a dependency of this project — set the env var manually)
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { apparitions } from '../src/data/apparitions.js'
import type { Apparition } from '../src/data/types.js'

// ── Guard: API key must be present ──────────────────────────────────────────
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error(
    'Error: ANTHROPIC_API_KEY is not set.\n' +
    'Set it before running:\n' +
    '  export ANTHROPIC_API_KEY=sk-ant-...\n' +
    '  npm run generate-summaries'
  )
  process.exit(1)
}

const client = new Anthropic({ apiKey })

const SYSTEM_PROMPT =
  'You are a scholarly Catholic researcher writing concise, factual summaries of ' +
  'Church-approved Marian apparitions for an educational reference. Write exactly 3 sentences. ' +
  'Be specific: name the visionaries, the location, the key message or sign, and the Church\'s ' +
  'formal approval. Do not editorialize or add personal commentary. Write in past tense. ' +
  'Do not start with "In" — vary the opening.'

// ── Generate a single summary via the Claude API ────────────────────────────
async function generateSummary(apparition: Apparition): Promise<string> {
  const { name, location, country, year, sourceUrl } = apparition
  const userMessage =
    `Apparition: ${name}\nLocation: ${location}, ${country}\nYear: ${year}\nSource: ${sourceUrl}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (block.type !== 'text') {
    throw new Error(`Unexpected response block type: ${block.type}`)
  }
  return block.text.trim()
}

// ── Serialise a single apparition object to TypeScript source ────────────────
function serializeApparition(a: Apparition): string {
  return [
    `  {`,
    `    id: '${a.id}',`,
    `    name: '${a.name.replace(/'/g, "\\'")}',`,
    `    location: '${a.location.replace(/'/g, "\\'")}',`,
    `    country: '${a.country.replace(/'/g, "\\'")}',`,
    `    lat: ${a.lat},`,
    `    lng: ${a.lng},`,
    `    year: ${a.year},`,
    `    status: '${a.status}',`,
    `    sourceUrl: '${a.sourceUrl}',`,
    `    imageUrl: '${a.imageUrl}',`,
    `    summary:`,
    `      '${a.summary.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`,
    `  }`,
  ].join('\n')
}

// ── Build the full apparitions.ts file content ───────────────────────────────
function buildFileContent(updated: Apparition[]): string {
  const entries = updated.map(serializeApparition).join(',\n')
  return (
    `import type { Apparition } from './types'\n` +
    `\n` +
    `export const apparitions: Apparition[] = [\n` +
    `${entries},\n` +
    `]\n`
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const outputPath = path.resolve(__dirname, '../src/data/apparitions.ts')

  const total = apparitions.length
  const updated: Apparition[] = []

  for (let i = 0; i < total; i++) {
    const apparition = apparitions[i]
    console.log(`[${i + 1}/${total}] Generating: ${apparition.name}...`)

    const summary = await generateSummary(apparition)
    updated.push({ ...apparition, summary })
  }

  const fileContent = buildFileContent(updated)
  fs.writeFileSync(outputPath, fileContent, 'utf-8')

  console.log(`\nDone. Updated src/data/apparitions.ts`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

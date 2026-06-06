/**
 * server/anthropic.ts
 *
 * Server-side Anthropic calls. The API key lives ONLY here (process.env.ANTHROPIC_API_KEY)
 * and is never shipped to the browser. These three functions are the verbatim port of the
 * former client-side logic in src/api/claudeApi.ts and src/api/medjugorjeAnalytics.ts —
 * same models, max_tokens, prompts, chunking, and fallback behavior — so the frontend's
 * response shapes (including token `usage`) are unchanged.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Apparition } from '../src/data/types.js'
import type {
  MedjugorjeMessage,
  GeopoliticalEvent,
  SentimentResult,
} from '../src/data/medjugorjeTypes.js'

export interface ApiUsage {
  inputTokens: number
  outputTokens: number
}

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  // Surfaced by index.ts boot validation; this guard keeps the module honest.
  throw new Error('ANTHROPIC_API_KEY is not set')
}

const client = new Anthropic({ apiKey })

// ── Summary (was claudeApi.generateSummary) ─────────────────────────────────
export async function generateSummary(apparition: Apparition): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system:
      "You are a scholarly Catholic researcher writing concise, factual summaries of Church-approved Marian apparitions for an educational reference. Write exactly 3 sentences. Be specific: name the visionaries, the location, the key message or sign, and the Church's formal approval. Do not editorialize. Write in past tense.",
    messages: [
      {
        role: 'user',
        content: `Write a 3-sentence summary of: ${apparition.name} (${apparition.location}, ${apparition.country}, ${apparition.year}). Source: ${apparition.sourceUrl}`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

// ── Sentiment analysis (was medjugorjeAnalytics.analyzeSentiments) ──────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function fallbackSentiments(messages: MedjugorjeMessage[]): SentimentResult[] {
  return messages.map((m) => ({
    messageId: m.id,
    score: 0,
    label: 'peaceful' as const,
    keywords: [],
    themes: [],
  }))
}

export async function analyzeSentiments(
  messages: MedjugorjeMessage[],
): Promise<{ sentiments: SentimentResult[]; usage: ApiUsage }> {
  const chunks = chunkArray(messages, 20)
  const results: SentimentResult[] = []
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const chunk of chunks) {
    const payload = chunk.map((m) => ({ id: m.id, text: m.text }))

    const userContent = `Analyze the following Medjugorje messages and return a JSON array. Each element must have exactly these fields:
- "messageId": the id string from the input
- "score": a number from -1.0 (urgent/dark) to 1.0 (joyful/peaceful)
- "label": one of "urgent", "peaceful", "consoling", "warning", "joyful"
- "keywords": an array of 3–5 key words from the message
- "themes": an array of 1–3 theme names chosen from: prayer, peace, fasting, family, conversion, love

Return ONLY valid JSON — no markdown, no commentary. Example:
[{"messageId": "m1", "score": 0.7, "label": "peaceful", "keywords": ["prayer", "heart"], "themes": ["prayer"]}]

Messages:
${JSON.stringify(payload)}`

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system:
          'You are a religious text analyst specializing in Marian apparition messages. Analyze Medjugorje messages and return JSON sentiment/keyword data.',
        messages: [{ role: 'user', content: userContent }],
      })

      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens

      const block = response.content[0]
      if (block.type !== 'text') {
        results.push(...fallbackSentiments(chunk))
        continue
      }

      const raw = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

      try {
        const parsed: SentimentResult[] = JSON.parse(raw)
        results.push(...parsed)
      } catch {
        results.push(...fallbackSentiments(chunk))
      }
    } catch {
      results.push(...fallbackSentiments(chunk))
    }
  }

  return {
    sentiments: results,
    usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  }
}

// ── Time-window enrichment (was medjugorjeAnalytics.enrichTimeWindow) ────────
export async function enrichTimeWindow(
  messages: MedjugorjeMessage[],
  events: GeopoliticalEvent[],
  windowLabel: string,
): Promise<{ text: string; usage: ApiUsage }> {
  const messageTexts = messages
    .map((m) => `[${m.date}] ${m.text}`)
    .join('\n\n')

  const eventTexts = events
    .map((e) => `[${e.date}] ${e.title}: ${e.description}`)
    .join('\n\n')

  const userContent = `Time window: ${windowLabel}

Medjugorje messages from this period:
${messageTexts}

Concurrent world events:
${eventTexts}

Please write a concise narrative (3–5 paragraphs) explaining the correlations and themes between these messages and the world events of this period. Focus on theological significance, recurring motifs, and how the messages may speak to the historical context.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system:
      'You are a theological and historical analyst studying correlations between Marian apparition messages and world events.',
    messages: [{ role: 'user', content: userContent }],
  })

  const usage: ApiUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }

  const block = response.content[0]
  if (block.type !== 'text') return { text: '', usage }
  return { text: block.text, usage }
}

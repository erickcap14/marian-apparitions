import Anthropic from '@anthropic-ai/sdk'
import type { Apparition } from '../data/types'

export async function generateSummary(apparition: Apparition): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set')

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

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

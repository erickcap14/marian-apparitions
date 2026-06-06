/**
 * server/routes.ts
 *
 * Authenticated proxy endpoints for the three AI features. Request bodies are validated
 * with Zod (already a project dependency) before any Anthropic call. Responses mirror the
 * exact shapes the frontend expects, so client code only changes from "call SDK" to "fetch".
 */
import { Router } from 'express'
import { z } from 'zod'
import { ApparitionSchema } from '../src/data/types.js'
import { generateSummary, analyzeSentiments, enrichTimeWindow } from './anthropic.js'

const MessageSchema = z.object({
  id: z.string(),
  date: z.string(),
  year: z.number(),
  month: z.number(),
  recipient: z.enum(['marija', 'mirjana', 'group']),
  text: z.string(),
  sourceUrl: z.string(),
})

const EventSchema = z.object({
  id: z.string(),
  date: z.string(),
  year: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['war', 'collapse', 'disaster', 'papal', 'terrorism', 'diplomacy']),
})

const summaryBody = z.object({ apparition: ApparitionSchema })
const sentimentsBody = z.object({ messages: z.array(MessageSchema) })
const enrichBody = z.object({
  messages: z.array(MessageSchema),
  events: z.array(EventSchema),
  windowLabel: z.string(),
})

export const apiRouter = Router()

apiRouter.post('/summary', async (req, res) => {
  const parsed = summaryBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  try {
    const summary = await generateSummary(parsed.data.apparition)
    res.json({ summary })
  } catch (err) {
    console.error('[/api/summary] Anthropic call failed:', (err as Error).message)
    res.status(502).json({ error: 'AI service unavailable' })
  }
})

apiRouter.post('/sentiments', async (req, res) => {
  const parsed = sentimentsBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  try {
    const result = await analyzeSentiments(parsed.data.messages)
    res.json(result)
  } catch (err) {
    console.error('[/api/sentiments] Anthropic call failed:', (err as Error).message)
    res.status(502).json({ error: 'AI service unavailable' })
  }
})

apiRouter.post('/enrich', async (req, res) => {
  const parsed = enrichBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  try {
    const result = await enrichTimeWindow(
      parsed.data.messages,
      parsed.data.events,
      parsed.data.windowLabel,
    )
    res.json(result)
  } catch (err) {
    console.error('[/api/enrich] Anthropic call failed:', (err as Error).message)
    res.status(502).json({ error: 'AI service unavailable' })
  }
})

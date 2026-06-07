import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SUMMARIES_FILE = resolve(here, 'summaries.json')

type SummaryMap = Record<string, string>

function load(): SummaryMap {
  try {
    if (existsSync(SUMMARIES_FILE)) {
      return JSON.parse(readFileSync(SUMMARIES_FILE, 'utf-8')) as SummaryMap
    }
  } catch { /* ignore */ }
  return {}
}

function persist(map: SummaryMap): void {
  writeFileSync(SUMMARIES_FILE, JSON.stringify(map, null, 2), 'utf-8')
}

export function getAllSummaries(): SummaryMap {
  return load()
}

export function saveSummary(id: string, summary: string): void {
  const map = load()
  map[id] = summary
  persist(map)
}

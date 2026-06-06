export interface MedjugorjeMessage {
  id: string
  date: string        // ISO: "1981-06-25"
  year: number
  month: number
  recipient: 'marija' | 'mirjana' | 'group'
  text: string
  sourceUrl: string
}

export interface GeopoliticalEvent {
  id: string
  date: string        // ISO: "1989-11-09"
  year: number
  title: string
  description: string
  category: 'war' | 'collapse' | 'disaster' | 'papal' | 'terrorism' | 'diplomacy'
}

export interface SentimentResult {
  messageId: string
  score: number       // -1 (urgent/dark) to 1 (joyful/peaceful)
  label: 'urgent' | 'peaceful' | 'consoling' | 'warning' | 'joyful'
  keywords: string[]
  themes: string[]
}

export interface ThemeCluster {
  name: string
  messageIds: string[]
  description: string
  color: string
}

export interface AnalyticsResult {
  sentiments: SentimentResult[]
  topKeywords: { word: string; count: number }[]
  themes: ThemeCluster[]
  summary: string
}

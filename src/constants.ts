export const MAP_INITIAL_CENTER: [number, number] = [15, 30]
export const MAP_INITIAL_ZOOM = 2
export const PIN_COLOR_GOLD = '#f5c842'
export const PIN_COLOR_HOVER = '#fde68a'

export const PIN_COLORS: Record<string, string> = {
  approved:              '#f5c842',  // gold
  approved_for_devotion: '#38bdf8',  // sky blue
  under_investigation:   '#fb923c',  // amber
  not_approved:          '#f87171',  // rose/red
  unapproved:            '#a78bfa',  // soft violet
}

export const PIN_GLOW_COLORS: Record<string, string> = {
  approved:              '#f5c842',
  approved_for_devotion: '#38bdf8',
  under_investigation:   '#fb923c',
  not_approved:          '#f87171',
  unapproved:            '#a78bfa',
}

export const STATUS_LABELS: Record<string, string> = {
  approved:              'Approved',
  approved_for_devotion: 'Approved for Devotion',
  under_investigation:   'Under Investigation',
  not_approved:          'Not Approved',
  unapproved:            'Not Formally Evaluated',
}

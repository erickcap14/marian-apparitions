import { apparitions } from './apparitions'
import { ApparitionSchema, getCentury } from './types'

const LAT_RANGE = { min: -90, max: 90 }
const LNG_RANGE = { min: -180, max: 180 }

let errors = 0

for (const apparition of apparitions) {
  const result = ApparitionSchema.safeParse(apparition)
  if (!result.success) {
    console.error(`SCHEMA FAIL [${apparition.id}]:`, result.error.flatten())
    errors++
    continue
  }

  if (apparition.lat < LAT_RANGE.min || apparition.lat > LAT_RANGE.max) {
    console.error(`COORD FAIL [${apparition.id}]: lat ${apparition.lat} out of range`)
    errors++
  }
  if (apparition.lng < LNG_RANGE.min || apparition.lng > LNG_RANGE.max) {
    console.error(`COORD FAIL [${apparition.id}]: lng ${apparition.lng} out of range`)
    errors++
  }
  if (apparition.year < 1 || apparition.year > new Date().getFullYear()) {
    console.error(`YEAR FAIL [${apparition.id}]: year ${apparition.year}`)
    errors++
  }
  if (!apparition.sourceUrl.includes('miraclehunter.com')) {
    console.warn(`SOURCE WARN [${apparition.id}]: sourceUrl not miraclehunter.com — ${apparition.sourceUrl}`)
  }

  console.log(`  OK  [${apparition.id}] ${apparition.year} (${getCentury(apparition.year)}th c.) — ${apparition.location}, ${apparition.country}`)
}

console.log(`\n${apparitions.length} apparitions checked, ${errors} error(s)`)
if (errors > 0) process.exit(1)

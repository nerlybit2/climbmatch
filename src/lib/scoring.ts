import type { PartnerRequest, GearSet, ExperienceLevel } from '@/lib/types/database'

export function timeOverlap(req: PartnerRequest, timeOfDay?: string): number {
  if (req.flexible) return 10
  if (!timeOfDay || timeOfDay === 'flexible') return 10
  if (!req.start_time) return 10

  const startHour = parseInt(req.start_time.split(':')[0])
  if (timeOfDay === 'morning' && startHour < 12) return 30
  if (timeOfDay === 'afternoon' && startHour >= 12 && startHour < 17) return 30
  if (timeOfDay === 'evening' && startHour >= 17) return 30
  return 0
}

export function gearCompatibility(userGear: GearSet, needsGear: GearSet): number {
  let score = 0
  const keys: (keyof GearSet)[] = ['rope', 'quickdraws', 'belayDevice', 'crashPad', 'helmet']
  for (const key of keys) {
    if (needsGear[key] && userGear[key]) score += 2
  }
  return Math.min(score, 10)
}

export function experienceLevelScore(userLevel: ExperienceLevel | null, requestUserLevel: ExperienceLevel | null): number {
  if (!userLevel || !requestUserLevel) return 0
  const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced']
  const diff = Math.abs(levels.indexOf(userLevel) - levels.indexOf(requestUserLevel))
  if (diff === 0) return 15
  if (diff === 1) return 5
  return 0
}

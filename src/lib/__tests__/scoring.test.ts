import { describe, it, expect } from 'vitest'
import { timeOverlap, gearCompatibility, experienceLevelScore } from '../scoring'
import type { PartnerRequest, GearSet } from '@/lib/types/database'

const makeRequest = (overrides: Partial<PartnerRequest> = {}): PartnerRequest => ({
  id: '1',
  user_id: 'u1',
  date: '2025-06-01',
  start_time: null,
  end_time: null,
  flexible: false,
  location_type: 'gym',
  location_name: 'Test Gym',
  goal_type: 'any',
  desired_grade_range: null,
  notes: null,
  needs_gear: { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false },
  carpool_needed: false,
  weight_relevant: false,
  max_weight_difference_kg: null,
  status: 'active',
  created_at: '',
  updated_at: '',
  ...overrides,
})

const noGear: GearSet = { rope: false, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }
const fullGear: GearSet = { rope: true, quickdraws: true, belayDevice: true, crashPad: true, helmet: true }

describe('timeOverlap', () => {
  it('returns 10 for flexible requests', () => {
    expect(timeOverlap(makeRequest({ flexible: true }), 'morning')).toBe(10)
  })

  it('returns 10 when no time filter', () => {
    expect(timeOverlap(makeRequest({ start_time: '08:00' }), undefined)).toBe(10)
  })

  it('returns 10 when filter is flexible', () => {
    expect(timeOverlap(makeRequest({ start_time: '08:00' }), 'flexible')).toBe(10)
  })

  it('returns 30 for morning match', () => {
    expect(timeOverlap(makeRequest({ start_time: '08:00' }), 'morning')).toBe(30)
  })

  it('returns 30 for afternoon match', () => {
    expect(timeOverlap(makeRequest({ start_time: '14:00' }), 'afternoon')).toBe(30)
  })

  it('returns 30 for evening match', () => {
    expect(timeOverlap(makeRequest({ start_time: '18:00' }), 'evening')).toBe(30)
  })

  it('returns 0 for time mismatch', () => {
    expect(timeOverlap(makeRequest({ start_time: '08:00' }), 'evening')).toBe(0)
  })

  it('returns 10 when no start_time on request', () => {
    expect(timeOverlap(makeRequest({ start_time: null }), 'morning')).toBe(10)
  })
})

describe('gearCompatibility', () => {
  it('returns 0 when no gear needed', () => {
    expect(gearCompatibility(fullGear, noGear)).toBe(0)
  })

  it('returns 0 when user has no gear', () => {
    expect(gearCompatibility(noGear, fullGear)).toBe(0)
  })

  it('returns 2 per matching gear item', () => {
    const needs: GearSet = { rope: true, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }
    const has: GearSet = { rope: true, quickdraws: false, belayDevice: false, crashPad: false, helmet: false }
    expect(gearCompatibility(has, needs)).toBe(2)
  })

  it('caps at 10', () => {
    expect(gearCompatibility(fullGear, fullGear)).toBe(10)
  })

  it('scores partial matches correctly', () => {
    const needs: GearSet = { rope: true, quickdraws: true, belayDevice: true, crashPad: false, helmet: false }
    const has: GearSet = { rope: true, quickdraws: true, belayDevice: false, crashPad: false, helmet: false }
    expect(gearCompatibility(has, needs)).toBe(4)
  })
})

describe('experienceLevelScore', () => {
  it('returns 0 when either level is null', () => {
    expect(experienceLevelScore(null, 'beginner')).toBe(0)
    expect(experienceLevelScore('advanced', null)).toBe(0)
    expect(experienceLevelScore(null, null)).toBe(0)
  })

  it('returns 15 for exact match', () => {
    expect(experienceLevelScore('beginner', 'beginner')).toBe(15)
    expect(experienceLevelScore('intermediate', 'intermediate')).toBe(15)
    expect(experienceLevelScore('advanced', 'advanced')).toBe(15)
  })

  it('returns 5 for adjacent levels', () => {
    expect(experienceLevelScore('beginner', 'intermediate')).toBe(5)
    expect(experienceLevelScore('intermediate', 'advanced')).toBe(5)
  })

  it('returns 0 for distant levels', () => {
    expect(experienceLevelScore('beginner', 'advanced')).toBe(0)
  })
})

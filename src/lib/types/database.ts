export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type GearSet = {
  rope: boolean
  quickdraws: boolean
  belayDevice: boolean
  crashPad: boolean
  helmet: boolean
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type LocationType = 'gym' | 'crag'
export type GoalType = 'project' | 'mileage' | 'easy_day' | 'training' | 'any'
export type RequestStatus = 'active' | 'matched' | 'cancelled' | 'expired'
export type InterestStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  display_name: string
  photo_url: string
  home_area: string | null
  experience_level: ExperienceLevel | null
  sport_grade_range: string | null
  boulder_grade_range: string | null
  weight_kg: number | null
  share_weight: boolean
  gear: GearSet
  has_car: boolean
  bio: string | null
  languages: string[]
  phone: string | null
  instagram: string | null
  facebook: string | null
  created_at: string
  updated_at: string
}

export interface PartnerRequest {
  id: string
  user_id: string
  date: string
  start_time: string | null
  end_time: string | null
  flexible: boolean
  location_type: LocationType
  location_name: string
  goal_type: GoalType
  desired_grade_range: string | null
  notes: string | null
  needs_gear: GearSet
  carpool_needed: boolean
  weight_relevant: boolean
  max_weight_difference_kg: number | null
  status: RequestStatus
  created_at: string
  updated_at: string
}

export interface Interest {
  id: string
  from_user_id: string
  to_user_id: string
  request_id: string | null
  status: InterestStatus
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  details: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      partner_requests: {
        Row: PartnerRequest
        Insert: Omit<PartnerRequest, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: RequestStatus }
        Update: Partial<Omit<PartnerRequest, 'id' | 'created_at' | 'updated_at'>>
      }
      interests: {
        Row: Interest
        Insert: Omit<Interest, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: InterestStatus }
        Update: Partial<Omit<Interest, 'id' | 'created_at' | 'updated_at'>>
      }
      blocks: {
        Row: Block
        Insert: Omit<Block, 'id' | 'created_at'>
        Update: never
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at'>
        Update: never
      }
    }
    Enums: {
      experience_level: ExperienceLevel
      location_type: LocationType
      goal_type: GoalType
      request_status: RequestStatus
      interest_status: InterestStatus
    }
  }
}

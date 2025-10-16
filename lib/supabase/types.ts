export type UserRole = 'bdr' | 'manager' | 'admin'

export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export type ActivityType = 'call' | 'email' | 'meeting' | 'demo' | 'note'

export type ActivityOutcome =
  | 'successful'
  | 'no_answer'
  | 'voicemail'
  | 'callback_scheduled'
  | 'not_interested'

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type CommissionType = 'first_month' | 'ongoing' | 'bonus'

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'disputed'

export type StreakType = 'daily_calls' | 'weekly_meetings' | 'deal_closing'

export interface User {
  id: string
  clerk_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  team_id: string | null
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  manager_id: string | null
  created_at: string
}

export interface Customer {
  id: string
  hubspot_id: string | null
  apollo_id: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  phone: string | null
  enrichment_data: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  hubspot_id: string | null
  customer_id: string | null
  assigned_to: string
  deal_name: string
  deal_value: number
  stage: DealStage
  probability: number | null
  expected_close_date: string | null
  actual_close_date: string | null
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  customer_id: string | null
  deal_id: string | null
  activity_type: ActivityType
  subject: string | null
  description: string | null
  duration_minutes: number | null
  outcome: ActivityOutcome | null
  completed_at: string | null
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  customer_id: string | null
  deal_id: string | null
  title: string
  scheduled_start: string
  scheduled_end: string
  status: AppointmentStatus
  meeting_url: string | null
  location: string | null
  created_at: string
}

export interface Commission {
  id: string
  user_id: string
  deal_id: string
  commission_type: CommissionType
  rate: number
  amount: number
  period_start: string | null
  period_end: string | null
  status: CommissionStatus
  payment_date: string | null
  created_at: string
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string | null
  badge_image_url: string | null
  category: string | null
  points: number
  criteria: Record<string, any>
  active: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

export interface Streak {
  id: string
  user_id: string
  streak_type: StreakType
  current_count: number
  longest_count: number
  last_activity_date: string | null
  created_at: string
  updated_at: string
}

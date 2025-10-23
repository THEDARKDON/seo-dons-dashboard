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

// Messaging Types
export type ChannelType = 'public' | 'private' | 'team'
export type ChannelMemberRole = 'owner' | 'admin' | 'member'
export type UserPresenceStatus = 'online' | 'away' | 'dnd' | 'offline'

export interface Channel {
  id: string
  name: string
  description: string | null
  type: ChannelType
  team_id: string | null
  created_by: string | null
  is_archived: boolean
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ChannelMember {
  id: string
  channel_id: string
  user_id: string
  role: ChannelMemberRole
  joined_at: string
  last_read_at: string
  notifications_enabled: boolean
}

export interface DirectMessage {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  content: string
  sender_id: string
  channel_id: string | null
  dm_id: string | null
  parent_message_id: string | null
  thread_reply_count: number
  mentions: string[] | null
  attachments: MessageAttachment[] | null
  edited_at: string | null
  deleted_at: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  type: string
  url: string
  name: string
  size: number
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface MessageReadReceipt {
  id: string
  user_id: string
  message_id: string
  read_at: string
}

export interface UserPresence {
  user_id: string
  status: UserPresenceStatus
  custom_status: string | null
  last_seen_at: string
  updated_at: string
}

// Extended types with relations
export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar_url'>
}

export interface ChannelWithDetails extends Channel {
  member_count?: number
  unread_count?: number
  last_message?: MessageWithSender
}

export interface DirectMessageWithDetails extends DirectMessage {
  other_participant: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar_url'>
  unread_count?: number
  last_message?: MessageWithSender
}

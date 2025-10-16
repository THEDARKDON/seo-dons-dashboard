import { supabase } from '@/lib/supabase/client'
import { Achievement } from '@/lib/supabase/types'

/**
 * Achievement Tracker Service
 * Handles gamification logic for tracking and awarding achievements
 */

interface AchievementCriteria {
  type: string
  threshold: number
}

export class AchievementTracker {
  /**
   * Check if user has earned any new achievements based on their activity
   */
  static async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const earnedAchievements: Achievement[] = []

    // Get all active achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('active', true)

    if (!achievements) return earnedAchievements

    // Get user's existing achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const existingIds = new Set(existingAchievements?.map(a => a.achievement_id) || [])

    // Check each achievement
    for (const achievement of achievements) {
      if (existingIds.has(achievement.id)) continue

      const criteria = achievement.criteria as AchievementCriteria
      const hasEarned = await this.checkCriteria(userId, criteria)

      if (hasEarned) {
        // Award achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          })

        earnedAchievements.push(achievement)
      }
    }

    return earnedAchievements
  }

  /**
   * Check if user meets criteria for an achievement
   */
  private static async checkCriteria(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<boolean> {
    switch (criteria.type) {
      case 'call_count':
        return this.checkCallCount(userId, criteria.threshold)

      case 'daily_calls':
        return this.checkDailyCalls(userId, criteria.threshold)

      case 'deals_closed':
        return this.checkDealsCloses(userId, criteria.threshold)

      case 'total_revenue':
        return this.checkTotalRevenue(userId, criteria.threshold)

      case 'meetings_set':
        return this.checkMeetingsSet(userId, criteria.threshold)

      case 'daily_streak':
        return this.checkDailyStreak(userId, criteria.threshold)

      default:
        return false
    }
  }

  private static async checkCallCount(userId: string, threshold: number): Promise<boolean> {
    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'call')

    return (count || 0) >= threshold
  }

  private static async checkDailyCalls(userId: string, threshold: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]

    const { count } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'call')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)

    return (count || 0) >= threshold
  }

  private static async checkDealsCloses(userId: string, threshold: number): Promise<boolean> {
    const { count } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('stage', 'closed_won')

    return (count || 0) >= threshold
  }

  private static async checkTotalRevenue(userId: string, threshold: number): Promise<boolean> {
    const { data: deals } = await supabase
      .from('deals')
      .select('deal_value')
      .eq('assigned_to', userId)
      .eq('stage', 'closed_won')

    if (!deals) return false

    const totalRevenue = deals.reduce((sum, deal) => sum + Number(deal.deal_value), 0)
    return totalRevenue >= threshold
  }

  private static async checkMeetingsSet(userId: string, threshold: number): Promise<boolean> {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return (count || 0) >= threshold
  }

  private static async checkDailyStreak(userId: string, threshold: number): Promise<boolean> {
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_count')
      .eq('user_id', userId)
      .eq('streak_type', 'daily_calls')
      .single()

    return (streak?.current_count || 0) >= threshold
  }

  /**
   * Get user's total achievement points
   */
  static async getUserPoints(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_achievements')
      .select(`
        achievements:achievement_id (
          points
        )
      `)
      .eq('user_id', userId)

    if (!data) return 0

    return data.reduce((sum: number, item: any) => {
      return sum + (item.achievements?.points || 0)
    }, 0)
  }
}

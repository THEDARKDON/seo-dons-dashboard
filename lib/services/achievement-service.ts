import { createClient } from '@/lib/supabase/server';

export type AchievementCriteria = {
  type: 'call_count' | 'daily_calls' | 'deals_closed' | 'total_revenue' | 'meetings_set' | 'daily_streak';
  threshold: number;
};

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string;
  badge_image_url: string | null;
  category: string | null;
  points: number;
  criteria: AchievementCriteria;
  active: boolean;
  created_at: string;
};

export class AchievementService {
  /**
   * Check and award achievements for a user based on their activity
   */
  static async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient();
    const newAchievements: Achievement[] = [];

    // Get all active achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('active', true);

    if (!achievements) return [];

    // Get user's existing achievements
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedAchievementIds = new Set(
      userAchievements?.map((ua) => ua.achievement_id) || []
    );

    // Check each achievement criteria
    for (const achievement of achievements) {
      // Skip if already earned
      if (earnedAchievementIds.has(achievement.id)) continue;

      const criteria = achievement.criteria as AchievementCriteria;
      const qualified = await this.checkCriteria(userId, criteria);

      if (qualified) {
        // Award the achievement
        const { error } = await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

        if (!error) {
          newAchievements.push(achievement as Achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check if user meets criteria for an achievement
   */
  private static async checkCriteria(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<boolean> {
    const supabase = await createClient();

    switch (criteria.type) {
      case 'call_count': {
        const { count } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'call');
        return (count || 0) >= criteria.threshold;
      }

      case 'daily_calls': {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('activity_type', 'call')
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`);
        return (count || 0) >= criteria.threshold;
      }

      case 'deals_closed': {
        const { count } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('stage', 'closed_won');
        return (count || 0) >= criteria.threshold;
      }

      case 'total_revenue': {
        const { data: deals } = await supabase
          .from('deals')
          .select('deal_value')
          .eq('assigned_to', userId)
          .eq('stage', 'closed_won');
        const totalRevenue = deals?.reduce((sum, d) => sum + Number(d.deal_value), 0) || 0;
        return totalRevenue >= criteria.threshold;
      }

      case 'meetings_set': {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['scheduled', 'completed']);
        return (count || 0) >= criteria.threshold;
      }

      case 'daily_streak': {
        const { data: streak } = await supabase
          .from('streaks')
          .select('current_count, longest_count')
          .eq('user_id', userId)
          .eq('streak_type', 'daily_calls')
          .single();

        const maxStreak = Math.max(
          streak?.current_count || 0,
          streak?.longest_count || 0
        );
        return maxStreak >= criteria.threshold;
      }

      default:
        return false;
    }
  }

  /**
   * Get all achievements earned by a user
   */
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        achievements (*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    return (data?.map((ua: any) => ({
      ...ua.achievements,
      earned_at: ua.earned_at,
    })) || []) as Achievement[];
  }

  /**
   * Get user's total achievement points
   */
  static async getUserPoints(userId: string): Promise<number> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_achievements')
      .select('achievements(points)')
      .eq('user_id', userId);

    return data?.reduce((sum: number, ua: any) => sum + (ua.achievements?.points || 0), 0) || 0;
  }

  /**
   * Get available achievements (not yet earned)
   */
  static async getAvailableAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient();

    // Get all active achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('active', true);

    // Get earned achievement IDs
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);

    return (allAchievements?.filter((a) => !earnedIds.has(a.id)) || []) as Achievement[];
  }

  /**
   * Get recent achievements across all users (for leaderboard)
   */
  static async getRecentAchievements(limit: number = 10) {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        users (first_name, last_name, avatar_url),
        achievements (name, description, badge_image_url, points)
      `)
      .order('earned_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

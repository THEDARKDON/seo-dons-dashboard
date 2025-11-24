import { createClient } from '@/lib/supabase/server';

export type StreakType = 'daily_calls' | 'weekly_meetings' | 'deal_closing';

export type Streak = {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export class StreakService {
  /**
   * Update user's daily call streak
   */
  static async updateDailyCallStreak(userId: string): Promise<Streak | null> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if user has calls today
    const { count: callsToday } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'call')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`);

    if (!callsToday || callsToday === 0) {
      return null;
    }

    // Get or create streak record
    let { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'daily_calls')
      .single();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!streak) {
      // Create new streak
      const { data: newStreak } = await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          streak_type: 'daily_calls',
          current_count: 1,
          longest_count: 1,
          last_activity_date: today,
        })
        .select()
        .single();

      return newStreak as Streak;
    }

    // Check if streak continues
    if (streak.last_activity_date === yesterdayStr) {
      // Streak continues
      const newCount = streak.current_count + 1;
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .update({
          current_count: newCount,
          longest_count: Math.max(newCount, streak.longest_count),
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
        .select()
        .single();

      return updatedStreak as Streak;
    } else if (streak.last_activity_date !== today) {
      // Streak broken, reset
      const { data: updatedStreak } = await supabase
        .from('streaks')
        .update({
          current_count: 1,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', streak.id)
        .select()
        .single();

      return updatedStreak as Streak;
    }

    return streak as Streak;
  }

  /**
   * Update weekly meetings streak
   */
  static async updateWeeklyMeetingsStreak(userId: string): Promise<Streak | null> {
    const supabase = await createClient();

    // Get start of current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Check if user has meetings this week
    const { count: meetingsThisWeek } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('scheduled_start', startOfWeek.toISOString())
      .in('status', ['scheduled', 'completed']);

    if (!meetingsThisWeek || meetingsThisWeek === 0) {
      return null;
    }

    // Get or create streak record
    let { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', 'weekly_meetings')
      .single();

    const weekStr = startOfWeek.toISOString().split('T')[0];

    if (!streak) {
      const { data: newStreak } = await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          streak_type: 'weekly_meetings',
          current_count: 1,
          longest_count: 1,
          last_activity_date: weekStr,
        })
        .select()
        .single();

      return newStreak as Streak;
    }

    // Check if this is a new week
    if (streak.last_activity_date !== weekStr) {
      const lastWeekStart = new Date(streak.last_activity_date || '');
      const daysDiff = Math.floor(
        (startOfWeek.getTime() - lastWeekStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 7) {
        // Consecutive week
        const newCount = streak.current_count + 1;
        const { data: updatedStreak } = await supabase
          .from('streaks')
          .update({
            current_count: newCount,
            longest_count: Math.max(newCount, streak.longest_count),
            last_activity_date: weekStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id)
          .select()
          .single();

        return updatedStreak as Streak;
      } else {
        // Streak broken
        const { data: updatedStreak } = await supabase
          .from('streaks')
          .update({
            current_count: 1,
            last_activity_date: weekStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', streak.id)
          .select()
          .single();

        return updatedStreak as Streak;
      }
    }

    return streak as Streak;
  }

  /**
   * Get all streaks for a user
   */
  static async getUserStreaks(userId: string): Promise<Streak[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    return (data || []) as Streak[];
  }

  /**
   * Get top streaks across all users for leaderboard
   */
  static async getTopStreaks(streakType: StreakType, limit: number = 10) {
    const supabase = await createClient();

    const { data } = await supabase
      .from('streaks')
      .select(`
        *,
        users (first_name, last_name, avatar_url)
      `)
      .eq('streak_type', streakType)
      .order('current_count', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

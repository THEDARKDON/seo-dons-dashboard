import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { AchievementService } from '@/lib/services/achievement-service';
import { StreakService } from '@/lib/services/streak-service';
import { Trophy, Flame, Target, Award, Lock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function getAchievementsData(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return {
      earnedAchievements: [],
      availableAchievements: [],
      streaks: [],
      totalPoints: 0,
    };
  }

  const [earnedAchievements, availableAchievements, streaks, totalPoints] = await Promise.all([
    AchievementService.getUserAchievements(user.id),
    AchievementService.getAvailableAchievements(user.id),
    StreakService.getUserStreaks(user.id),
    AchievementService.getUserPoints(user.id),
  ]);

  return {
    earnedAchievements,
    availableAchievements,
    streaks,
    totalPoints,
    user,
  };
}

const categoryColors = {
  activity: 'bg-blue-500',
  sales: 'bg-green-500',
  streak: 'bg-orange-500',
  milestone: 'bg-purple-500',
};

const streakTypeLabels = {
  daily_calls: 'Daily Calls',
  weekly_meetings: 'Weekly Meetings',
  deal_closing: 'Deal Closing',
};

export default async function AchievementsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { earnedAchievements, availableAchievements, streaks, totalPoints, user } =
    await getAchievementsData(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="text-3xl font-bold">{totalPoints}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>
      </div>

      {/* Streaks */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Active Streaks
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {streaks.length === 0 ? (
            <Card className="md:col-span-3">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active streaks. Start making calls or scheduling meetings to build your streak!
              </CardContent>
            </Card>
          ) : (
            streaks.map((streak) => (
              <Card key={streak.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <p className="font-medium">
                        {streakTypeLabels[streak.streak_type as keyof typeof streakTypeLabels]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{streak.current_count}</p>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-lg font-semibold text-muted-foreground">
                      {streak.longest_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Longest Streak</p>
                  </div>
                  {streak.last_activity_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last: {formatDate(streak.last_activity_date)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Earned Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Earned Achievements ({earnedAchievements.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {earnedAchievements.length === 0 ? (
            <Card className="md:col-span-3">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No achievements earned yet. Start working to unlock achievements!
              </CardContent>
            </Card>
          ) : (
            earnedAchievements.map((achievement: any) => (
              <Card key={achievement.id} className="border-2 border-yellow-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-yellow-500/10 p-3">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        {achievement.category && (
                          <Badge
                            variant="secondary"
                            className={`mt-1 ${
                              categoryColors[
                                achievement.category as keyof typeof categoryColors
                              ] || 'bg-gray-500'
                            } text-white`}
                          >
                            {achievement.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{achievement.points} points</span>
                    </div>
                    {achievement.earned_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(achievement.earned_at)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Available Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          Available Achievements ({availableAchievements.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {availableAchievements.length === 0 ? (
            <Card className="md:col-span-3">
              <CardContent className="pt-6 text-center text-muted-foreground">
                You&apos;ve earned all available achievements! Great work! 🎉
              </CardContent>
            </Card>
          ) : (
            availableAchievements.map((achievement: any) => (
              <Card key={achievement.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-3">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        {achievement.category && (
                          <Badge variant="outline" className="mt-1">
                            {achievement.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {achievement.points} points
                      </span>
                    </div>
                    {achievement.criteria && (
                      <span className="text-xs text-muted-foreground">
                        Goal: {achievement.criteria.threshold}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

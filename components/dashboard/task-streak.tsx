'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStreakProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  totalPoints: number;
}

export function TaskStreak({
  currentStreak,
  longestStreak,
  totalDays,
  totalPoints
}: TaskStreakProps) {
  // Determine streak level
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { label: 'Legendary', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (streak >= 14) return { label: 'Fire', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (streak >= 7) return { label: 'Hot', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (streak >= 3) return { label: 'Warming Up', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Getting Started', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const level = getStreakLevel(currentStreak);
  const isPersonalBest = currentStreak === longestStreak && currentStreak > 0;

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          {/* Streak display */}
          <div className="flex items-center gap-3">
            <div className={cn('rounded-full p-3', level.bgColor)}>
              <Flame className={cn('h-6 w-6', level.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{currentStreak}</span>
                <span className="text-sm text-gray-600">day{currentStreak !== 1 && 's'}</span>
              </div>
              <p className={cn('text-sm font-semibold', level.color)}>{level.label} Streak</p>
            </div>
          </div>

          {/* Personal best badge */}
          {isPersonalBest && currentStreak > 0 && (
            <div className="flex flex-col items-center gap-1 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-sm">
              <Trophy className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white">PB!</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-orange-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-3 w-3 text-gray-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">{longestStreak}</div>
            <p className="text-xs text-gray-600">Best Streak</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-gray-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">{totalDays}</div>
            <p className="text-xs text-gray-600">Total Days</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="h-3 w-3 text-gray-500" />
            </div>
            <div className="text-xl font-bold text-amber-600">{totalPoints}</div>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
        </div>

        {/* Motivational message */}
        {currentStreak === 0 && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg text-center">
            <p className="text-sm text-gray-700">Complete all required tasks to start your streak! 🚀</p>
          </div>
        )}
        {currentStreak > 0 && currentStreak < 3 && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg text-center">
            <p className="text-sm text-gray-700">Keep going! You&apos;re building momentum 💪</p>
          </div>
        )}
        {currentStreak >= 3 && currentStreak < 7 && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg text-center">
            <p className="text-sm text-gray-700">Amazing! You&apos;re on fire 🔥</p>
          </div>
        )}
        {currentStreak >= 7 && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg text-center">
            <p className="text-sm text-gray-700">Unstoppable! Keep that streak alive 🌟</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

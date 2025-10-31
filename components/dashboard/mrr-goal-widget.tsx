'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressSlider } from './progress-slider';
import { TrendingUp, Target } from 'lucide-react';

interface MRRGoalWidgetProps {
  current: number;
  minimum: number;
  target: number;
  previousMonth?: number;
}

export function MRRGoalWidget({
  current,
  minimum,
  target,
  previousMonth
}: MRRGoalWidgetProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate month-over-month growth
  const monthlyGrowth = previousMonth && previousMonth > 0
    ? ((current - previousMonth) / previousMonth) * 100
    : 0;

  const isGrowing = monthlyGrowth > 0;

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Monthly Recurring Revenue
          </CardTitle>
          {previousMonth !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${isGrowing ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-4 w-4 ${!isGrowing && 'rotate-180'}`} />
              {isGrowing && '+'}{monthlyGrowth.toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact current value display */}
        <div className="text-center py-2">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {formatCurrency(current)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </div>

        {/* Progress slider */}
        <ProgressSlider
          current={current}
          minimum={minimum}
          target={target}
          showValues={false}
        />

        {/* Compact goal breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Minimum</p>
            <p className="text-base font-bold text-orange-600">{formatCurrency(minimum)}</p>
            <div className="flex items-center gap-1 text-xs">
              {current >= minimum ? (
                <span className="text-green-600 font-medium">✓ Done</span>
              ) : (
                <span className="text-gray-600">{formatCurrency(minimum - current)} left</span>
              )}
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(target)}</p>
            <div className="flex items-center gap-1 text-xs">
              {current >= target ? (
                <span className="text-green-600 font-medium">✓ Done</span>
              ) : (
                <span className="text-gray-600">{formatCurrency(target - current)} left</span>
              )}
            </div>
          </div>
        </div>

        {/* Compact achievement badges */}
        {current >= target && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-green-700">🎉 Target Smashed!</p>
          </div>
        )}
        {current >= minimum && current < target && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-2 text-center">
            <p className="text-sm font-semibold text-orange-700">💪 Great Progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

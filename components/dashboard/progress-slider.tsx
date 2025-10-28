'use client';

import { cn } from '@/lib/utils';

interface ProgressSliderProps {
  current: number;
  minimum: number;
  target: number;
  label?: string;
  showValues?: boolean;
  className?: string;
}

export function ProgressSlider({
  current,
  minimum,
  target,
  label,
  showValues = true,
  className
}: ProgressSliderProps) {
  // Calculate percentages
  const percentToTarget = Math.min((current / target) * 100, 100);
  const minimumPercent = (minimum / target) * 100;

  // Determine color based on progress
  const getColorClass = () => {
    if (current >= target) return 'from-green-500 to-emerald-600';
    if (current >= minimum) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValues && (
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(current)} / {formatCurrency(target)}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Background track */}
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
          {/* Progress fill with gradient */}
          <div
            className={cn(
              'h-full bg-gradient-to-r transition-all duration-500 ease-out',
              getColorClass()
            )}
            style={{ width: `${percentToTarget}%` }}
          >
            {/* Shimmer effect */}
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Minimum goal marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm"
          style={{ left: `${minimumPercent}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-medium text-gray-600">
              Min {formatCurrency(minimum)}
            </span>
          </div>
        </div>

        {/* Current value indicator */}
        {percentToTarget > 0 && percentToTarget < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border-2 border-gray-300 transition-all duration-500"
            style={{ left: `calc(${percentToTarget}% - 6px)` }}
          />
        )}
      </div>

      {/* Status messages */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {current >= target && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Target Achieved!
            </span>
          )}
          {current >= minimum && current < target && (
            <span className="flex items-center gap-1 text-orange-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              Minimum Achieved
            </span>
          )}
          {current < minimum && (
            <span className="text-red-600 font-medium">
              {formatCurrency(minimum - current)} to minimum
            </span>
          )}
        </div>
        <div className="text-gray-500">
          {percentToTarget.toFixed(1)}% to target
        </div>
      </div>
    </div>
  );
}

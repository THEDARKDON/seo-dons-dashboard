'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Phone, Calendar, Linkedin, Search, FileText, Star } from 'lucide-react';

interface DailyTask {
  id: string;
  task_type: string;
  target_value: number | null;
  current_value: number;
  completed: boolean;
  points_earned: number;
}

interface DailyTaskCardProps {
  tasks: DailyTask[];
  onTaskToggle: (taskType: string, completed: boolean) => Promise<void>;
}

const taskConfig = {
  calls: {
    label: 'Calls Made',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    required: true,
    points: 20,
  },
  appointments: {
    label: 'Appointments Booked',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    required: true,
    points: 30,
  },
  linkedin: {
    label: 'LinkedIn Post',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    required: false,
    points: 10,
  },
  prospecting: {
    label: 'Prospecting',
    icon: Search,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    required: false,
    points: 15,
  },
  research: {
    label: 'Research',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    required: false,
    points: 10,
  },
};

export function DailyTaskCard({ tasks, onTaskToggle }: DailyTaskCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (taskType: string, currentCompleted: boolean) => {
    setLoading(taskType);
    try {
      await onTaskToggle(taskType, !currentCompleted);
    } finally {
      setLoading(null);
    }
  };

  // Separate required and optional tasks
  const requiredTasks = tasks.filter(t => taskConfig[t.task_type as keyof typeof taskConfig]?.required);
  const optionalTasks = tasks.filter(t => !taskConfig[t.task_type as keyof typeof taskConfig]?.required);

  // Calculate total points
  const totalPointsEarned = tasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
  const maxPossiblePoints = Object.values(taskConfig).reduce((sum, config) => sum + config.points, 0);

  const renderTask = (task: DailyTask) => {
    const config = taskConfig[task.task_type as keyof typeof taskConfig];
    if (!config) return null;

    const Icon = config.icon;
    const hasTarget = task.target_value !== null && task.target_value > 0;
    const progress = hasTarget && task.target_value
      ? Math.min((task.current_value / task.target_value) * 100, 100)
      : 0;
    const isComplete = hasTarget && task.target_value
      ? task.current_value >= task.target_value
      : task.completed;

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
          isComplete ? 'bg-gray-50 border-gray-200' : `${config.bgColor} ${config.borderColor}`,
          loading === task.task_type && 'opacity-50'
        )}
      >
        <div className="flex items-center pt-0.5">
          <Checkbox
            checked={isComplete}
            onCheckedChange={() => handleToggle(task.task_type, isComplete)}
            disabled={loading === task.task_type || (hasTarget && task.current_value < task.target_value)}
            className="h-5 w-5"
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', config.color)} />
              <span className={cn('font-medium', isComplete && 'line-through text-gray-500')}>
                {config.label}
              </span>
              {!config.required && (
                <span className="text-xs text-gray-500 italic">Optional</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-3 w-3 fill-amber-600" />
              {config.points}
            </div>
          </div>

          {hasTarget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {task.current_value} / {task.target_value}
                </span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2">
              <Star className="h-4 w-4 text-white fill-white" />
            </div>
            Today&apos;s Tasks
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">{totalPointsEarned}</div>
            <div className="text-xs text-gray-500">/ {maxPossiblePoints} points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Tasks */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <div className="h-1 w-1 bg-red-500 rounded-full" />
            Required
          </h3>
          {requiredTasks.map(renderTask)}
        </div>

        {/* Optional Tasks */}
        {optionalTasks.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <div className="h-1 w-1 bg-blue-500 rounded-full" />
              Bonus Tasks
            </h3>
            {optionalTasks.map(renderTask)}
          </div>
        )}

        {/* Progress summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Daily Progress</span>
            <span className="font-semibold">
              {tasks.filter(t => t.completed).length} / {tasks.length} completed
            </span>
          </div>
          <Progress
            value={(tasks.filter(t => t.completed).length / tasks.length) * 100}
            className="h-2 mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}

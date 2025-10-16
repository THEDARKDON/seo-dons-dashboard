'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { Phone, Calendar, Mail, MessageSquare } from 'lucide-react';

interface DealActivitiesProps {
  activities: any[];
}

const activityIcons = {
  call: Phone,
  meeting: Calendar,
  email: Mail,
  note: MessageSquare,
  demo: Calendar,
};

const outcomeColors = {
  successful: 'success',
  no_answer: 'secondary',
  voicemail: 'secondary',
  callback_scheduled: 'default',
  not_interested: 'destructive',
} as const;

export function DealActivities({ activities }: DealActivitiesProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No activities logged yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities ({activities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || MessageSquare;

            return (
              <div key={activity.id} className="flex gap-4 rounded-lg border p-4">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{activity.subject || activity.activity_type}</p>
                    {activity.outcome && (
                      <Badge variant={outcomeColors[activity.outcome as keyof typeof outcomeColors]}>
                        {activity.outcome.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>

                  {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatDateTime(activity.completed_at || activity.created_at)}</span>
                    {activity.duration_minutes && (
                      <span>{activity.duration_minutes} minutes</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

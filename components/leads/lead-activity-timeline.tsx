'use client';

import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Calendar, FileText, TrendingUp, UserCheck } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  subject?: string;
  description?: string;
  outcome?: string;
  duration_minutes?: number;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
  };
}

interface LeadActivityTimelineProps {
  leadId: string;
  initialActivities: Activity[];
}

const activityIcons = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  meeting: Calendar,
  note: FileText,
  status_change: TrendingUp,
  assigned: UserCheck,
} as const;

const activityColors = {
  call: 'text-blue-600 bg-blue-100',
  email: 'text-purple-600 bg-purple-100',
  sms: 'text-green-600 bg-green-100',
  meeting: 'text-orange-600 bg-orange-100',
  note: 'text-gray-600 bg-gray-100',
  status_change: 'text-yellow-600 bg-yellow-100',
  assigned: 'text-indigo-600 bg-indigo-100',
};

export function LeadActivityTimeline({
  leadId,
  initialActivities,
}: LeadActivityTimelineProps) {
  if (initialActivities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialActivities.map((activity, index) => {
        const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || FileText;
        const colorClass = activityColors[activity.activity_type as keyof typeof activityColors] || activityColors.note;

        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < initialActivities.length - 1 && (
                <div className="w-px h-full bg-border mt-2" />
              )}
            </div>

            {/* Activity Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {activity.subject || activity.activity_type.replace('_', ' ').toUpperCase()}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {activity.users && (
                      <span className="text-xs text-muted-foreground">
                        by {activity.users.first_name} {activity.users.last_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.created_at)}
                    </span>
                    {activity.duration_minutes && (
                      <Badge variant="outline" className="text-xs">
                        {activity.duration_minutes} min
                      </Badge>
                    )}
                    {activity.outcome && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.outcome.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

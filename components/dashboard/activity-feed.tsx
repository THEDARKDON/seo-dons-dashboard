import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { Phone, Mail, Calendar, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  demo: Calendar,
};

const outcomeColors = {
  successful: 'success',
  no_answer: 'secondary',
  voicemail: 'secondary',
  callback_scheduled: 'default',
  not_interested: 'destructive',
} as const;

export async function ActivityFeed({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return null;
  }

  // Get recent activities
  const { data: activities } = await supabase
    .from('activities')
    .select(`
      *,
      customers (first_name, last_name, company)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No activities yet. Start logging calls!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Phone;
            const customer = activity.customers as any;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                      {customer && (
                        <span className="text-muted-foreground ml-1">
                          with {customer.first_name} {customer.last_name}
                        </span>
                      )}
                    </p>
                    {activity.outcome && (
                      <Badge variant={outcomeColors[activity.outcome as keyof typeof outcomeColors]}>
                        {activity.outcome.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  {activity.subject && (
                    <p className="text-sm text-muted-foreground">{activity.subject}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

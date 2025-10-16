import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDateTime } from '@/lib/utils';
import { Plus, Calendar } from 'lucide-react';
import Link from 'next/link';

async function getAppointments(userId: string) {
  const supabase = await createClient();

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return [];
  }

  // Get appointments
  const { data: appointments } = await supabase
    .from('activities')
    .select(`
      *,
      customers (first_name, last_name, company),
      deals (deal_name)
    `)
    .eq('user_id', user.id)
    .eq('activity_type', 'appointment')
    .order('scheduled_at', { ascending: true })
    .limit(50);

  return appointments || [];
}

export default async function AppointmentsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const appointments = await getAppointments(userId);

  // Separate upcoming and past appointments
  const now = new Date();
  const upcoming = appointments.filter(a => a.scheduled_at && new Date(a.scheduled_at) >= now);
  const past = appointments.filter(a => a.scheduled_at && new Date(a.scheduled_at) < now);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage your scheduled meetings</p>
        </div>
        <Link href="/dashboard/calls/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => {
                const customer = appointment.customers as any;
                const deal = appointment.deals as any;

                return (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {customer ? (
                              <>
                                {customer.first_name} {customer.last_name}
                                {customer.company && (
                                  <span className="text-muted-foreground ml-2">
                                    · {customer.company}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Unknown Contact'
                            )}
                          </p>
                          {appointment.subject && (
                            <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                          )}
                          {deal && (
                            <p className="text-sm text-muted-foreground">
                              Related to: {deal.deal_name}
                            </p>
                          )}
                        </div>
                        <Badge variant="default">Upcoming</Badge>
                      </div>
                      {appointment.description && (
                        <p className="text-sm text-muted-foreground">{appointment.description}</p>
                      )}
                      <p className="text-sm font-medium text-primary">
                        {formatDateTime(appointment.scheduled_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.slice(0, 10).map((appointment) => {
                const customer = appointment.customers as any;
                const deal = appointment.deals as any;

                return (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors opacity-60"
                  >
                    <div className="rounded-full bg-muted p-2">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {customer ? (
                              <>
                                {customer.first_name} {customer.last_name}
                                {customer.company && (
                                  <span className="text-muted-foreground ml-2">
                                    · {customer.company}
                                  </span>
                                )}
                              </>
                            ) : (
                              'Unknown Contact'
                            )}
                          </p>
                          {appointment.subject && (
                            <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                          )}
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(appointment.scheduled_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

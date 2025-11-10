'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Calendar, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SDRStats {
  user_id: string;
  first_name: string;
  last_name: string;
  calls_made: number;
  appointments_booked: number;
  deals_closed: number;
}

export function ActivityLeaderboard() {
  const [stats, setStats] = useState<SDRStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all SDRs, managers, and admins
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('role', ['bdr', 'manager', 'admin']);

      if (!users) {
        setStats([]);
        return;
      }

      // Get stats for each user
      const statsPromises = users.map(async (user) => {
        // Count calls today
        const { count: callsCount } = await supabase
          .from('call_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        // Count appointments today
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        // Count deals closed this month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const { count: dealsCount } = await supabase
          .from('deals')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('stage', 'closed_won')
          .gte('actual_close_date', monthStart.toISOString());

        return {
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          calls_made: callsCount || 0,
          appointments_booked: appointmentsCount || 0,
          deals_closed: dealsCount || 0,
        };
      });

      const results = await Promise.all(statsPromises);

      // Sort by total activity (calls + appointments * 2 + deals * 5)
      const sorted = results.sort((a, b) => {
        const scoreA = a.calls_made + (a.appointments_booked * 2) + (a.deals_closed * 5);
        const scoreB = b.calls_made + (b.appointments_booked * 2) + (b.deals_closed * 5);
        return scoreB - scoreA;
      });

      setStats(sorted.slice(0, 5)); // Top 5
    } catch (error) {
      console.error('Error fetching activity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Activity Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 h-10 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Activity Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground text-sm py-4">
            No activity yet today
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Team Activity Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((sdr, index) => (
            <div
              key={sdr.user_id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              {/* Rank */}
              <div className="w-6 text-center font-bold text-muted-foreground text-sm">
                #{index + 1}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {sdr.first_name[0]}{sdr.last_name[0]}
                </AvatarFallback>
              </Avatar>

              {/* Name and Stats */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {sdr.first_name} {sdr.last_name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{sdr.calls_made}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{sdr.appointments_booked}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    <span>{sdr.deals_closed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Updates every 30 seconds
        </p>
      </CardContent>
    </Card>
  );
}

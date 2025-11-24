'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';
import { Trophy, TrendingUp, Phone, Calendar, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_revenue: number;
  deals_closed: number;
  calls_made: number;
  appointments_booked: number;
  customers_converted: number;
  rank: number;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deals'
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Get current month's start date
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Get all users (BDRs, managers, admins)
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .in('role', ['bdr', 'manager', 'admin']);

      if (!users) {
        setLeaderboard([]);
        return;
      }

      // Fetch stats for each user in parallel
      const statsPromises = users.map(async (user) => {
        // Get deals closed this month
        const { data: deals } = await supabase
          .from('deals')
          .select('deal_value')
          .eq('assigned_to', user.id)
          .eq('stage', 'closed_won')
          .gte('actual_close_date', monthStart.toISOString());

        const total_revenue = deals?.reduce((sum, deal) => sum + Number(deal.deal_value), 0) || 0;
        const deals_closed = deals?.length || 0;

        // Get calls made this month
        const { count: calls_made } = await supabase
          .from('call_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart.toISOString());

        // Get appointments booked this month
        const { count: appointments_booked } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart.toISOString());

        // Get customers converted this month (leads converted to customers)
        const { count: customers_converted } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .gte('created_at', monthStart.toISOString());

        return {
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          total_revenue,
          deals_closed,
          calls_made: calls_made || 0,
          appointments_booked: appointments_booked || 0,
          customers_converted: customers_converted || 0,
        };
      });

      const results = await Promise.all(statsPromises);

      // Sort by revenue and add ranks
      const sorted = results
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(sorted);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sales Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-6 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sales Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No deals closed this month yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Sales Leaderboard
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (This Month)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 text-center font-semibold">
                  {entry.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />}
                  {entry.rank === 2 && <Trophy className="w-5 h-5 text-gray-400 mx-auto" />}
                  {entry.rank === 3 && <Trophy className="w-5 h-5 text-amber-700 mx-auto" />}
                  {entry.rank > 3 && <span className="text-muted-foreground">#{entry.rank}</span>}
                </div>
                <Avatar>
                  {entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
                  <AvatarFallback>
                    {entry.first_name[0]}{entry.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {entry.first_name} {entry.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Deals Closed">
                      <TrendingUp className="h-3 w-3" />
                      <span>{entry.deals_closed}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Calls Made">
                      <Phone className="h-3 w-3" />
                      <span>{entry.calls_made}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Appointments Booked">
                      <Calendar className="h-3 w-3" />
                      <span>{entry.appointments_booked}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Customers Converted">
                      <Users className="h-3 w-3" />
                      <span>{entry.customers_converted}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {formatCurrency(entry.total_revenue)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

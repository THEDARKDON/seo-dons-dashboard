'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase/client';
import { Trophy, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_revenue: number;
  deals_closed: number;
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

      const { data: deals } = await supabase
        .from('deals')
        .select(`
          assigned_to,
          deal_value,
          users!inner(first_name, last_name, avatar_url)
        `)
        .eq('stage', 'closed_won')
        .gte('actual_close_date', monthStart.toISOString());

      if (!deals) {
        setLeaderboard([]);
        return;
      }

      // Aggregate by user
      const userTotals = deals.reduce((acc: any, deal: any) => {
        const userId = deal.assigned_to;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            first_name: deal.users.first_name,
            last_name: deal.users.last_name,
            avatar_url: deal.users.avatar_url,
            total_revenue: 0,
            deals_closed: 0
          };
        }
        acc[userId].total_revenue += Number(deal.deal_value);
        acc[userId].deals_closed += 1;
        return acc;
      }, {});

      // Sort by revenue and add ranks
      const sorted = Object.values(userTotals)
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .map((entry: any, index) => ({ ...entry, rank: index + 1 }));

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
                <div>
                  <p className="font-semibold">
                    {entry.first_name} {entry.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {entry.deals_closed} {entry.deals_closed === 1 ? 'deal' : 'deals'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(entry.total_revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

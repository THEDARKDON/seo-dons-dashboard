import { Suspense } from 'react';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { Card, CardContent } from '@/components/ui/card';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">See how you stack up against the team</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🥇</div>
              <p className="text-sm text-muted-foreground">First Place</p>
              <p className="text-xs text-muted-foreground mt-1">Wins bragging rights</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-sm text-muted-foreground">Current Month</p>
              <p className="text-xs text-muted-foreground mt-1">Rankings reset monthly</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-sm text-muted-foreground">Real-time</p>
              <p className="text-xs text-muted-foreground mt-1">Updates instantly</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div>Loading leaderboard...</div>}>
        <Leaderboard />
      </Suspense>

      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">How Rankings Work</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Rankings are based on total revenue from <strong>closed deals</strong> this month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Each entry shows: <strong>Deals Closed, Calls Made, Appointments Booked, Customers Converted</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Updates happen in <strong>real-time</strong> when deals are marked as won</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Leaderboard resets on the <strong>1st of each month</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Keep closing deals to climb the ranks! 🚀</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

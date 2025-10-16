'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export default function NewCallPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company')
        .eq('status', 'active')
        .order('first_name');

      if (data) setCustomers(data);
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Get user's Supabase ID
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user?.id)
        .single();

      if (!dbUser) {
        toast.error('User not found. Please contact support.');
        return;
      }

      // Create activity
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: dbUser.id,
          activity_type: 'call',
          subject: formData.get('subject') as string,
          customer_id: formData.get('customer_id') as string || null,
          description: formData.get('description') as string || null,
          duration_minutes: parseInt(formData.get('duration_minutes') as string) || null,
          outcome: formData.get('outcome') as string,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Call logged successfully!');
      router.push('/dashboard/calls');
    } catch (error) {
      console.error('Error logging call:', error);
      toast.error('Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Log Call</h1>
        <p className="text-muted-foreground">Record your sales call activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g., Initial discovery call, Follow-up"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select id="customer_id" name="customer_id">
                <option value="">-- Select Customer (Optional) --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                    {customer.company && ` - ${customer.company}`}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome *</Label>
                <Select id="outcome" name="outcome" required>
                  <option value="">Select outcome...</option>
                  <option value="successful">Successful</option>
                  <option value="no_answer">No Answer</option>
                  <option value="voicemail">Voicemail</option>
                  <option value="callback_scheduled">Callback Scheduled</option>
                  <option value="not_interested">Not Interested</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="0"
                  placeholder="15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add notes about the call..."
                rows={6}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Logging...' : 'Log Call'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Log calls immediately after they happen to track your daily progress towards your 50-call goal!
        </p>
      </div>
    </div>
  );
}

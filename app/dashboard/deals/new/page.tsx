'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { PIPELINE_STAGES } from '@/lib/constants/pipeline-stages';

export default function NewDealPage() {
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

      // Create deal
      const { data, error } = await supabase
        .from('deals')
        .insert({
          assigned_to: dbUser.id,
          deal_name: formData.get('deal_name') as string,
          deal_value: parseFloat(formData.get('deal_value') as string),
          stage: formData.get('stage') as string,
          customer_id: formData.get('customer_id') as string || null,
          probability: parseInt(formData.get('probability') as string) || null,
          expected_close_date: formData.get('expected_close_date') as string || null,
          source: formData.get('source') as string || null,
          notes: formData.get('notes') as string || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal created successfully!');
      router.push(`/dashboard/deals/${data.id}`);
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Deal</h1>
        <p className="text-muted-foreground">Create a new sales opportunity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal_name">Deal Name *</Label>
              <Input
                id="deal_name"
                name="deal_name"
                placeholder="e.g., Acme Corp - SEO Package"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <select
                id="customer_id"
                name="customer_id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Select Customer (Optional) --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                    {customer.company && ` - ${customer.company}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deal_value">Deal Value ($) *</Label>
                <Input
                  id="deal_value"
                  name="deal_value"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Stage *</Label>
                <select
                  id="stage"
                  name="stage"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue="new_leads_call"
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  name="expected_close_date"
                  type="date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                placeholder="e.g., Cold Call, Referral, Website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any additional notes about this deal..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Deal'}
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
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function NewCustomerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const { error: submitError } = await supabase.from('customers').insert({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      company: formData.get('company') as string || null,
      job_title: formData.get('job_title') as string || null,
      industry: formData.get('industry') as string || null,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      state: formData.get('state') as string || null,
      postal_code: formData.get('postal_code') as string || null,
      country: formData.get('country') as string || null,
      website: formData.get('website') as string || null,
      linkedin_url: formData.get('linkedin_url') as string || null,
      notes: formData.get('notes') as string || null,
      status: 'active',
    });

    if (submitError) {
      setError('Error creating customer: ' + submitError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/customers');
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="last_name" className="text-sm font-medium">
                Last Name *
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="job_title" className="text-sm font-medium">
                Job Title
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="industry" className="text-sm font-medium">
                Industry
              </label>
              <input
                type="text"
                id="industry"
                name="industry"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="linkedin_url" className="text-sm font-medium">
              LinkedIn URL
            </label>
            <input
              type="url"
              id="linkedin_url"
              name="linkedin_url"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="state" className="text-sm font-medium">
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="postal_code" className="text-sm font-medium">
                Postal Code
              </label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-6">
            <Link href="/dashboard/customers">
              <Button type="button" variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

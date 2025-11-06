'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface ReferenceImage {
  name: string;
  type: string;
  data: string; // base64
  description: string;
  uploaded_at: string;
}

export function NewCustomerForm() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imageData: ReferenceImage = {
          name: file.name,
          type: file.type,
          data: base64.split(',')[1], // Remove data:image/png;base64, prefix
          description: '', // User can add description later
          uploaded_at: new Date().toISOString(),
        };
        newImages.push(imageData);

        // Update state when all files are processed
        if (newImages.length === files.length) {
          setReferenceImages((prev) => [...prev, ...newImages]);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageDescription = (index: number, description: string) => {
    setReferenceImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, description } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!clerkUser) {
      setError('You must be logged in to create customers');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    // Get the current user's Supabase ID
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (!currentUser) {
      setError('User not found in database. Please contact support.');
      setLoading(false);
      return;
    }

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
      reference_images: referenceImages.length > 0 ? referenceImages : null,
      average_deal_size: formData.get('average_deal_size') ? parseFloat(formData.get('average_deal_size') as string) : null,
      profit_per_deal: formData.get('profit_per_deal') ? parseFloat(formData.get('profit_per_deal') as string) : null,
      conversion_rate: formData.get('conversion_rate') ? parseFloat(formData.get('conversion_rate') as string) : null,
      status: 'active',
      owned_by: currentUser.id,
      created_by: currentUser.id,
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

          {/* Business Metrics Section */}
          <div className="space-y-4 rounded-lg border border-muted-foreground/25 bg-muted/5 p-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Business Metrics (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                These metrics help Claude generate accurate ROI projections in proposals
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="average_deal_size" className="text-sm font-medium">
                  Average Deal Size (£)
                </label>
                <input
                  type="number"
                  id="average_deal_size"
                  name="average_deal_size"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 1200.00"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Average transaction value</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="profit_per_deal" className="text-sm font-medium">
                  Profit Per Deal (£)
                </label>
                <input
                  type="number"
                  id="profit_per_deal"
                  name="profit_per_deal"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 400.00"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Profit margin per sale</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="conversion_rate" className="text-sm font-medium">
                  Conversion Rate (%)
                </label>
                <input
                  type="number"
                  id="conversion_rate"
                  name="conversion_rate"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g., 3.50"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Website visitors to leads/sales</p>
              </div>
            </div>
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

          {/* Reference Images Upload Section */}
          <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/25 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Reference Images (Optional)
              </label>
              <p className="text-sm text-muted-foreground">
                Upload SEMrush reports, competitor analysis screenshots, or any reference images for Claude to analyze. Max 5MB per image.
              </p>
            </div>

            <div className="space-y-4">
              <label
                htmlFor="reference-images"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10 px-6 py-8 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Upload className="h-5 w-5" />
                <span>Click to upload images</span>
                <input
                  id="reference-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Images List */}
              {referenceImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Uploaded Images ({referenceImages.length})
                  </p>
                  {referenceImages.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-md border bg-card p-3"
                    >
                      <div className="flex-shrink-0">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{image.name}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <input
                          type="text"
                          placeholder="Add description (e.g., 'SEMrush traffic report', 'Competitor keywords')"
                          value={image.description}
                          onChange={(e) =>
                            updateImageDescription(index, e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(image.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

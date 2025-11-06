'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ReferenceImage {
  name: string;
  type: string;
  data: string; // base64
  description: string;
  uploaded_at: string;
}

interface CustomerEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export function CustomerEditModal({ open, onOpenChange, customer }: CustomerEditModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>(
    customer.reference_images || []
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imageData: ReferenceImage = {
          name: file.name,
          type: file.type,
          data: base64.split(',')[1],
          description: '',
          uploaded_at: new Date().toISOString(),
        };
        newImages.push(imageData);

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

    const formData = new FormData(e.currentTarget);

    const { error: updateError } = await supabase
      .from('customers')
      .update({
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
        status: formData.get('status') as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    if (updateError) {
      setError('Error updating customer: ' + updateError.message);
      setLoading(false);
      return;
    }

    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first_name" className="text-sm font-medium">
                First Name *
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                required
                defaultValue={customer.first_name}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.last_name}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.email || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.phone || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.company || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.job_title || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.industry || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                defaultValue={customer.status}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              defaultValue={customer.website || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="linkedin_url" className="text-sm font-medium">
              LinkedIn URL
            </label>
            <input
              type="url"
              id="linkedin_url"
              name="linkedin_url"
              defaultValue={customer.linkedin_url || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              defaultValue={customer.address || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                defaultValue={customer.city || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.state || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                defaultValue={customer.postal_code || ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              defaultValue={customer.country || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={customer.notes || ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Reference Images Upload Section */}
          <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/25 p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Reference Images (Optional)
              </label>
              <p className="text-xs text-muted-foreground">
                Upload SEMrush reports, competitor analysis screenshots, or any reference images for Claude to analyze. Max 5MB per image.
              </p>
            </div>

            <div className="space-y-4">
              <label
                htmlFor="reference-images-edit"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10 px-4 py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Upload className="h-4 w-4" />
                <span>Click to upload images</span>
                <input
                  id="reference-images-edit"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {referenceImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    Uploaded Images ({referenceImages.length})
                  </p>
                  {referenceImages.map((image, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded-md border bg-card p-2"
                    >
                      <div className="flex-shrink-0">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{image.name}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="h-5 w-5 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <input
                          type="text"
                          placeholder="Add description (e.g., 'SEMrush traffic report')"
                          value={image.description}
                          onChange={(e) =>
                            updateImageDescription(index, e.target.value)
                          }
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Uploaded {new Date(image.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

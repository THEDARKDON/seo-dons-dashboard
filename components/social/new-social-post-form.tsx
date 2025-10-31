'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Calendar, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  content: string;
  category?: string;
}

interface NewSocialPostFormProps {
  userId: string;
  initialTemplate?: Template | null;
  templates: Template[];
}

export function NewSocialPostForm({ userId, initialTemplate, templates }: NewSocialPostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(initialTemplate?.content || '');
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
  const [scheduledFor, setScheduledFor] = useState('');

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!content.trim()) {
        toast.error('Please enter some content for your post');
        setLoading(false);
        return;
      }

      if (scheduleType === 'schedule' && !scheduledFor) {
        toast.error('Please select a date and time to schedule your post');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          scheduleType,
          scheduledFor: scheduleType === 'schedule' ? scheduledFor : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      toast.success(
        scheduleType === 'now'
          ? 'Post published successfully!'
          : 'Post scheduled successfully!'
      );

      router.push('/dashboard/social');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = content.length;
  const maxCharacters = 3000; // LinkedIn's character limit

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selector */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="template">Use a Template (Optional)</Label>
                  <Select onValueChange={handleTemplateChange}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What do you want to share on LinkedIn?"
                  rows={12}
                  maxLength={maxCharacters}
                  required
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Use hashtags and mentions to increase reach</span>
                  <span className={characterCount > maxCharacters * 0.9 ? 'text-orange-600' : ''}>
                    {characterCount} / {maxCharacters}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Schedule Type */}
              <div className="space-y-2">
                <Label htmlFor="scheduleType">When to post</Label>
                <Select value={scheduleType} onValueChange={(value: 'now' | 'schedule') => setScheduleType(value)}>
                  <SelectTrigger id="scheduleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Publish Now
                      </div>
                    </SelectItem>
                    <SelectItem value="schedule">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule for Later
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduled Time */}
              {scheduleType === 'schedule' && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">
                    Schedule Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required={scheduleType === 'schedule'}
                  />
                  <p className="text-sm text-muted-foreground">
                    Best times: 7-9 AM, 12-1 PM, 5-6 PM
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      {scheduleType === 'now' ? (
                        <>
                          <Send className="h-4 w-4" />
                          Publish Now
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4" />
                          Schedule Post
                        </>
                      )}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">LinkedIn Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Keep it under 1300 characters for best engagement</li>
                <li>✓ Use 3-5 relevant hashtags</li>
                <li>✓ Tag relevant people with @mentions</li>
                <li>✓ Add a call-to-action at the end</li>
                <li>✓ Include line breaks for readability</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

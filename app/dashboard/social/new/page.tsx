import { NewSocialPostForm } from '@/components/social/new-social-post-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export default async function NewSocialPostPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const { userId } = await auth();
  const supabase = await createClient();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  // Get user's Supabase ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (!user) {
    return <div>User not found</div>;
  }

  // Get template if specified
  let template = null;
  if (searchParams.template) {
    try {
      const { data } = await supabase
        .from('post_templates')
        .select('*')
        .eq('id', searchParams.template)
        .single();
      template = data;
    } catch (e) {
      console.warn('Template not found');
    }
  }

  // Get all templates for dropdown
  let templates: any[] = [];
  try {
    const { data } = await supabase
      .from('post_templates')
      .select('*')
      .eq('active', true)
      .order('name');
    templates = data || [];
  } catch (e) {
    console.warn('Templates table not found');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/social">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Social Media
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New LinkedIn Post</h1>
          <p className="text-muted-foreground">
            Schedule or publish a LinkedIn post
          </p>
        </div>
      </div>

      <NewSocialPostForm
        userId={user.id}
        initialTemplate={template}
        templates={templates}
      />
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import { Linkedin, Calendar, TrendingUp, Plus, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

async function getSocialData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user's Supabase ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return { linkedInConnected: false, posts: [], templates: [], userId: null };
    }

    // Try to check LinkedIn connection - may fail if table doesn't exist
    let linkedInConnection = null;
    try {
      const { data } = await supabase
        .from('linkedin_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      linkedInConnection = data;
    } catch (e) {
      console.warn('linkedin_connections table not found - skipping');
    }

    // Try to get social posts - may fail if table doesn't exist
    let posts: any[] = [];
    try {
      const { data } = await supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      posts = data || [];
    } catch (e) {
      console.warn('social_posts table not found - skipping');
    }

    // Try to get post templates - may fail if table doesn't exist
    let templates: any[] = [];
    try {
      const { data } = await supabase
        .from('linkedin_post_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
      templates = data || [];
    } catch (e) {
      console.warn('linkedin_post_templates table not found - skipping');
    }

    return {
      linkedInConnected: !!linkedInConnection,
      linkedInConnection: linkedInConnection || null,
      posts,
      templates,
      userId: user.id,
    };
  } catch (error) {
    console.error('Error fetching social data:', error);
    return { linkedInConnected: false, posts: [], templates: [], userId: null };
  }
}

const statusColors = {
  draft: 'secondary',
  scheduled: 'default',
  pending_approval: 'default',
  approved: 'success',
  published: 'success',
  failed: 'destructive',
} as const;

export default async function SocialMediaPage({ searchParams }: { searchParams: { success?: string; error?: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const { linkedInConnected, linkedInConnection, posts, templates, userId: dbUserId } = await getSocialData(userId);
  const { success, error } = searchParams;

  // Calculate stats
  const totalPosts = posts.length;
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
  const totalEngagement = posts.reduce((sum, p) =>
    sum + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">
            Schedule and manage LinkedIn posts
          </p>
        </div>
        {linkedInConnected && (
          <Link href="/dashboard/social/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800">✓ LinkedIn connected successfully!</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">✗ Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* LinkedIn Connection Status */}
      {!linkedInConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              Connect LinkedIn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect your LinkedIn account to start scheduling and publishing posts directly from the CRM.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Schedule posts in advance</p>
              <p>✓ Use content templates</p>
              <p>✓ Track engagement metrics</p>
              <p>✓ Approval workflow for team posts</p>
            </div>
            <form action="/api/linkedin/auth">
              <Button type="submit" className="gap-2">
                <Linkedin className="h-4 w-4" />
                Connect LinkedIn
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
                <p className="text-2xl font-bold">{totalPosts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{publishedPosts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">{scheduledPosts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-sm text-muted-foreground">Total Engagement</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{totalEngagement}</p>
              </CardContent>
            </Card>
          </div>

          {/* Post Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Post Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {templates.slice(0, 6).map((template) => (
                    <Link
                      key={template.id}
                      href={`/dashboard/social/new?template=${template.id}`}
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">{template.title}</h3>
                        {template.category && (
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Used {template.usage_count || 0} times
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts ({posts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <Linkedin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No posts yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first post to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={statusColors[post.status as keyof typeof statusColors]}>
                              {post.status}
                            </Badge>
                            {post.scheduled_for && (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(post.scheduled_for)}
                              </span>
                            )}
                            {post.published_at && (
                              <span className="text-sm text-muted-foreground">
                                Published {formatDate(post.published_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-3">{post.content}</p>
                        </div>
                        {post.linkedin_post_url && (
                          <a
                            href={post.linkedin_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4"
                          >
                            <Button variant="outline" size="sm" className="gap-2">
                              <LinkIcon className="h-3 w-3" />
                              View
                            </Button>
                          </a>
                        )}
                      </div>

                      {/* Engagement metrics */}
                      {post.status === 'published' && (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                          <span>👍 {post.likes_count || 0} likes</span>
                          <span>💬 {post.comments_count || 0} comments</span>
                          <span>🔁 {post.shares_count || 0} shares</span>
                          <span>👁️ {post.impressions_count || 0} impressions</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

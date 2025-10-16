import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { createPost, createPostWithImage } from '@/lib/linkedin/client';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, mediaUrls, visibility, scheduledFor } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get LinkedIn connection
    const { data: linkedInConnection } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!linkedInConnection) {
      return NextResponse.json(
        { error: 'LinkedIn not connected. Please connect your LinkedIn account first.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const tokenExpiry = new Date(linkedInConnection.token_expires_at);
    if (tokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'LinkedIn token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }

    // If scheduled, create draft post
    if (scheduledFor) {
      const { data: post, error: postError } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          content,
          media_urls: mediaUrls || [],
          visibility: visibility || 'public',
          status: 'scheduled',
          scheduled_for: scheduledFor,
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      return NextResponse.json({
        success: true,
        post,
        message: 'Post scheduled successfully',
      });
    }

    // Otherwise, publish immediately
    let postResponse;

    if (mediaUrls && mediaUrls.length > 0) {
      // Post with image (only first image for now)
      postResponse = await createPostWithImage({
        accessToken: linkedInConnection.access_token,
        linkedInUserId: linkedInConnection.linkedin_user_id,
        text: content,
        imageUrl: mediaUrls[0],
        visibility: visibility?.toUpperCase() || 'PUBLIC',
      });
    } else {
      // Text-only post
      postResponse = await createPost({
        accessToken: linkedInConnection.access_token,
        linkedInUserId: linkedInConnection.linkedin_user_id,
        text: content,
        visibility: visibility?.toUpperCase() || 'PUBLIC',
      });
    }

    // Save post to database
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        user_id: user.id,
        content,
        media_urls: mediaUrls || [],
        visibility: visibility || 'public',
        status: 'published',
        published_at: new Date().toISOString(),
        linkedin_post_id: postResponse.postId,
        linkedin_post_url: postResponse.postUrl,
      })
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    return NextResponse.json({
      success: true,
      post,
      linkedInUrl: postResponse.postUrl,
      message: 'Post published successfully',
    });
  } catch (error: any) {
    console.error('Error creating LinkedIn post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

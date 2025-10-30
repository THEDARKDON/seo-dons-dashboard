import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all email templates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST - Create new email template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, subject, content, category, is_active, auto_send_after_call } = body;

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Name, subject, and content are required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        subject,
        content,
        category: category || 'general',
        is_active: is_active !== undefined ? is_active : true,
        auto_send_after_call: auto_send_after_call || false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

// PATCH - Update email template
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, subject, content, category, is_active, auto_send_after_call } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;
    if (auto_send_after_call !== undefined) updates.auto_send_after_call = auto_send_after_call;

    const { data: template, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

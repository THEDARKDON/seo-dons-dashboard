import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all SMS templates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: templates, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS templates' },
      { status: 500 }
    );
  }
}

// POST - Create new SMS template
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
    const { name, body: messageBody, category, is_active, auto_send_after_call, auto_send_delay_minutes } = body;

    if (!name || !messageBody) {
      return NextResponse.json(
        { error: 'Name and body are required' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('sms_templates')
      .insert({
        name,
        body: messageBody,
        category: category || 'general',
        is_active: is_active !== undefined ? is_active : true,
        auto_send_after_call: auto_send_after_call || false,
        auto_send_delay_minutes: auto_send_delay_minutes || 0,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to create SMS template' },
      { status: 500 }
    );
  }
}

// PATCH - Update SMS template
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

    const reqBody = await request.json();
    const { id, name, body: messageBody, category, is_active, auto_send_after_call, auto_send_delay_minutes } = reqBody;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (messageBody !== undefined) updates.body = messageBody;
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;
    if (auto_send_after_call !== undefined) updates.auto_send_after_call = auto_send_after_call;
    if (auto_send_delay_minutes !== undefined) updates.auto_send_delay_minutes = auto_send_delay_minutes;

    const { data: template, error } = await supabase
      .from('sms_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SMS template
export async function DELETE(request: NextRequest) {
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
        { error: 'Only admins can delete templates' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SMS template:', error);
    return NextResponse.json(
      { error: 'Failed to delete SMS template' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

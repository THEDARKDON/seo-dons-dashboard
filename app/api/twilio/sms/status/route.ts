import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Twilio SMS Status Callback
 * Updates message delivery status
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string;
    const errorMessage = formData.get('ErrorMessage') as string;

    console.log('📊 SMS Status Update:', {
      messageSid,
      messageStatus,
      errorCode,
    });

    const supabase = await createClient();

    // Update message status
    const updateData: any = {
      status: messageStatus,
      updated_at: new Date().toISOString(),
    };

    if (errorCode) {
      updateData.error_code = errorCode;
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('sms_messages')
      .update(updateData)
      .eq('message_sid', messageSid);

    if (error) {
      console.error('Error updating SMS status:', error);
    } else {
      console.log(`✅ Updated SMS ${messageSid} to ${messageStatus}`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Error in SMS status callback:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

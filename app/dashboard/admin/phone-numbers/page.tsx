import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { PhoneNumberManager } from '@/components/admin/phone-number-manager';
import { redirect } from 'next/navigation';

async function getPhoneNumberData() {
  const supabase = await createClient();

  // Get all users with their phone assignments
  const { data: users } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      role,
      user_voip_settings (
        assigned_phone_number,
        caller_id_number,
        auto_record,
        auto_transcribe
      )
    `)
    .order('created_at', { ascending: false });

  return { users: users || [] };
}

export default async function PhoneNumbersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is admin
  const supabase = await createClient();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_id', userId)
    .single();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  const { users } = await getPhoneNumberData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Phone Number Management</h1>
        <p className="text-muted-foreground">Purchase and assign Twilio phone numbers to SDRs</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PhoneNumberManager initialUsers={users} />
      </Suspense>
    </div>
  );
}

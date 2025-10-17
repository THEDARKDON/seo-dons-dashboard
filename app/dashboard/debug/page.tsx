import { auth } from '@clerk/nextjs/server';
import { createClient as createServerClient } from '@supabase/supabase-js';

export default async function DebugPage() {
  const { userId } = await auth();

  // Use service role to bypass RLS and any other issues
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check what Clerk gives us
  const clerkUserId = userId;

  // Try to find user in Supabase - avoid fetching problematic fields
  const { data: user, error } = await supabase
    .from('users')
    .select('clerk_id, email, role, active, created_at')
    .eq('clerk_id', userId)
    .single();

  // Get all users to compare (only safe fields to avoid encoding issues)
  const { data: allUsers } = await supabase
    .from('users')
    .select('clerk_id, email, role, active')
    .limit(20);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">Your Clerk User ID:</h2>
          <code className="text-sm bg-gray-100 p-2 rounded block break-all">{clerkUserId || 'NOT FOUND'}</code>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">User Lookup Result:</h2>
          {error && (
            <div className="text-red-600">
              <p className="font-bold">Error:</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}
          {!error && !user && (
            <p className="text-red-600">❌ No user found with clerk_id: {clerkUserId}</p>
          )}
          {!error && user && (
            <div className="text-green-600">
              <p className="font-bold">✅ User Found!</p>
              <div className="mt-2 text-black text-sm space-y-1">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Active:</strong> {String(user.active)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-bold mb-2">All Users in Database:</h2>
          <div className="space-y-3 mt-3">
            {allUsers?.map((u, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-3 text-sm">
                <p><strong>Email:</strong> {u.email}</p>
                <p><strong>Clerk ID:</strong></p>
                <code className="text-xs bg-gray-100 p-1 rounded block break-all mt-1">{u.clerk_id}</code>
                <p className="mt-1"><strong>Role:</strong> {u.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

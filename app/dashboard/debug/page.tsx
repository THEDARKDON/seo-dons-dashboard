import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export default async function DebugPage() {
  const { userId } = await auth();
  const supabase = await createClient();

  // Check what Clerk gives us
  const clerkUserId = userId;

  // Try to find user in Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  // Get all users to compare
  const { data: allUsers } = await supabase
    .from('users')
    .select('clerk_id, email, first_name, last_name')
    .limit(10);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Clerk User ID:</h2>
          <code className="text-sm">{clerkUserId}</code>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Supabase Query Result:</h2>
          {error && <p className="text-red-600">Error: {error.message}</p>}
          {user ? (
            <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
          ) : (
            <p className="text-red-600">No user found</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">All Users in Supabase:</h2>
          <pre className="text-sm">{JSON.stringify(allUsers, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

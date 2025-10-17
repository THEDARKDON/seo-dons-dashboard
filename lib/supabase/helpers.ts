import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * Get user by Clerk ID with proper error handling
 * Returns null if user not found instead of throwing
 */
export async function getUserByClerkId(clerkId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get or create user by Clerk ID
 * If user doesn't exist, creates them automatically
 */
export async function getOrCreateUser(clerkId: string, clerkUser: any) {
  // First try to get existing user
  let user = await getUserByClerkId(clerkId);

  if (user) {
    return user;
  }

  // User doesn't exist - create them
  console.log('🔄 User not found in Supabase, creating:', clerkId);

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const primaryEmail =
    clerkUser?.emailAddresses?.find(
      (e: any) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ||
    clerkUser?.email ||
    `${clerkId}@temp.com`;

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkId,
      email: primaryEmail,
      first_name: clerkUser?.firstName || null,
      last_name: clerkUser?.lastName || null,
      avatar_url: clerkUser?.imageUrl || null,
      role: 'bdr', // Default role
      active: true,
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating user:', createError);
    return null;
  }

  console.log('✅ User created in Supabase:', newUser.clerk_id);
  return newUser;
}

/**
 * Get user with role check
 * Returns user only if they have the required role
 */
export async function getUserWithRole(clerkId: string, requiredRole: string | string[]) {
  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return null;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(user.role)) {
    return null;
  }

  return user;
}

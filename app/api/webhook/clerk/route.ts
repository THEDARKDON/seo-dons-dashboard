import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/**
 * Clerk Webhook Handler
 * Syncs user creation/updates from Clerk to Supabase
 *
 * Setup:
 * 1. Go to Clerk Dashboard > Webhooks
 * 2. Add endpoint: https://your-domain.com/api/webhook/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy signing secret to .env.local as CLERK_WEBHOOK_SECRET
 */

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Get webhook secret from env
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    )
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle the webhook
  const eventType = evt.type
  const userData = evt.data

  console.log('📥 Clerk Webhook Received:', eventType)
  console.log('👤 User Data:', JSON.stringify(userData, null, 2))

  try {
    switch (eventType) {
      case 'user.created':
        const createdUser = await handleUserCreated(userData)
        console.log('✅ User created successfully:', createdUser?.clerk_id)
        break

      case 'user.updated':
        const updatedUser = await handleUserUpdated(userData)
        console.log('✅ User updated successfully:', updatedUser?.clerk_id)
        break

      case 'user.deleted':
        const deletedUser = await handleUserDeleted(userData)
        console.log('✅ User deleted successfully:', deletedUser?.clerk_id)
        break

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true, event: eventType })
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error)
    console.error('Error details:', error.message, error.details)
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Handle user creation - create user in Supabase
 */
async function handleUserCreated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData

  const primaryEmail = email_addresses.find((e: any) => e.id === userData.primary_email_address_id)

  const { data, error } = await supabase
    .from('users')
    .insert({
      clerk_id: id,
      email: primaryEmail?.email_address,
      first_name: first_name || null,
      last_name: last_name || null,
      avatar_url: image_url || null,
      role: 'bdr', // Default role
      active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user in Supabase:', error)
    throw error
  }

  console.log('✅ User synced to Supabase:', data)
  return data
}

/**
 * Handle user update - update user in Supabase
 */
async function handleUserUpdated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData

  const primaryEmail = email_addresses.find((e: any) => e.id === userData.primary_email_address_id)

  const { data, error } = await supabase
    .from('users')
    .update({
      email: primaryEmail?.email_address,
      first_name: first_name || null,
      last_name: last_name || null,
      avatar_url: image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user in Supabase:', error)
    throw error
  }

  console.log('✅ User updated in Supabase:', data)
  return data
}

/**
 * Handle user deletion - soft delete in Supabase
 */
async function handleUserDeleted(userData: any) {
  const { id } = userData

  // Soft delete - mark as inactive
  const { data, error } = await supabase
    .from('users')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', id)
    .select()
    .single()

  if (error) {
    console.error('Error deleting user in Supabase:', error)
    throw error
  }

  console.log('✅ User deactivated in Supabase:', data)
  return data
}

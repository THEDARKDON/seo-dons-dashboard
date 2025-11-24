import { NextRequest, NextResponse } from 'next/server'
import { HubSpotService } from '@/lib/integrations/hubspot'

/**
 * Manual HubSpot Sync Endpoint
 * Trigger a manual sync of deals and contacts from HubSpot
 */

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (you should add proper auth here)
    const authHeader = request.headers.get('authorization')

    if (!authHeader || authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { syncType = 'all' } = body

    const results: any = {
      timestamp: new Date().toISOString(),
      synced: []
    }

    // Sync deals
    if (syncType === 'all' || syncType === 'deals') {
      const dealResult = await HubSpotService.syncDeals()
      results.synced.push({
        type: 'deals',
        ...dealResult
      })
    }

    // Sync contacts
    if (syncType === 'all' || syncType === 'contacts') {
      const contactResult = await HubSpotService.syncContacts()
      results.synced.push({
        type: 'contacts',
        ...contactResult
      })
    }

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'HubSpot Sync Endpoint',
    usage: 'POST to this endpoint with syncType: "all" | "deals" | "contacts"'
  })
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * HubSpot Webhook Handler
 * Receives webhook events from HubSpot when deals are updated
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hubspot-signature')

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)

    // Process webhook events asynchronously
    processWebhookEvents(payload).catch(console.error)

    // Return 200 immediately to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Verify HubSpot webhook signature
 */
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.HUBSPOT_CLIENT_SECRET) {
    return false
  }

  try {
    const hash = crypto
      .createHmac('sha256', process.env.HUBSPOT_CLIENT_SECRET)
      .update(body)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Process webhook events
 */
async function processWebhookEvents(events: any[]) {
  const supabase = await createClient()

  for (const event of events) {
    try {
      // Handle deal stage changes
      if (event.subscriptionType === 'deal.propertyChange' &&
          event.propertyName === 'dealstage') {

        const dealId = event.objectId
        const newStage = event.propertyValue

        // Map HubSpot stage to internal stage
        const internalStage = mapHubSpotStage(newStage)

        // Update deal in database
        await supabase
          .from('deals')
          .update({
            stage: internalStage,
            ...(internalStage === 'closed_won' && {
              actual_close_date: new Date().toISOString()
            })
          })
          .eq('hubspot_id', dealId)

        console.log(`Updated deal ${dealId} to stage ${internalStage}`)
      }

      // Handle deal value changes
      if (event.subscriptionType === 'deal.propertyChange' &&
          event.propertyName === 'amount') {

        const dealId = event.objectId
        const newValue = parseFloat(event.propertyValue)

        await supabase
          .from('deals')
          .update({ deal_value: newValue })
          .eq('hubspot_id', dealId)

        console.log(`Updated deal ${dealId} value to ${newValue}`)
      }

      // Handle new deals
      if (event.subscriptionType === 'deal.creation') {
        console.log(`New deal created in HubSpot: ${event.objectId}`)
        // Trigger a full sync for this deal
      }
    } catch (error) {
      console.error(`Error processing event ${event.eventId}:`, error)
    }
  }
}

/**
 * Map HubSpot stage to internal stage
 */
function mapHubSpotStage(hubspotStage: string): string {
  const stageMap: Record<string, string> = {
    'appointmentscheduled': 'prospecting',
    'qualifiedtobuy': 'qualification',
    'presentationscheduled': 'proposal',
    'decisionmakerboughtin': 'negotiation',
    'closedwon': 'closed_won',
    'closedlost': 'closed_lost'
  }

  return stageMap[hubspotStage] || 'prospecting'
}

export const dynamic = 'force-dynamic';

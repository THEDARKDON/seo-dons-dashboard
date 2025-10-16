import { Client } from '@hubspot/api-client'
import { createClient } from '@/lib/supabase/server'

const hubspotClient = new Client({
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN
})

export class HubSpotService {
  /**
   * Sync deals from HubSpot to Supabase
   */
  static async syncDeals() {
    try {
      const deals = await hubspotClient.crm.deals.basicApi.getPage(100)
      const supabase = await createClient()

      for (const deal of deals.results) {
        await supabase.from('deals').upsert({
          hubspot_id: deal.id,
          deal_name: deal.properties.dealname,
          deal_value: parseFloat(deal.properties.amount || '0'),
          stage: this.mapStage(deal.properties.dealstage),
          expected_close_date: deal.properties.closedate || null,
          source: 'hubspot',
        }, {
          onConflict: 'hubspot_id'
        })
      }

      return { success: true, count: deals.results.length }
    } catch (error) {
      console.error('HubSpot sync error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Sync contacts from HubSpot to Supabase
   */
  static async syncContacts() {
    try {
      const contacts = await hubspotClient.crm.contacts.basicApi.getPage(100)
      const supabase = await createClient()

      for (const contact of contacts.results) {
        await supabase.from('customers').upsert({
          hubspot_id: contact.id,
          email: contact.properties.email,
          first_name: contact.properties.firstname,
          last_name: contact.properties.lastname,
          company: contact.properties.company,
          phone: contact.properties.phone,
        }, {
          onConflict: 'hubspot_id'
        })
      }

      return { success: true, count: contacts.results.length }
    } catch (error) {
      console.error('HubSpot contacts sync error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Create a deal in HubSpot
   */
  static async createDeal(dealData: {
    dealname: string
    amount: string
    dealstage: string
    closedate?: string
  }) {
    try {
      const deal = await hubspotClient.crm.deals.basicApi.create({
        properties: dealData,
        associations: []
      })

      return { success: true, dealId: deal.id }
    } catch (error) {
      console.error('HubSpot create deal error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Update a deal in HubSpot
   */
  static async updateDeal(dealId: string, updates: Record<string, any>) {
    try {
      await hubspotClient.crm.deals.basicApi.update(dealId, {
        properties: updates
      })

      return { success: true }
    } catch (error) {
      console.error('HubSpot update deal error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Map HubSpot deal stages to internal stages
   */
  private static mapStage(hubspotStage: string): string {
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

  /**
   * Map internal stages to HubSpot stages
   */
  static mapStageToHubSpot(internalStage: string): string {
    const stageMap: Record<string, string> = {
      'prospecting': 'appointmentscheduled',
      'qualification': 'qualifiedtobuy',
      'proposal': 'presentationscheduled',
      'negotiation': 'decisionmakerboughtin',
      'closed_won': 'closedwon',
      'closed_lost': 'closedlost'
    }

    return stageMap[internalStage] || 'appointmentscheduled'
  }
}

import axios from 'axios'

export class SlackService {
  /**
   * Send a notification to Slack webhook
   */
  static async sendNotification(message: string, blocks?: any[]) {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL

      if (!webhookUrl) {
        console.warn('Slack webhook URL not configured')
        return { success: false, error: 'Webhook URL not configured' }
      }

      const payload = blocks
        ? { text: message, blocks }
        : { text: message }

      await axios.post(webhookUrl, payload)

      return { success: true }
    } catch (error) {
      console.error('Slack notification error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * Send a deal won notification
   */
  static async notifyDealWon(dealData: {
    dealName: string
    dealValue: number
    bdName: string
  }) {
    const message = `🎉 Deal Won: ${dealData.dealName}`

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 New Deal Closed!',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Deal:*\n${dealData.dealName}`
          },
          {
            type: 'mrkdwn',
            text: `*Value:*\n$${dealData.dealValue.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Closed by:*\n${dealData.bdName}`
          }
        ]
      },
      {
        type: 'divider'
      }
    ]

    return this.sendNotification(message, blocks)
  }

  /**
   * Send a daily summary notification
   */
  static async sendDailySummary(summaryData: {
    totalCalls: number
    totalMeetings: number
    dealsWon: number
    totalRevenue: number
  }) {
    const message = '📊 Daily Sales Summary'

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Daily Sales Summary',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Calls Made:*\n${summaryData.totalCalls}`
          },
          {
            type: 'mrkdwn',
            text: `*Meetings Set:*\n${summaryData.totalMeetings}`
          },
          {
            type: 'mrkdwn',
            text: `*Deals Won:*\n${summaryData.dealsWon}`
          },
          {
            type: 'mrkdwn',
            text: `*Revenue:*\n$${summaryData.totalRevenue.toLocaleString()}`
          }
        ]
      }
    ]

    return this.sendNotification(message, blocks)
  }

  /**
   * Send a leaderboard update
   */
  static async sendLeaderboardUpdate(topPerformers: Array<{
    name: string
    deals: number
    revenue: number
  }>) {
    const message = '🏆 Weekly Leaderboard'

    const leaderboardText = topPerformers
      .map((performer, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
        return `${medal} *${performer.name}* - ${performer.deals} deals, $${performer.revenue.toLocaleString()}`
      })
      .join('\n')

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏆 Weekly Leaderboard',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: leaderboardText
        }
      }
    ]

    return this.sendNotification(message, blocks)
  }
}

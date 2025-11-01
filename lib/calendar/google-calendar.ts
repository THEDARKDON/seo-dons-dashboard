import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { formatInTimeZone } from 'date-fns-tz';
import { addMinutes } from 'date-fns';

const calendar = google.calendar('v3');

export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[]; // Email addresses
  location?: string;
  callRecordId?: string;
  activityId?: string;
  timeZone?: string;
}

export interface CalendarEvent {
  id: string;
  htmlLink: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

export class GoogleCalendarService {
  private async getOAuth2Client(userId: string) {
    // Use service role client to bypass RLS (we're authenticated via Clerk, not Supabase Auth)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's Google integration from unified table
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (!integration) {
      throw new Error('Google Calendar not connected');
    }

    // Check if token is expired
    const now = new Date();
    const expiry = new Date(integration.token_expiry);

    if (now >= expiry) {
      // Refresh token
      const newTokens = await this.refreshAccessToken(integration.refresh_token);

      // Update database
      await supabase
        .from('user_integrations')
        .update({
          access_token: newTokens.access_token,
          token_expiry: newTokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      integration.access_token = newTokens.access_token;
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    // Use email from metadata as calendar ID
    const calendarId = integration.metadata?.email || 'primary';
    return { oauth2Client, calendarId };
  }

  async getAuthUrl(state: string): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    console.log('[GoogleCalendar] handleCallback - userId:', userId);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    console.log('[GoogleCalendar] Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    console.log('[GoogleCalendar] Got tokens, access_token:', !!tokens.access_token, 'refresh_token:', !!tokens.refresh_token);

    oauth2Client.setCredentials(tokens);

    // Get user's email from Google
    console.log('[GoogleCalendar] Getting user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error('Failed to get user email from Google');
    }

    console.log('[GoogleCalendar] Got user email:', userInfo.email);

    // Calculate token expiry
    // Google returns expiry_date in milliseconds, or we default to 1 hour from now
    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // Save to unified user_integrations table
    // Use service role client to bypass RLS
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('[GoogleCalendar] Saving to database...');
    const { data, error } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: userId,
        provider: 'google',
        provider_user_id: userInfo.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        scopes: tokens.scope?.split(' ') || [],
        metadata: {
          email: userInfo.email,
        },
      }, {
        onConflict: 'user_id,provider'
      })
      .select();

    if (error) {
      console.error('[GoogleCalendar] Database error:', error);
      throw error;
    }

    console.log('[GoogleCalendar] Successfully saved integration:', data);
  }

  private async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expiry_date: string }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Google returns expiry_date in milliseconds, or we default to 1 hour from now
    const expiryDate = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    return {
      access_token: credentials.access_token,
      expiry_date: expiryDate.toISOString(),
    };
  }

  async createEvent(userId: string, params: CreateEventParams): Promise<CalendarEvent> {
    const { oauth2Client, calendarId } = await this.getOAuth2Client(userId);

    const timeZone = params.timeZone || 'Europe/London';

    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone,
      },
      attendees: params.attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `${userId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      auth: oauth2Client,
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send email invites to all attendees
    });

    if (!response.data.id || !response.data.htmlLink) {
      throw new Error('Failed to create calendar event');
    }

    // If activityId provided, link it
    if (params.activityId) {
      const supabase = await createClient();
      await supabase
        .from('activities')
        .update({
          calendar_event_id: response.data.id,
          calendar_event_link: response.data.htmlLink,
          calendar_provider: 'google',
        })
        .eq('id', params.activityId);
    }

    // If callRecordId provided, link it
    if (params.callRecordId) {
      const supabase = await createClient();
      await supabase
        .from('call_recordings')
        .update({
          calendar_event_id: response.data.id,
          calendar_event_link: response.data.htmlLink,
          meeting_scheduled_at: params.startTime.toISOString(),
          meeting_duration: Math.round((params.endTime.getTime() - params.startTime.getTime()) / 60000),
        })
        .eq('id', params.callRecordId);
    }

    return response.data as CalendarEvent;
  }

  async isConnected(userId: string): Promise<boolean> {
    console.log('[GoogleCalendar] isConnected - userId:', userId);
    // Use service role client to bypass RLS (we're authenticated via Clerk, not Supabase Auth)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check unified user_integrations table
    const { data, error } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .maybeSingle();

    console.log('[GoogleCalendar] isConnected - query result:', { data: !!data, error });

    return !!data;
  }

  async disconnect(userId: string): Promise<void> {
    // Use service role client to bypass RLS (we're authenticated via Clerk, not Supabase Auth)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete from unified user_integrations table
    await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google');
  }

  async getIntegration(userId: string) {
    console.log('[GoogleCalendar] getIntegration - userId:', userId);
    // Use service role client to bypass RLS (we're authenticated via Clerk, not Supabase Auth)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get from unified user_integrations table
    const { data, error } = await supabase
      .from('user_integrations')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    console.log('[GoogleCalendar] getIntegration - query result:', { data, error });

    // Return in expected format
    if (data) {
      return {
        email: data.metadata?.email,
        calendar_id: data.metadata?.email,
        is_active: true,
        created_at: data.created_at,
      };
    }
    return null;
  }
}

export const googleCalendar = new GoogleCalendarService();

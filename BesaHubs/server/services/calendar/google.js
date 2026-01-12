const { google } = require('googleapis');
const { appLogger } = require('../../config/logger');
const { encrypt, decrypt } = require('../../utils/calendarEncryption');
const { CalendarAccount, CalendarEvent } = require('../../models');
const { Op } = require('sequelize');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/calendar/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const getAuthUrl = (userId) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId,
      prompt: 'consent'
    });

    appLogger.info('Generated Google OAuth URL', { userId });
    return authUrl;
  } catch (error) {
    appLogger.error('Failed to generate Google auth URL', { error: error.message, userId });
    throw error;
  }
};

const handleCallback = async (code, userId) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const [account, created] = await CalendarAccount.findOrCreate({
      where: {
        userId,
        provider: 'google',
        email: userInfo.email
      },
      defaults: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scopes: SCOPES,
        isActive: true
      }
    });

    if (!created) {
      await account.update({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scopes: SCOPES,
        isActive: true
      });
    }

    appLogger.info('Google calendar account connected', { userId, accountId: account.id, email: userInfo.email });
    
    return account;
  } catch (error) {
    appLogger.error('Failed to handle Google OAuth callback', { error: error.message, userId });
    throw error;
  }
};

const refreshAccessToken = async (calendarAccount) => {
  try {
    if (!calendarAccount.refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauth2Client = getOAuth2Client();
    const decryptedRefreshToken = decrypt(calendarAccount.refreshToken);
    
    oauth2Client.setCredentials({
      refresh_token: decryptedRefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    const encryptedAccessToken = encrypt(credentials.access_token);
    const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : null;

    await calendarAccount.update({
      accessToken: encryptedAccessToken,
      expiresAt
    });

    appLogger.info('Refreshed Google access token', { accountId: calendarAccount.id });
    
    return {
      accessToken: credentials.access_token,
      expiresAt
    };
  } catch (error) {
    appLogger.error('Failed to refresh Google access token', { error: error.message, accountId: calendarAccount.id });
    
    await calendarAccount.update({ isActive: false });
    
    throw error;
  }
};

const getAuthenticatedClient = async (calendarAccount) => {
  let accessToken = calendarAccount.accessToken ? decrypt(calendarAccount.accessToken) : null;
  
  if (calendarAccount.isTokenExpired() && calendarAccount.refreshToken) {
    const refreshed = await refreshAccessToken(calendarAccount);
    accessToken = refreshed.accessToken;
  }

  if (!accessToken) {
    throw new Error('No valid access token available');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

const syncEvents = async (calendarAccountId, startDate, endDate) => {
  try {
    const calendarAccount = await CalendarAccount.findByPk(calendarAccountId);
    
    if (!calendarAccount || !calendarAccount.isActive) {
      throw new Error('Calendar account not found or inactive');
    }

    const calendar = await getAuthenticatedClient(calendarAccount);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500
    });

    const events = response.data.items || [];
    
    const syncedEvents = [];
    
    for (const event of events) {
      if (!event.start || !event.end) continue;
      
      const startDateTime = event.start.dateTime || event.start.date;
      const endDateTime = event.end.dateTime || event.end.date;
      const isAllDay = !event.start.dateTime;
      
      const attendees = (event.attendees || []).map(att => ({
        email: att.email,
        displayName: att.displayName,
        responseStatus: att.responseStatus
      }));

      const [calendarEvent, created] = await CalendarEvent.findOrCreate({
        where: {
          calendarAccountId,
          externalId: event.id
        },
        defaults: {
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          location: event.location || null,
          attendees,
          status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
          isAllDay,
          timezone: event.start.timeZone || 'UTC',
          metadata: {
            htmlLink: event.htmlLink,
            hangoutLink: event.hangoutLink,
            conferenceData: event.conferenceData
          }
        }
      });

      if (!created) {
        await calendarEvent.update({
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          location: event.location || null,
          attendees,
          status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
          isAllDay,
          timezone: event.start.timeZone || 'UTC',
          metadata: {
            htmlLink: event.htmlLink,
            hangoutLink: event.hangoutLink,
            conferenceData: event.conferenceData
          }
        });
      }

      syncedEvents.push(calendarEvent);
    }

    await calendarAccount.update({ lastSyncedAt: new Date() });

    appLogger.info('Synced Google calendar events', { 
      accountId: calendarAccountId, 
      eventCount: syncedEvents.length 
    });

    return syncedEvents;
  } catch (error) {
    appLogger.error('Failed to sync Google calendar events', { 
      error: error.message, 
      accountId: calendarAccountId 
    });
    throw error;
  }
};

const createEvent = async (calendarAccountId, eventData) => {
  try {
    const calendarAccount = await CalendarAccount.findByPk(calendarAccountId);
    
    if (!calendarAccount || !calendarAccount.isActive) {
      throw new Error('Calendar account not found or inactive');
    }

    const calendar = await getAuthenticatedClient(calendarAccount);
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: eventData.isAllDay
        ? { date: eventData.start.toISOString().split('T')[0] }
        : { dateTime: eventData.start.toISOString(), timeZone: eventData.timezone || 'UTC' },
      end: eventData.isAllDay
        ? { date: eventData.end.toISOString().split('T')[0] }
        : { dateTime: eventData.end.toISOString(), timeZone: eventData.timezone || 'UTC' },
      attendees: (eventData.attendees || []).map(email => ({ email }))
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    const createdEvent = response.data;
    
    const attendees = (createdEvent.attendees || []).map(att => ({
      email: att.email,
      displayName: att.displayName,
      responseStatus: att.responseStatus
    }));

    const calendarEvent = await CalendarEvent.create({
      calendarAccountId,
      externalId: createdEvent.id,
      title: createdEvent.summary || 'Untitled Event',
      description: createdEvent.description || null,
      start: new Date(createdEvent.start.dateTime || createdEvent.start.date),
      end: new Date(createdEvent.end.dateTime || createdEvent.end.date),
      location: createdEvent.location || null,
      attendees,
      status: 'confirmed',
      isAllDay: eventData.isAllDay,
      timezone: eventData.timezone || 'UTC',
      metadata: {
        htmlLink: createdEvent.htmlLink,
        hangoutLink: createdEvent.hangoutLink
      }
    });

    appLogger.info('Created Google calendar event', { 
      accountId: calendarAccountId, 
      eventId: calendarEvent.id 
    });

    return calendarEvent;
  } catch (error) {
    appLogger.error('Failed to create Google calendar event', { 
      error: error.message, 
      accountId: calendarAccountId 
    });
    throw error;
  }
};

const updateEvent = async (calendarAccountId, externalId, eventData) => {
  try {
    const calendarAccount = await CalendarAccount.findByPk(calendarAccountId);
    
    if (!calendarAccount || !calendarAccount.isActive) {
      throw new Error('Calendar account not found or inactive');
    }

    const calendar = await getAuthenticatedClient(calendarAccount);
    
    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: eventData.isAllDay
        ? { date: eventData.start.toISOString().split('T')[0] }
        : { dateTime: eventData.start.toISOString(), timeZone: eventData.timezone || 'UTC' },
      end: eventData.isAllDay
        ? { date: eventData.end.toISOString().split('T')[0] }
        : { dateTime: eventData.end.toISOString(), timeZone: eventData.timezone || 'UTC' },
      attendees: (eventData.attendees || []).map(email => ({ email }))
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: externalId,
      requestBody: event
    });

    const updatedEvent = response.data;
    
    const calendarEvent = await CalendarEvent.findOne({
      where: { calendarAccountId, externalId }
    });

    if (calendarEvent) {
      const attendees = (updatedEvent.attendees || []).map(att => ({
        email: att.email,
        displayName: att.displayName,
        responseStatus: att.responseStatus
      }));

      await calendarEvent.update({
        title: updatedEvent.summary || 'Untitled Event',
        description: updatedEvent.description || null,
        start: new Date(updatedEvent.start.dateTime || updatedEvent.start.date),
        end: new Date(updatedEvent.end.dateTime || updatedEvent.end.date),
        location: updatedEvent.location || null,
        attendees,
        isAllDay: eventData.isAllDay,
        timezone: eventData.timezone || 'UTC'
      });
    }

    appLogger.info('Updated Google calendar event', { 
      accountId: calendarAccountId, 
      externalId 
    });

    return calendarEvent;
  } catch (error) {
    appLogger.error('Failed to update Google calendar event', { 
      error: error.message, 
      accountId: calendarAccountId, 
      externalId 
    });
    throw error;
  }
};

const deleteEvent = async (calendarAccountId, externalId) => {
  try {
    const calendarAccount = await CalendarAccount.findByPk(calendarAccountId);
    
    if (!calendarAccount || !calendarAccount.isActive) {
      throw new Error('Calendar account not found or inactive');
    }

    const calendar = await getAuthenticatedClient(calendarAccount);
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: externalId
    });

    const calendarEvent = await CalendarEvent.findOne({
      where: { calendarAccountId, externalId }
    });

    if (calendarEvent) {
      await calendarEvent.destroy();
    }

    appLogger.info('Deleted Google calendar event', { 
      accountId: calendarAccountId, 
      externalId 
    });

    return true;
  } catch (error) {
    appLogger.error('Failed to delete Google calendar event', { 
      error: error.message, 
      accountId: calendarAccountId, 
      externalId 
    });
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  handleCallback,
  refreshAccessToken,
  syncEvents,
  createEvent,
  updateEvent,
  deleteEvent
};

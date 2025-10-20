const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const { appLogger } = require('../../config/logger');
const { encrypt, decrypt } = require('../../utils/calendarEncryption');
const { CalendarAccount, CalendarEvent } = require('../../models');
const { Op } = require('sequelize');

const SCOPES = ['Calendars.ReadWrite', 'Calendars.ReadWrite.Shared', 'User.Read'];

const getMSALClient = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3001'}/api/calendar/microsoft/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth credentials not configured');
  }

  const config = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret
    }
  };

  return {
    client: new ConfidentialClientApplication(config),
    redirectUri
  };
};

const getAuthUrl = (userId) => {
  try {
    const { client, redirectUri } = getMSALClient();
    
    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri,
      state: userId,
      prompt: 'consent'
    };

    const authUrl = client.getAuthCodeUrl(authCodeUrlParameters);

    appLogger.info('Generated Microsoft OAuth URL', { userId });
    return authUrl;
  } catch (error) {
    appLogger.error('Failed to generate Microsoft auth URL', { error: error.message, userId });
    throw error;
  }
};

const handleCallback = async (code, userId) => {
  try {
    const { client, redirectUri } = getMSALClient();
    
    const tokenRequest = {
      code,
      scopes: SCOPES,
      redirectUri
    };

    const response = await client.acquireTokenByCode(tokenRequest);
    
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, response.accessToken);
      }
    });

    const userInfo = await graphClient.api('/me').get();

    const encryptedAccessToken = encrypt(response.accessToken);
    const encryptedRefreshToken = response.refreshToken ? encrypt(response.refreshToken) : null;
    
    const expiresAt = response.expiresOn ? new Date(response.expiresOn) : null;

    const [account, created] = await CalendarAccount.findOrCreate({
      where: {
        userId,
        provider: 'microsoft',
        email: userInfo.mail || userInfo.userPrincipalName
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

    appLogger.info('Microsoft calendar account connected', { 
      userId, 
      accountId: account.id, 
      email: userInfo.mail || userInfo.userPrincipalName 
    });
    
    return account;
  } catch (error) {
    appLogger.error('Failed to handle Microsoft OAuth callback', { error: error.message, userId });
    throw error;
  }
};

const refreshAccessToken = async (calendarAccount) => {
  try {
    if (!calendarAccount.refreshToken) {
      throw new Error('No refresh token available');
    }

    const { client } = getMSALClient();
    const decryptedRefreshToken = decrypt(calendarAccount.refreshToken);
    
    const refreshTokenRequest = {
      refreshToken: decryptedRefreshToken,
      scopes: SCOPES
    };

    const response = await client.acquireTokenByRefreshToken(refreshTokenRequest);
    
    const encryptedAccessToken = encrypt(response.accessToken);
    const expiresAt = response.expiresOn ? new Date(response.expiresOn) : null;

    await calendarAccount.update({
      accessToken: encryptedAccessToken,
      expiresAt
    });

    appLogger.info('Refreshed Microsoft access token', { accountId: calendarAccount.id });
    
    return {
      accessToken: response.accessToken,
      expiresAt
    };
  } catch (error) {
    appLogger.error('Failed to refresh Microsoft access token', { 
      error: error.message, 
      accountId: calendarAccount.id 
    });
    
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

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

const syncEvents = async (calendarAccountId, startDate, endDate) => {
  try {
    const calendarAccount = await CalendarAccount.findByPk(calendarAccountId);
    
    if (!calendarAccount || !calendarAccount.isActive) {
      throw new Error('Calendar account not found or inactive');
    }

    const client = await getAuthenticatedClient(calendarAccount);
    
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();
    
    const response = await client
      .api('/me/calendar/calendarView')
      .query({
        startDateTime,
        endDateTime,
        $top: 2500,
        $orderby: 'start/dateTime'
      })
      .get();

    const events = response.value || [];
    
    const syncedEvents = [];
    
    for (const event of events) {
      if (!event.start || !event.end) continue;
      
      const isAllDay = event.isAllDay || false;
      const startDateTime = event.start.dateTime;
      const endDateTime = event.end.dateTime;
      const timezone = event.start.timeZone || 'UTC';
      
      const attendees = (event.attendees || []).map(att => ({
        email: att.emailAddress?.address,
        displayName: att.emailAddress?.name,
        responseStatus: att.status?.response
      }));

      const [calendarEvent, created] = await CalendarEvent.findOrCreate({
        where: {
          calendarAccountId,
          externalId: event.id
        },
        defaults: {
          title: event.subject || 'Untitled Event',
          description: event.bodyPreview || event.body?.content || null,
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          location: event.location?.displayName || null,
          attendees,
          status: event.isCancelled ? 'cancelled' : 'confirmed',
          isAllDay,
          timezone,
          metadata: {
            webLink: event.webLink,
            onlineMeetingUrl: event.onlineMeetingUrl,
            categories: event.categories
          }
        }
      });

      if (!created) {
        await calendarEvent.update({
          title: event.subject || 'Untitled Event',
          description: event.bodyPreview || event.body?.content || null,
          start: new Date(startDateTime),
          end: new Date(endDateTime),
          location: event.location?.displayName || null,
          attendees,
          status: event.isCancelled ? 'cancelled' : 'confirmed',
          isAllDay,
          timezone,
          metadata: {
            webLink: event.webLink,
            onlineMeetingUrl: event.onlineMeetingUrl,
            categories: event.categories
          }
        });
      }

      syncedEvents.push(calendarEvent);
    }

    await calendarAccount.update({ lastSyncedAt: new Date() });

    appLogger.info('Synced Microsoft calendar events', { 
      accountId: calendarAccountId, 
      eventCount: syncedEvents.length 
    });

    return syncedEvents;
  } catch (error) {
    appLogger.error('Failed to sync Microsoft calendar events', { 
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

    const client = await getAuthenticatedClient(calendarAccount);
    
    const event = {
      subject: eventData.title,
      body: {
        contentType: 'text',
        content: eventData.description || ''
      },
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      location: eventData.location ? {
        displayName: eventData.location
      } : undefined,
      attendees: (eventData.attendees || []).map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })),
      isAllDay: eventData.isAllDay || false
    };

    const createdEvent = await client
      .api('/me/calendar/events')
      .post(event);

    const attendees = (createdEvent.attendees || []).map(att => ({
      email: att.emailAddress?.address,
      displayName: att.emailAddress?.name,
      responseStatus: att.status?.response
    }));

    const calendarEvent = await CalendarEvent.create({
      calendarAccountId,
      externalId: createdEvent.id,
      title: createdEvent.subject || 'Untitled Event',
      description: createdEvent.bodyPreview || null,
      start: new Date(createdEvent.start.dateTime),
      end: new Date(createdEvent.end.dateTime),
      location: createdEvent.location?.displayName || null,
      attendees,
      status: 'confirmed',
      isAllDay: eventData.isAllDay || false,
      timezone: eventData.timezone || 'UTC',
      metadata: {
        webLink: createdEvent.webLink,
        onlineMeetingUrl: createdEvent.onlineMeetingUrl
      }
    });

    appLogger.info('Created Microsoft calendar event', { 
      accountId: calendarAccountId, 
      eventId: calendarEvent.id 
    });

    return calendarEvent;
  } catch (error) {
    appLogger.error('Failed to create Microsoft calendar event', { 
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

    const client = await getAuthenticatedClient(calendarAccount);
    
    const event = {
      subject: eventData.title,
      body: {
        contentType: 'text',
        content: eventData.description || ''
      },
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: eventData.timezone || 'UTC'
      },
      location: eventData.location ? {
        displayName: eventData.location
      } : undefined,
      attendees: (eventData.attendees || []).map(email => ({
        emailAddress: {
          address: email
        },
        type: 'required'
      })),
      isAllDay: eventData.isAllDay || false
    };

    const updatedEvent = await client
      .api(`/me/calendar/events/${externalId}`)
      .patch(event);

    const calendarEvent = await CalendarEvent.findOne({
      where: { calendarAccountId, externalId }
    });

    if (calendarEvent) {
      const attendees = (updatedEvent.attendees || []).map(att => ({
        email: att.emailAddress?.address,
        displayName: att.emailAddress?.name,
        responseStatus: att.status?.response
      }));

      await calendarEvent.update({
        title: updatedEvent.subject || 'Untitled Event',
        description: updatedEvent.bodyPreview || null,
        start: new Date(updatedEvent.start.dateTime),
        end: new Date(updatedEvent.end.dateTime),
        location: updatedEvent.location?.displayName || null,
        attendees,
        isAllDay: eventData.isAllDay || false,
        timezone: eventData.timezone || 'UTC'
      });
    }

    appLogger.info('Updated Microsoft calendar event', { 
      accountId: calendarAccountId, 
      externalId 
    });

    return calendarEvent;
  } catch (error) {
    appLogger.error('Failed to update Microsoft calendar event', { 
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

    const client = await getAuthenticatedClient(calendarAccount);
    
    await client
      .api(`/me/calendar/events/${externalId}`)
      .delete();

    const calendarEvent = await CalendarEvent.findOne({
      where: { calendarAccountId, externalId }
    });

    if (calendarEvent) {
      await calendarEvent.destroy();
    }

    appLogger.info('Deleted Microsoft calendar event', { 
      accountId: calendarAccountId, 
      externalId 
    });

    return true;
  } catch (error) {
    appLogger.error('Failed to delete Microsoft calendar event', { 
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

# BesaHubs CRM - Phase 1 Documentation

**Version**: 1.0.0  
**Last Updated**: October 19, 2025  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [What's New in Phase 1](#whats-new-in-phase-1)
3. [Environment Setup](#environment-setup)
4. [SendGrid Email Integration](#sendgrid-email-integration)
5. [Calendar Integration (Google & Microsoft)](#calendar-integration)
6. [Advanced Custom Dashboards](#advanced-custom-dashboards)
7. [API Reference](#api-reference)
8. [RBAC & Permissions](#rbac--permissions)
9. [Frontend Routes](#frontend-routes)
10. [Database Schema](#database-schema)
11. [Testing Guide](#testing-guide)
12. [Troubleshooting](#troubleshooting)
13. [FAQ](#faq)

---

## Overview

Phase 1 of BesaHubs CRM introduces three major feature sets that dramatically enhance the platform's capabilities:

### 🎯 Key Deliverables

1. **SendGrid Email Integration** - Professional email delivery with real-time tracking
2. **Calendar Synchronization** - Bi-directional sync with Google Calendar and Microsoft 365
3. **Custom Dashboards** - Drag-and-drop dashboard builder with advanced analytics

### 📊 Impact

- **Email Engagement**: Track every email interaction from delivery to click-through
- **Calendar Productivity**: Never miss a meeting or property showing
- **Data Insights**: Build custom visualizations tailored to your workflow

---

## What's New in Phase 1

### SendGrid Email Integration

**Overview**: Replace basic SMTP with enterprise-grade email delivery through SendGrid.

**Key Features**:
- ✅ Transactional email delivery (password resets, invitations, notifications)
- ✅ Dynamic template support with variable substitution
- ✅ Real-time webhook event tracking
- ✅ Campaign email analytics (opens, clicks, bounces, unsubscribes)
- ✅ Email event dashboard with filtering
- ✅ Webhook signature verification for security

**Business Value**:
- Track email effectiveness with open and click rates
- Improve deliverability with professional email infrastructure
- Automate property promotion emails to contacts
- Monitor campaign performance in real-time

### Calendar Integration

**Overview**: Seamlessly connect Google Calendar and Microsoft 365 to keep your schedule synchronized.

**Key Features**:
- ✅ OAuth 2.0 secure authentication
- ✅ Multi-account support (connect multiple calendars)
- ✅ Bi-directional event synchronization
- ✅ Create, update, and delete events from the CRM
- ✅ Automatic token refresh
- ✅ Event filtering by date range and status
- ✅ Support for attendees, locations, and timezones

**Business Value**:
- Automatically sync property showings and client meetings
- View all appointments in one centralized calendar view
- Never double-book meetings with real-time sync
- Work seamlessly with your existing calendar workflow

### Advanced Custom Dashboards

**Overview**: Build custom dashboards with drag-and-drop widgets to visualize your most important metrics.

**Key Features**:
- ✅ Drag-and-drop dashboard builder with react-grid-layout
- ✅ 6 widget types: KPI, Bar Chart, Line Chart, Pie Chart, Table, Funnel
- ✅ 6 datasets: Deals, Tasks, Properties, Contacts, Campaigns, Agents
- ✅ Custom query builder with filters and aggregations
- ✅ Dashboard sharing (specific users or entire roles)
- ✅ Auto-refresh intervals for widgets
- ✅ Responsive grid layouts
- ✅ Export dashboards to PDF/image (coming soon)

**Business Value**:
- Track pipeline health with custom metrics
- Monitor team performance with agent dashboards
- Visualize property inventory and deal velocity
- Share insights with stakeholders via shared dashboards

---

## Environment Setup

### Required Environment Variables

Add these to your `.env` file to enable Phase 1 features:

```bash
# =============================================================================
# PHASE 1: SENDGRID EMAIL INTEGRATION
# =============================================================================

# Enable/disable SendGrid integration (true/false)
SENDGRID_ENABLED=true

# SendGrid API Key from https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender email address (must be verified in SendGrid)
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=BesaHubs CRM

# Webhook signing key from SendGrid webhook settings
# Found at: https://app.sendgrid.com/settings/mail_settings > Event Webhook
SENDGRID_WEBHOOK_SIGNING_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...

# Dynamic Template IDs (create these in SendGrid dashboard)
SENDGRID_TEMPLATE_INVITE=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PROPERTY_PROMO=d-xxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# PHASE 1: CALENDAR INTEGRATION
# =============================================================================

# Enable/disable calendar integration (true/false)
CALENDAR_ENABLED=true

# Google Calendar OAuth 2.0 Credentials
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback

# Microsoft 365 OAuth 2.0 Credentials
# Get from: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
MS_CLIENT_ID=12345678-abcd-1234-abcd-123456789012
MS_CLIENT_SECRET=abc~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MS_REDIRECT_URI=http://localhost:3001/api/calendar/microsoft/callback
MS_TENANT_ID=common

# =============================================================================
# PHASE 1: ADVANCED DASHBOARDS
# =============================================================================

# Enable/disable advanced dashboard features (true/false)
DASHBOARDS_ENABLED=true

# =============================================================================
# PHASE 1: PUBLIC URLS (for OAuth callbacks and webhooks)
# =============================================================================

# Application base URL (frontend)
APP_BASE_URL=http://localhost:3000

# API base URL (backend)
API_BASE_URL=http://localhost:3001
```

### Production Configuration

For production deployments:

1. **Use HTTPS URLs** for all callback URLs
2. **Store secrets securely** using environment variable managers (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Enable webhook signing** for SendGrid to prevent spoofing
4. **Rotate OAuth credentials** regularly
5. **Use tenant-specific Microsoft IDs** instead of "common" for better security

---

## SendGrid Email Integration

### Step 1: Create SendGrid Account

1. Sign up at https://signup.sendgrid.com/
2. Verify your email address
3. Complete the sender verification process

### Step 2: Generate API Key

1. Navigate to **Settings** > **API Keys**
2. Click **Create API Key**
3. Name it "BesaHubs CRM Production"
4. Select **Full Access** (or **Restricted Access** with Mail Send permissions)
5. Copy the API key (you won't be able to see it again)
6. Add to `.env` as `SENDGRID_API_KEY`

### Step 3: Verify Sender Email

1. Go to **Settings** > **Sender Authentication**
2. Choose **Single Sender Verification** (recommended for getting started)
   - Or use **Domain Authentication** for production (requires DNS changes)
3. Add your sender email address
4. Verify the email address by clicking the link sent to your inbox
5. Use this verified email as `SENDGRID_FROM_EMAIL`

### Step 4: Create Dynamic Templates

BesaHubs uses three dynamic templates:

#### Template 1: Invitation Email

1. Navigate to **Email API** > **Dynamic Templates**
2. Click **Create a Dynamic Template**
3. Name it "User Invitation"
4. Click **Add Version** > **Blank Template** > **Code Editor**
5. Use this template:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to BesaHubs CRM</h1>
        </div>
        <div class="content">
            <p>Hi {{firstName}},</p>
            <p>You've been invited to join BesaHubs CRM as a {{role}}.</p>
            <p>Click the button below to set up your account:</p>
            <p><a href="{{inviteUrl}}" class="button">Accept Invitation</a></p>
            <p>This link expires in 7 days.</p>
        </div>
    </div>
</body>
</html>
```

6. Save and copy the Template ID (starts with `d-`)
7. Add to `.env` as `SENDGRID_TEMPLATE_INVITE`

#### Template 2: Password Reset

Follow the same process with this template:

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi {{firstName}},</p>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to create a new password:</p>
            <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link expires in 1 hour.</p>
        </div>
    </div>
</body>
</html>
```

Add the Template ID to `.env` as `SENDGRID_TEMPLATE_PASSWORD_RESET`

#### Template 3: Property Promotion

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .property-image { width: 100%; max-width: 500px; height: auto; }
        .button { display: inline-block; padding: 12px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Property Listing</h1>
        </div>
        <div class="content">
            <h2>{{propertyName}}</h2>
            <p>{{propertyAddress}}</p>
            <p><strong>Price:</strong> ${{price}}</p>
            <p><strong>Square Footage:</strong> {{squareFootage}} sq ft</p>
            <p><strong>Type:</strong> {{propertyType}}</p>
            <p>{{description}}</p>
            <p><a href="{{propertyUrl}}" class="button">View Property Details</a></p>
            <p>Contact {{agentName}} at {{agentEmail}} for more information.</p>
        </div>
    </div>
</body>
</html>
```

Add the Template ID to `.env` as `SENDGRID_TEMPLATE_PROPERTY_PROMO`

### Step 5: Configure Webhooks

Webhooks allow BesaHubs to receive real-time notifications when emails are opened, clicked, bounced, etc.

#### For Local Development (using ngrok):

1. Install ngrok: `npm install -g ngrok`
2. Start your BesaHubs backend: `npm run dev`
3. In a new terminal, create a tunnel: `ngrok http 3001`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### Configure in SendGrid:

1. Go to **Settings** > **Mail Settings** > **Event Webhook**
2. Toggle **Event Webhook Status** to ON
3. Set **HTTP Post URL** to: `https://your-domain.com/api/integrations/sendgrid/webhook`
   - For ngrok: `https://abc123.ngrok.io/api/integrations/sendgrid/webhook`
4. Select events to track:
   - ✅ Processed
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Bounce
   - ✅ Dropped
   - ✅ Spam Report
   - ✅ Unsubscribe
5. Click **Test Your Integration** - you should see a success message
6. **Enable Signed Event Webhook** (IMPORTANT for security)
7. Copy the **Verification Key**
8. Add to `.env` as `SENDGRID_WEBHOOK_SIGNING_KEY`

### Step 6: Test SendGrid Integration

1. Restart your backend server
2. Check logs for: `SendGrid client initialized successfully`
3. Test with the status endpoint:

```bash
curl -X GET http://localhost:3001/api/integrations/sendgrid/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "enabled": true,
  "configured": true,
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "BesaHubs CRM",
  "templates": {
    "invite": "d-xxxxx",
    "passwordReset": "d-yyyyy",
    "propertyPromo": "d-zzzzz"
  },
  "webhookUrl": "https://your-domain.com/api/integrations/sendgrid/webhook",
  "webhookSigningConfigured": true
}
```

---

## Calendar Integration

### Google Calendar Setup

#### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click **Select a project** > **New Project**
3. Name it "BesaHubs CRM"
4. Click **Create**

#### Step 2: Enable Google Calendar API

1. In the project dashboard, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click **Enable**

#### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (or **Internal** if using Google Workspace)
3. Fill in:
   - **App name**: BesaHubs CRM
   - **User support email**: your-email@domain.com
   - **Developer contact**: your-email@domain.com
4. Click **Save and Continue**
5. On **Scopes** page, click **Add or Remove Scopes**
6. Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click **Update** then **Save and Continue**
8. Add test users (your email addresses for testing)
9. Click **Save and Continue**

#### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: BesaHubs CRM
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `https://your-production-domain.com`
6. **Authorized redirect URIs**:
   - `http://localhost:3001/api/calendar/google/callback`
   - `https://your-production-domain.com/api/calendar/google/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**
9. Add to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback
   ```

#### Step 5: Test Google Calendar Connection

1. Restart backend server
2. Log into BesaHubs CRM
3. Navigate to **Settings** > **Integrations**
4. Click **Connect Google Calendar**
5. Authorize the app in the Google OAuth screen
6. You should be redirected back with a success message

### Microsoft 365 Calendar Setup

#### Step 1: Register Application in Azure AD

1. Go to https://portal.azure.com/
2. Navigate to **Azure Active Directory**
3. Click **App registrations** > **New registration**
4. Fill in:
   - **Name**: BesaHubs CRM
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
5. **Redirect URI**:
   - Platform: **Web**
   - URI: `http://localhost:3001/api/calendar/microsoft/callback`
6. Click **Register**

#### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `Calendars.ReadWrite`
   - `Calendars.ReadWrite.Shared`
   - `User.Read`
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

#### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Description: "BesaHubs CRM Production"
4. Expires: 24 months (recommended)
5. Click **Add**
6. **Copy the secret value immediately** (you won't see it again)

#### Step 4: Configure Environment Variables

1. From the app **Overview** page, copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**
2. Add to `.env`:
   ```bash
   MS_CLIENT_ID=12345678-abcd-1234-abcd-123456789012
   MS_CLIENT_SECRET=abc~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   MS_REDIRECT_URI=http://localhost:3001/api/calendar/microsoft/callback
   MS_TENANT_ID=common
   ```

**Note**: Use `MS_TENANT_ID=common` to support any Microsoft account, or use your specific tenant ID for organization-only access.

#### Step 5: Add Redirect URIs for Production

1. Go back to **Authentication**
2. Under **Redirect URIs**, add:
   - `https://your-production-domain.com/api/calendar/microsoft/callback`
3. Click **Save**

#### Step 6: Test Microsoft Calendar Connection

1. Restart backend server
2. Log into BesaHubs CRM
3. Navigate to **Settings** > **Integrations**
4. Click **Connect Microsoft Calendar**
5. Sign in with your Microsoft account
6. Accept the permissions
7. You should be redirected back with a success message

---

## Advanced Custom Dashboards

### Overview

The Advanced Dashboards feature requires no additional third-party setup—just enable the feature flag!

### Enable Dashboards

```bash
DASHBOARDS_ENABLED=true
```

Restart your backend server.

### Widget Types

1. **KPI (Key Performance Indicator)**
   - Display a single metric with comparison
   - Example: Total deals, Average deal value

2. **Bar Chart**
   - Compare values across categories
   - Example: Deals by stage, Properties by type

3. **Line Chart**
   - Show trends over time
   - Example: Deals closed per month

4. **Pie Chart**
   - Show proportions
   - Example: Market share by agent

5. **Table**
   - Display detailed records
   - Example: Top 10 deals by value

6. **Funnel**
   - Visualize conversion pipeline
   - Example: Deal progression through stages

### Available Datasets

1. **Deals** - Sales, leases, and investment deals
2. **Tasks** - User tasks and to-dos
3. **Properties** - Commercial real estate properties
4. **Contacts** - Individual contacts and leads
5. **Campaigns** - Email marketing campaigns
6. **Agents** - User/agent performance metrics

### Query Builder

Queries use a JSON structure:

```json
{
  "filters": {
    "stage": "won",
    "closedDate": { "gte": "2025-01-01" }
  },
  "groupBy": "assignedAgent",
  "aggregation": "sum",
  "field": "value",
  "limit": 10
}
```

### Permissions

Users need the following permissions to use dashboards:

- `dashboards:read` - View dashboards
- `dashboards:create` - Create new dashboards
- `dashboards:update` - Edit dashboards
- `dashboards:delete` - Delete dashboards

By default, all roles have `read` access. Only `admin` and `manager` roles can create/update/delete.

---

## API Reference

### SendGrid Integration

#### POST /api/integrations/sendgrid/webhook

Receives webhook events from SendGrid.

**Authentication**: None (verified by webhook signature)

**Request Body**:
```json
[
  {
    "email": "user@example.com",
    "timestamp": 1634567890,
    "event": "delivered",
    "sg_event_id": "sendgrid-event-id",
    "sg_message_id": "message-id",
    "campaignId": "uuid",
    "contactId": "uuid"
  }
]
```

**Response**:
```json
{
  "success": true,
  "processed": 1
}
```

**Event Types**: `processed`, `delivered`, `open`, `click`, `bounce`, `dropped`, `spamreport`, `unsubscribe`

#### GET /api/integrations/sendgrid/status

Get SendGrid integration status.

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
{
  "enabled": true,
  "configured": true,
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "BesaHubs CRM",
  "templates": {
    "invite": "d-xxxxx",
    "passwordReset": "d-yyyyy",
    "propertyPromo": "d-zzzzz"
  },
  "webhookUrl": "https://api.yourdomain.com/api/integrations/sendgrid/webhook",
  "webhookSigningConfigured": true
}
```

### Calendar Integration

#### GET /api/calendar/google/connect

Initialize Google Calendar OAuth flow.

**Authentication**: Required

**Permissions**: `calendar:create`

**Response**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

**Usage**: Redirect user to `authUrl` to begin OAuth flow.

#### GET /api/calendar/google/callback

OAuth callback endpoint for Google Calendar.

**Authentication**: None (uses state parameter for user identification)

**Query Parameters**:
- `code` (string, required) - Authorization code from Google
- `state` (string, required) - User ID

**Response**: HTML page that posts message to opener window and closes.

#### GET /api/calendar/microsoft/connect

Initialize Microsoft Calendar OAuth flow.

**Authentication**: Required

**Permissions**: `calendar:create`

**Response**:
```json
{
  "success": true,
  "data": {
    "authUrl": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
  }
}
```

#### GET /api/calendar/microsoft/callback

OAuth callback endpoint for Microsoft Calendar.

**Authentication**: None

**Query Parameters**:
- `code` (string, required) - Authorization code
- `state` (string, required) - User ID

**Response**: HTML page that posts message to opener window and closes.

#### POST /api/calendar/sync

Sync calendar events from connected account.

**Authentication**: Required

**Permissions**: `calendar:update`

**Request Body**:
```json
{
  "accountId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "eventCount": 42,
    "lastSyncedAt": "2025-10-19T12:00:00Z"
  }
}
```

#### GET /api/calendar/events

Fetch calendar events.

**Authentication**: Required

**Permissions**: `calendar:read`

**Query Parameters**:
- `accountId` (uuid, optional) - Filter by calendar account
- `from` (datetime, optional) - Start date
- `to` (datetime, optional) - End date
- `status` (string, optional) - Event status (`confirmed`, `tentative`, `cancelled`)
- `limit` (number, optional) - Max results (default: 100)
- `offset` (number, optional) - Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "calendarAccountId": "uuid",
        "externalId": "google-event-id",
        "title": "Property Showing - 123 Main St",
        "description": "Meet with client to show property",
        "start": "2025-10-20T14:00:00Z",
        "end": "2025-10-20T15:00:00Z",
        "location": "123 Main St, San Francisco, CA",
        "attendees": ["client@example.com"],
        "status": "confirmed",
        "isAllDay": false,
        "timezone": "America/Los_Angeles"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 100,
      "offset": 0
    }
  }
}
```

#### POST /api/calendar/events

Create a new calendar event.

**Authentication**: Required

**Permissions**: `calendar:create`

**Request Body**:
```json
{
  "accountId": "uuid",
  "title": "Client Meeting",
  "description": "Quarterly review",
  "start": "2025-10-25T10:00:00Z",
  "end": "2025-10-25T11:00:00Z",
  "location": "Office",
  "attendees": ["client@example.com"],
  "isAllDay": false,
  "timezone": "America/New_York"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "event": { /* event object */ }
  }
}
```

#### PUT /api/calendar/events/:id

Update an existing calendar event.

**Authentication**: Required

**Permissions**: `calendar:update`

**Request Body**: (all fields optional)
```json
{
  "title": "Updated Meeting Title",
  "start": "2025-10-25T11:00:00Z",
  "end": "2025-10-25T12:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "event": { /* updated event */ }
  }
}
```

#### DELETE /api/calendar/events/:id

Delete a calendar event.

**Authentication**: Required

**Permissions**: `calendar:delete`

**Response**:
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

#### GET /api/calendar/accounts

List connected calendar accounts for the current user.

**Authentication**: Required

**Permissions**: `calendar:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "provider": "google",
        "email": "user@gmail.com",
        "isActive": true,
        "lastSyncedAt": "2025-10-19T10:00:00Z",
        "expiresAt": "2025-10-19T11:00:00Z",
        "isTokenExpired": false,
        "needsSync": false
      }
    ]
  }
}
```

#### DELETE /api/calendar/accounts/:id/disconnect

Disconnect a calendar account.

**Authentication**: Required

**Permissions**: `calendar:delete`

**Response**:
```json
{
  "success": true,
  "message": "Calendar account disconnected successfully"
}
```

### Dashboard & Widget APIs

#### GET /api/dashboards

List all dashboards (user's own + shared with user).

**Authentication**: Required

**Permissions**: `dashboards:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "myDashboards": [
      {
        "id": "uuid",
        "name": "Sales Pipeline",
        "description": "Track deal progress",
        "isDefault": true,
        "isShared": false,
        "widgets": [ /* array of widgets */ ]
      }
    ],
    "sharedDashboards": [
      {
        "id": "uuid",
        "name": "Team Performance",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "widgets": []
      }
    ]
  }
}
```

#### POST /api/dashboards

Create a new dashboard.

**Authentication**: Required

**Permissions**: `dashboards:create`

**Request Body**:
```json
{
  "name": "My Custom Dashboard",
  "description": "Track key metrics",
  "layout": {},
  "isDefault": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Custom Dashboard",
    "userId": "uuid",
    "isShared": false
  }
}
```

#### GET /api/dashboards/:id

Get a specific dashboard with all widgets.

**Authentication**: Required

**Permissions**: `dashboards:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sales Pipeline",
    "description": "...",
    "widgets": [
      {
        "id": "uuid",
        "type": "kpi",
        "dataset": "deals",
        "title": "Total Deal Value",
        "query": { "filters": { "stage": "won" } },
        "position": { "x": 0, "y": 0, "w": 4, "h": 2 }
      }
    ],
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### PUT /api/dashboards/:id

Update a dashboard.

**Authentication**: Required

**Permissions**: `dashboards:update`

**Request Body**: (all fields optional)
```json
{
  "name": "Updated Dashboard Name",
  "description": "New description",
  "layout": { /* new layout */ }
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated dashboard */ }
}
```

#### DELETE /api/dashboards/:id

Delete a dashboard (soft delete).

**Authentication**: Required

**Permissions**: `dashboards:delete`

**Response**:
```json
{
  "success": true,
  "message": "Dashboard deleted successfully"
}
```

#### POST /api/dashboards/:id/share

Share a dashboard with users or roles.

**Authentication**: Required

**Permissions**: `dashboards:update`

**Request Body**:
```json
{
  "userIds": ["uuid1", "uuid2"],
  "roles": ["manager", "agent"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "isShared": true,
    "sharedWith": ["uuid1", "uuid2", "manager", "agent"]
  }
}
```

#### GET /api/dashboards/:id/widgets

Get all widgets for a dashboard.

**Authentication**: Required

**Permissions**: `dashboards:read`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "bar",
      "dataset": "deals",
      "title": "Deals by Stage",
      "query": { "groupBy": "stage" },
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }
  ]
}
```

#### POST /api/dashboards/:id/widgets

Add a widget to a dashboard.

**Authentication**: Required

**Permissions**: `dashboards:create`

**Request Body**:
```json
{
  "type": "bar",
  "dataset": "deals",
  "title": "Deals by Stage",
  "query": {
    "groupBy": "stage",
    "aggregation": "count"
  },
  "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
  "refreshInterval": 300
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dashboardId": "uuid",
    "type": "bar",
    "dataset": "deals",
    "title": "Deals by Stage"
  }
}
```

#### PUT /api/widgets/:id

Update a widget.

**Authentication**: Required

**Permissions**: `dashboards:update`

**Request Body**:
```json
{
  "title": "Updated Widget Title",
  "query": { /* updated query */ },
  "position": { "x": 6, "y": 0, "w": 6, "h": 4 }
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated widget */ }
}
```

#### DELETE /api/widgets/:id

Delete a widget.

**Authentication**: Required

**Permissions**: `dashboards:delete`

**Response**:
```json
{
  "success": true,
  "message": "Widget deleted successfully"
}
```

#### POST /api/dashboards/widgets/query

Execute a query without creating a widget (for testing).

**Authentication**: Required

**Permissions**: `dashboards:read`

**Request Body**:
```json
{
  "dataset": "deals",
  "query": {
    "filters": { "stage": "won" },
    "aggregation": "sum",
    "field": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "result": 5250000,
    "count": 42
  }
}
```

#### POST /api/dashboards/widgets/:id/refresh

Refresh widget data (invalidates cache).

**Authentication**: Required

**Permissions**: `dashboards:read`

**Response**:
```json
{
  "success": true,
  "data": {
    "result": { /* query results */ }
  }
}
```

### Email Events API

#### GET /api/email/events

Fetch email events with filtering.

**Authentication**: Required

**Query Parameters**:
- `contactId` (uuid, optional)
- `campaignId` (uuid, optional)
- `eventType` (string, optional) - `processed`, `delivered`, `open`, `click`, `bounce`, `unsubscribe`
- `page` (number, optional) - Default: 1
- `limit` (number, optional) - Default: 50
- `sortBy` (string, optional) - Default: `eventTimestamp`
- `sortOrder` (string, optional) - `ASC` or `DESC` (default)

**Response**:
```json
{
  "events": [
    {
      "id": "uuid",
      "contactId": "uuid",
      "campaignId": "uuid",
      "messageId": "sendgrid-message-id",
      "eventType": "open",
      "eventTimestamp": "2025-10-19T12:00:00Z",
      "metadata": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "total": 1500,
  "pagination": {
    "currentPage": 1,
    "totalPages": 30,
    "totalItems": 1500,
    "itemsPerPage": 50
  }
}
```

---

## RBAC & Permissions

### Permission Matrix

Phase 1 introduces the following new permissions:

| Resource | Action | Admin | Manager | Agent | Assistant |
|----------|--------|-------|---------|-------|-----------|
| `calendar` | `read` | ✅ | ✅ | ✅ | ✅ |
| `calendar` | `create` | ✅ | ✅ | ✅ | ❌ |
| `calendar` | `update` | ✅ | ✅ | ✅ | ❌ |
| `calendar` | `delete` | ✅ | ✅ | ✅ | ❌ |
| `dashboards` | `read` | ✅ | ✅ | ✅ | ✅ |
| `dashboards` | `create` | ✅ | ✅ | ❌ | ❌ |
| `dashboards` | `update` | ✅ | ✅ | ❌ | ❌ |
| `dashboards` | `delete` | ✅ | ✅ | ❌ | ❌ |
| `email_events` | `read` | ✅ | ✅ | ✅ (own) | ✅ (own) |

### Data Visibility Rules

#### Calendar Events
- Users can only see events from their own connected calendar accounts
- Admins cannot see other users' calendar events (privacy)

#### Dashboards
- Users see their own dashboards + dashboards shared with them
- Shared dashboards can be shared with:
  - Specific users (by user ID)
  - Entire roles (e.g., all "managers")

#### Email Events
- Users can see email events for:
  - Campaigns they created
  - Contacts they own/manage
- Admins and managers can see all email events

---

## Frontend Routes

Phase 1 adds the following new frontend routes:

### /calendar

**Description**: Calendar view with event management

**Features**:
- List view and calendar grid view
- Filter by date range and calendar account
- Create, edit, and delete events
- Sync events from connected accounts
- Multi-account support

**Access**: All authenticated users

### /dashboards

**Description**: List of all dashboards

**Features**:
- View user's own dashboards
- View shared dashboards
- Create new dashboard
- Set default dashboard

**Access**: All authenticated users

### /dashboards/:id

**Description**: View a specific dashboard

**Features**:
- Drag-and-drop widget layout
- Add/edit/delete widgets
- Share dashboard
- Auto-refresh widgets
- Export dashboard (coming soon)

**Access**: Dashboard owner or users with whom it's shared

### /dashboards/new

**Description**: Create a new dashboard

**Features**:
- Name and describe dashboard
- Choose layout
- Add initial widgets

**Access**: Admins and managers only

### /settings/integrations

**Description**: Manage third-party integrations

**Features**:
- Connect/disconnect Google Calendar
- Connect/disconnect Microsoft Calendar
- View SendGrid status and configuration
- Test email sending

**Access**: All authenticated users

---

## Database Schema

### EmailEvent

Stores email event data from SendGrid webhooks.

```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  campaign_id UUID REFERENCES campaigns(id),
  message_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- processed, delivered, open, click, bounce, dropped, spamreport, unsubscribe
  event_timestamp TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_events_contact_id ON email_events(contact_id);
CREATE INDEX idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);
CREATE INDEX idx_email_events_timestamp ON email_events(event_timestamp DESC);
```

**Fields**:
- `id` - Unique identifier
- `contact_id` - FK to contacts table (optional)
- `campaign_id` - FK to campaigns table (optional)
- `message_id` - SendGrid message ID
- `event_type` - Type of email event
- `event_timestamp` - When the event occurred
- `metadata` - Additional data (IP, user agent, URL clicked, etc.)

### CalendarAccount

Stores OAuth credentials for connected calendar accounts.

```sql
CREATE TABLE calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- google, microsoft
  email VARCHAR(255) NOT NULL,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  expires_at TIMESTAMP,
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_accounts_user_id ON calendar_accounts(user_id);
CREATE INDEX idx_calendar_accounts_provider ON calendar_accounts(provider);
CREATE INDEX idx_calendar_accounts_user_provider ON calendar_accounts(user_id, provider);
```

**Fields**:
- `id` - Unique identifier
- `user_id` - FK to users table
- `provider` - Calendar provider (google or microsoft)
- `email` - Email address of the calendar account
- `access_token` - Encrypted OAuth access token
- `refresh_token` - Encrypted OAuth refresh token
- `expires_at` - Token expiration timestamp
- `scopes` - Array of granted OAuth scopes
- `is_active` - Whether account is active
- `last_synced_at` - Last sync timestamp

**Methods**:
- `isTokenExpired()` - Check if access token has expired
- `needsSync()` - Check if sync is needed (>15 minutes since last sync)

### CalendarEvent

Stores calendar events synchronized from external calendars.

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_account_id UUID NOT NULL REFERENCES calendar_accounts(id),
  external_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start TIMESTAMP NOT NULL,
  "end" TIMESTAMP NOT NULL,
  location VARCHAR(500),
  attendees JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  is_all_day BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(100) DEFAULT 'UTC',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(calendar_account_id, external_id)
);

CREATE INDEX idx_calendar_events_account_id ON calendar_events(calendar_account_id);
CREATE INDEX idx_calendar_events_start ON calendar_events(start);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
```

**Fields**:
- `id` - Unique identifier
- `calendar_account_id` - FK to calendar_accounts
- `external_id` - Event ID from Google/Microsoft
- `title` - Event title
- `description` - Event description
- `start` - Start datetime
- `end` - End datetime
- `location` - Event location
- `attendees` - Array of attendee emails
- `status` - Event status (confirmed, tentative, cancelled)
- `is_all_day` - Whether it's an all-day event
- `timezone` - Event timezone
- `metadata` - Additional event data

**Methods**:
- `getDuration()` - Get event duration in minutes
- `isUpcoming()` - Check if event is in the future
- `isPast()` - Check if event has ended
- `isOngoing()` - Check if event is currently happening

### Dashboard

Stores user-created custom dashboards.

```sql
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with JSONB DEFAULT '[]', -- array of user IDs and role names
  layout JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboards_is_shared ON dashboards(is_shared);
CREATE INDEX idx_dashboards_is_default ON dashboards(user_id, is_default);
```

**Fields**:
- `id` - Unique identifier
- `user_id` - FK to users (dashboard owner)
- `name` - Dashboard name
- `description` - Dashboard description
- `is_shared` - Whether dashboard is shared
- `shared_with` - Array of user IDs or role names with access
- `layout` - Grid layout configuration
- `is_default` - Whether this is the user's default dashboard
- `is_active` - Soft delete flag

**Methods**:
- `isSharedWithUser(userId)` - Check if shared with a specific user
- `addSharedUser(userId)` - Share with a user
- `removeSharedUser(userId)` - Unshare from a user

**Hooks**:
- Before create/update: If setting `is_default=true`, unset other default dashboards for this user

### Widget

Stores dashboard widgets.

```sql
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id),
  type VARCHAR(50) NOT NULL, -- kpi, bar, line, pie, table, funnel
  dataset VARCHAR(50) NOT NULL, -- deals, tasks, properties, contacts, campaigns, agents
  query JSONB DEFAULT '{}',
  title VARCHAR(200) NOT NULL,
  position JSONB DEFAULT '{"x":0,"y":0,"w":4,"h":4}',
  refresh_interval INTEGER, -- seconds
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widgets_dashboard_id ON widgets(dashboard_id);
CREATE INDEX idx_widgets_type ON widgets(type);
CREATE INDEX idx_widgets_dataset ON widgets(dataset);
```

**Fields**:
- `id` - Unique identifier
- `dashboard_id` - FK to dashboards
- `type` - Widget visualization type
- `dataset` - Data source
- `query` - Query configuration (filters, groupBy, aggregation)
- `title` - Widget title
- `position` - Grid position and size `{x, y, w, h}`
- `refresh_interval` - Auto-refresh interval in seconds
- `is_active` - Soft delete flag

**Methods**:
- `shouldRefresh()` - Check if widget data should be refreshed

---

## Testing Guide

### SendGrid Testing

#### Test 1: Verify Configuration

```bash
# Get SendGrid status
curl -X GET http://localhost:3001/api/integrations/sendgrid/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: enabled=true, configured=true, all template IDs present
```

#### Test 2: Simulate Webhook Event

```bash
# Send a test webhook
curl -X POST http://localhost:3001/api/integrations/sendgrid/webhook \
  -H "Content-Type: application/json" \
  -d '[{
    "email": "test@example.com",
    "timestamp": 1634567890,
    "event": "delivered",
    "sg_message_id": "test-message-id",
    "contactId": "your-contact-uuid",
    "campaignId": "your-campaign-uuid"
  }]'

# Expected: {"success":true,"processed":1}
```

#### Test 3: Check Email Events

```bash
# Fetch email events
curl -X GET "http://localhost:3001/api/email/events?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should see the test event you just created
```

#### Test 4: Send Real Email (Development)

Use the test script:

```bash
cd server
npm run test:sendgrid
```

### Calendar Testing

#### Test 1: Connect Google Calendar

1. Navigate to http://localhost:3000/settings/integrations
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify you're redirected back with success message
5. Check that account appears in connected accounts list

#### Test 2: Sync Events

```bash
# Get calendar accounts
curl -X GET http://localhost:3001/api/calendar/accounts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Copy account ID, then sync
curl -X POST http://localhost:3001/api/calendar/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "your-account-uuid"}'

# Should return eventCount
```

#### Test 3: Create Event

```bash
curl -X POST http://localhost:3001/api/calendar/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-uuid",
    "title": "Test Event from API",
    "start": "2025-10-25T14:00:00Z",
    "end": "2025-10-25T15:00:00Z",
    "description": "Testing BesaHubs API"
  }'

# Check your Google Calendar - event should appear
```

#### Test 4: Fetch Events

```bash
curl -X GET "http://localhost:3001/api/calendar/events?from=2025-10-20&to=2025-10-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return events in date range
```

### Dashboard Testing

#### Test 1: Create Dashboard

1. Navigate to http://localhost:3000/dashboards
2. Click "New Dashboard"
3. Enter name and description
4. Click "Create"
5. Verify dashboard appears in list

#### Test 2: Add Widget

1. Open a dashboard
2. Click "Add Widget"
3. Select:
   - Type: Bar Chart
   - Dataset: Deals
   - Query: Group by `stage`
4. Click "Add"
5. Verify widget displays with data

#### Test 3: Test Query Engine

```bash
curl -X POST http://localhost:3001/api/dashboards/widgets/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": "deals",
    "query": {
      "groupBy": "stage",
      "aggregation": "count"
    }
  }'

# Should return counts by deal stage
```

#### Test 4: Share Dashboard

```bash
# Get dashboard ID from UI, then share it
curl -X POST http://localhost:3001/api/dashboards/DASHBOARD_UUID/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["manager"]
  }'

# Log in as a manager user - dashboard should appear in "Shared with Me"
```

### Verification Checklist

Before marking Phase 1 as complete, verify:

- [ ] SendGrid
  - [ ] API key configured and validated
  - [ ] All 3 templates created and working
  - [ ] Webhooks receiving events successfully
  - [ ] Email events appear in database
  - [ ] Email event dashboard shows data

- [ ] Google Calendar
  - [ ] OAuth app created and configured
  - [ ] OAuth flow completes successfully
  - [ ] Events sync from Google to BesaHubs
  - [ ] Can create event in BesaHubs and it appears in Google
  - [ ] Can update and delete events

- [ ] Microsoft Calendar
  - [ ] Azure AD app created and configured
  - [ ] OAuth flow completes successfully
  - [ ] Events sync from Microsoft to BesaHubs
  - [ ] Can create event in BesaHubs and it appears in Microsoft
  - [ ] Can update and delete events

- [ ] Dashboards
  - [ ] Feature enabled and accessible
  - [ ] Can create, update, delete dashboards
  - [ ] All widget types render correctly
  - [ ] Query engine returns accurate data
  - [ ] Sharing works (user IDs and roles)
  - [ ] Grid layout persists correctly

---

## Troubleshooting

### SendGrid Issues

**Problem**: `SendGrid API key not configured` error

**Solution**:
1. Verify `SENDGRID_API_KEY` is in `.env`
2. Check the API key is valid in SendGrid dashboard
3. Ensure `SENDGRID_ENABLED=true`
4. Restart backend server

---

**Problem**: Webhooks not receiving events

**Solution**:
1. **Check webhook URL is publicly accessible**
   - For local dev, use ngrok: `ngrok http 3001`
   - Update SendGrid webhook URL with ngrok HTTPS URL
2. **Verify webhook configuration in SendGrid**
   - Go to Settings > Mail Settings > Event Webhook
   - Ensure it's enabled
   - Test the integration
3. **Check webhook signature verification**
   - Ensure `SENDGRID_WEBHOOK_SIGNING_KEY` matches the key in SendGrid
   - Look for signature verification errors in server logs
4. **Check server logs**
   - Look for webhook processing errors
   - Verify events are being saved to database

---

**Problem**: Template variables not populating

**Solution**:
1. Check template ID is correct in `.env`
2. Verify variable names match exactly (case-sensitive)
3. Test template in SendGrid dashboard with sample data
4. Check server logs for email sending errors

---

### Calendar Integration Issues

**Problem**: OAuth flow fails with "redirect_uri_mismatch"

**Solution**:
1. **Google**: Verify redirect URI in Google Cloud Console matches exactly
   - Go to APIs & Services > Credentials > OAuth 2.0 Client ID
   - Ensure `http://localhost:3001/api/calendar/google/callback` is in the list
2. **Microsoft**: Verify redirect URI in Azure AD
   - Go to App Registrations > Authentication
   - Ensure `http://localhost:3001/api/calendar/microsoft/callback` is in the list
3. Check `.env` file has correct `GOOGLE_REDIRECT_URI` or `MS_REDIRECT_URI`
4. Restart backend server

---

**Problem**: "Access token expired" errors

**Solution**:
1. Access tokens expire after 1 hour (Google) or varies (Microsoft)
2. BesaHubs automatically refreshes tokens using refresh tokens
3. If refresh fails:
   - Disconnect and reconnect the calendar account
   - Check that refresh token exists in database
   - Verify OAuth app has "offline access" scope (Google) or refresh token permission (Microsoft)

---

**Problem**: Events not syncing

**Solution**:
1. Check account status: `GET /api/calendar/accounts`
2. Look for `isActive: false` - reconnect account if inactive
3. Check `lastSyncedAt` - manually trigger sync if old
4. Verify scopes include calendar read/write permissions
5. Check server logs for sync errors
6. Ensure API is enabled in Google Cloud Console (Google Calendar API)

---

**Problem**: Can't create events - "Calendar account inactive"

**Solution**:
1. Account became inactive due to token issues
2. Disconnect the account: `DELETE /api/calendar/accounts/:id/disconnect`
3. Reconnect: Go to Settings > Integrations > Connect Calendar
4. Retry creating event

---

### Dashboard Issues

**Problem**: Dashboards page shows "Feature not enabled"

**Solution**:
1. Add `DASHBOARDS_ENABLED=true` to `.env`
2. Restart backend server
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

**Problem**: Widget query returns no data

**Solution**:
1. **Check permissions**: User must have read access to the dataset
   - `deals:read` for deals dataset
   - `tasks:read` for tasks dataset
   - etc.
2. **Verify query syntax**: Test with `/api/dashboards/widgets/query` endpoint
3. **Check RBAC filters**: Some data may be filtered by role
   - Agents only see their own deals/contacts
   - Managers see their team's data
   - Admins see all data
4. **Seed data**: Run `npm run seed:phase1` to add sample data

---

**Problem**: Widget not refreshing automatically

**Solution**:
1. Check `refreshInterval` is set on the widget
2. Verify value is in seconds (not milliseconds)
3. Minimum refresh interval is 60 seconds
4. Check browser console for errors
5. Manually refresh widget to test query

---

**Problem**: Dashboard sharing not working

**Solution**:
1. **Verify sharing configuration**:
   ```bash
   GET /api/dashboards/:id
   # Check: isShared=true, sharedWith array includes user/role
   ```
2. **User ID vs Role**: Ensure you're using the correct identifier
   - User ID: UUID from users table
   - Role: String like "manager", "agent"
3. **Permissions**: Shared user must have `dashboards:read` permission
4. **Re-share**: Try removing and re-adding the share

---

### General Issues

**Problem**: Feature flags not working after changing `.env`

**Solution**:
1. **Always restart backend server** after changing `.env`
2. Check server startup logs for feature flag status:
   ```
   SENDGRID_ENABLED: ✅ ENABLED
   CALENDAR_ENABLED: ✅ ENABLED
   DASHBOARDS_ENABLED: ⚪ DISABLED
   ```
3. Verify environment variables are loaded:
   ```bash
   # In server directory
   node -e "require('dotenv').config(); console.log(process.env.SENDGRID_ENABLED)"
   ```

---

**Problem**: Permission denied errors

**Solution**:
1. **Seed RBAC**: Run `npm run seed:rbac` to set up roles and permissions
2. **Check user's role**:
   ```sql
   SELECT u.email, r.name as role
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE u.email = 'your@email.com';
   ```
3. **Review RBAC matrix** above to see required permissions
4. **Assign missing permission**:
   ```bash
   # Use admin UI: Settings > Roles > Manage Permissions
   ```

---

**Problem**: Database tables missing

**Solution**:
1. Run database migrations:
   ```bash
   cd server
   npm run db:push
   ```
2. If tables still missing, force push:
   ```bash
   npm run db:push:force
   ```
   ⚠️ **Warning**: This will drop and recreate tables (data loss)
3. Re-seed data:
   ```bash
   npm run seed:all
   ```

---

## FAQ

### General Questions

**Q: Do I need all three Phase 1 features enabled?**

A: No. Each feature can be enabled independently using feature flags:
- `SENDGRID_ENABLED` for email integration
- `CALENDAR_ENABLED` for calendar sync
- `DASHBOARDS_ENABLED` for custom dashboards

---

**Q: Can I use the app without Phase 1 features?**

A: Yes! Phase 1 features are completely optional. The core CRM functionality works without them. Simply leave the feature flags set to `false` or undefined.

---

**Q: Will Phase 1 features work with my existing data?**

A: Yes. Phase 1 features integrate seamlessly with existing contacts, deals, properties, and campaigns. For example:
- Email events link to existing campaigns and contacts
- Calendar events can be linked to properties and deals (coming in Phase 2)
- Dashboards visualize your existing CRM data

---

### SendGrid Questions

**Q: Can I use a different email provider instead of SendGrid?**

A: SendGrid is currently the only supported transactional email provider for Phase 1. However, the existing SMTP configuration still works for basic email sending. SendGrid is required only for advanced features like webhook event tracking and dynamic templates.

---

**Q: Do I need a paid SendGrid account?**

A: SendGrid offers a free tier with 100 emails/day, which is sufficient for testing. For production use, you'll likely need a paid plan based on your email volume.

---

**Q: How do I test webhooks locally?**

A: Use ngrok to create a public HTTPS tunnel to your local server:
```bash
ngrok http 3001
# Use the HTTPS URL in SendGrid webhook settings
```

---

**Q: What happens if webhook signature verification fails?**

A: The webhook event is rejected with a 403 error and logged. The email event is not saved to the database. Check that `SENDGRID_WEBHOOK_SIGNING_KEY` matches the key in your SendGrid account.

---

### Calendar Questions

**Q: Can I connect multiple Google or Microsoft accounts?**

A: Yes! Each user can connect multiple calendar accounts from either provider. All events are synced and displayed in the unified calendar view.

---

**Q: What happens if my calendar OAuth token expires?**

A: BesaHubs automatically refreshes access tokens using the refresh token. If the refresh fails, the account is marked as inactive, and you'll need to reconnect it through Settings > Integrations.

---

**Q: Can I sync past events?**

A: Yes. By default, sync pulls events from 90 days in the past and 60 days in the future. This range can be adjusted in the sync API call.

---

**Q: Do changes in BesaHubs sync back to Google/Microsoft?**

A: Yes! The integration is bi-directional:
- Creating an event in BesaHubs creates it in the connected calendar
- Updating an event in BesaHubs updates it in the calendar
- Deleting an event in BesaHubs deletes it from the calendar
- Changes made directly in Google/Microsoft appear in BesaHubs after next sync

---

**Q: Which Microsoft accounts are supported?**

A: Both Microsoft 365 (business) and personal Microsoft accounts are supported when using `MS_TENANT_ID=common`. For organization-only access, use your specific tenant ID.

---

### Dashboard Questions

**Q: How many widgets can I add to a dashboard?**

A: There's no hard limit, but performance may degrade with >20 widgets. We recommend keeping dashboards focused with 8-12 widgets for optimal performance.

---

**Q: Can I export dashboards?**

A: Dashboard export (PDF/image) is planned for a future release. Currently, you can share dashboards with other users or roles.

---

**Q: What's the difference between sharing with a user vs a role?**

A:
- **User sharing**: Specific individual gets access (use user UUID)
- **Role sharing**: Everyone with that role gets access (use "admin", "manager", "agent", "assistant")

Example: Sharing with "manager" role means all current and future managers can view the dashboard.

---

**Q: Can agents create dashboards?**

A: By default, no. Only admins and managers have `dashboards:create` permission. However, this can be customized by modifying role permissions in Settings > Roles.

---

**Q: How often do widgets refresh?**

A: 
- **Manual refresh**: Click the refresh icon on any widget
- **Auto refresh**: Set `refreshInterval` (in seconds) when creating the widget
- **Recommended**: 300 seconds (5 minutes) for most widgets

---

**Q: Can I query across multiple datasets?**

A: Not currently. Each widget queries a single dataset (deals, tasks, properties, contacts, campaigns, or agents). To combine data from multiple sources, create separate widgets on the same dashboard.

---

### Performance Questions

**Q: Will Phase 1 slow down my application?**

A: No. Phase 1 features are designed to be performant:
- Calendar syncing happens in the background
- Email webhooks are processed asynchronously
- Dashboard queries use caching and pagination
- Feature flags allow you to disable unused features

---

**Q: How much database storage does Phase 1 require?**

A: Storage requirements depend on usage:
- **Email events**: ~1 KB per event (1 million events = ~1 GB)
- **Calendar events**: ~2 KB per event (10,000 events = ~20 MB)
- **Dashboards & widgets**: Negligible (~10 KB per dashboard)

---

---

## Support & Additional Resources

### External Documentation

- **SendGrid Docs**: https://docs.sendgrid.com/
- **Google Calendar API**: https://developers.google.com/calendar
- **Microsoft Graph Calendar**: https://learn.microsoft.com/en-us/graph/api/resources/calendar

### Internal Documentation

- [Main README](../README.md)
- [Security Documentation](security.md)
- [Client User Guide](../CLIENT_USER_GUIDE.md)

### Getting Help

For issues not covered in this guide:
1. Check server logs for error messages
2. Review the [Troubleshooting](#troubleshooting) section
3. Test endpoints using the [Postman Collection](postman/BesaHubs-Phase1.postman_collection.json)
4. Contact your development team

---

**Phase 1 Documentation - Last Updated: October 19, 2025**

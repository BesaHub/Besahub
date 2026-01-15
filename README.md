# BesaHubs - Commercial Real Estate CRM

**BesaHubs** is a production-ready Commercial Real Estate CRM system built with React, Node.js, and PostgreSQL. It provides comprehensive tools for managing contacts, properties, deals, leases, debt obligations, and more, with enterprise-grade security features including MFA, RBAC, audit logging, and data encryption.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd besahubs-crm
   ```

2. **Install dependencies:**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env and add your configuration
   nano .env
   ```

4. **Initialize the database:**
   ```bash
   cd server
   npm run db:push
   npm run seed:rbac
   ```

5. **Start the development servers:**
   ```bash
   # From root directory - starts both server and client
   npm run dev
   ```
   
   **Note**: The `npm run dev` command automatically sets `DEMO_MODE=true` to enable demo login.

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   
   **Demo Login Credentials** (requires `DEMO_MODE=true`):
   - Email: `admin@demo.com`
   - Password: `Admin@Demo123`
   
   📖 See [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md) for detailed setup instructions and troubleshooting.

---

## ✨ Core Features

### Property & Deal Management
- **Property Management** - Track commercial properties with detailed information
- **Deal Pipeline** - Manage sales, leases, and investment deals through customizable stages
- **Company & Contact Management** - CRM for businesses and individual contacts
- **Document Management** - Upload and organize property documents, contracts, and files
- **Advanced Search & Filtering** - Find properties and deals quickly with powerful filters

### Financial & Legal
- **Lease Management** - Track lease agreements, payments, and renewals
- **Debt Tracking** - Monitor loans, mortgages, and debt obligations
- **Commission Tracking** - Calculate and manage agent commissions
- **Market Analytics** - View real estate market trends and property valuations

### Communication & Collaboration
- **Task Management** - Create, assign, and track tasks with priorities and due dates
- **Activity Tracking** - Log calls, emails, meetings, and other interactions
- **Team Collaboration** - Role-based access control with teams and permissions
- **Notifications** - Real-time notifications for important events

### Security & Compliance
- **Multi-Factor Authentication (MFA)** - TOTP-based two-factor authentication
- **Role-Based Access Control (RBAC)** - Granular permissions for different user roles
- **Audit Logging** - Comprehensive audit trail with tamper-proof hash chaining
- **Data Encryption** - PII encryption at rest using PostgreSQL pgcrypto
- **GDPR Compliance** - Data export, right to be forgotten, and privacy controls

### Analytics & Reporting
- **Dashboard Analytics** - Visualize key metrics and KPIs
- **Pipeline Analytics** - Track deal flow and conversion rates
- **Custom Reports** - Generate reports on properties, deals, contacts, and more
- **Market Data Integration** - Real-time property data from ATTOM, Estated, and other APIs

---

## 🎯 Phase 1 Features (NEW)

Phase 1 introduces powerful integrations and advanced dashboard capabilities to supercharge your CRM workflow.

### 📧 SendGrid Email Integration
- **Transactional Emails** - Send password resets, invitations, and property promotions
- **Email Event Tracking** - Track opens, clicks, bounces, and unsubscribes in real-time
- **Webhook Processing** - Automatic event processing with signature verification
- **Dynamic Templates** - Use SendGrid's dynamic templates for professional emails
- **Campaign Analytics** - View email performance metrics for your campaigns

### 📅 Calendar Integration (Google & Microsoft)
- **OAuth2 Authentication** - Secure calendar connections with Google and Microsoft
- **Bi-directional Sync** - Sync events between BesaHubs and your calendar
- **Event Management** - Create, update, and delete calendar events from the CRM
- **Multi-Account Support** - Connect multiple calendar accounts per user
- **Automatic Refresh** - Keep events up-to-date with automatic token refresh

### 📊 Advanced Custom Dashboards
- **Drag-and-Drop Builder** - Create custom dashboards with an intuitive interface
- **Multiple Widget Types** - KPI cards, bar charts, line charts, pie charts, tables, and funnels
- **Real-time Queries** - Execute queries against 6 datasets (deals, tasks, properties, contacts, campaigns, agents)
- **Dashboard Sharing** - Share dashboards with specific users or roles
- **Auto-refresh** - Set custom refresh intervals for widgets
- **Responsive Layouts** - Grid-based layouts that adapt to different screen sizes

### 🔗 Quick Links
- **[Phase 1 Complete Documentation](docs/PHASE1.md)** - Detailed setup guides and API documentation
- **[Postman Collection](docs/postman/BesaHubs-Phase1.postman_collection.json)** - Import and test all Phase 1 API endpoints

---

## 🏃 Phase 1 Quick Start

### 1. Enable Phase 1 Features

Update your `.env` file:

```bash
# SendGrid Email Integration
SENDGRID_ENABLED=true
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=BesaHubs CRM
SENDGRID_WEBHOOK_SIGNING_KEY=your-webhook-signing-key
SENDGRID_TEMPLATE_INVITE=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PROPERTY_PROMO=d-xxxxxxxxxxxxxxxxxxxxx

# Calendar Integration
CALENDAR_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/google/callback

MS_CLIENT_ID=your-microsoft-client-id
MS_CLIENT_SECRET=your-microsoft-client-secret
MS_REDIRECT_URI=http://localhost:3001/api/calendar/microsoft/callback
MS_TENANT_ID=common

# Advanced Dashboards
DASHBOARDS_ENABLED=true

# Public URLs (for OAuth callbacks)
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
```

### 2. Seed Phase 1 Data

```bash
cd server
npm run seed:phase1
```

This creates sample data including:
- Email campaigns and events
- Calendar accounts and events  
- Custom dashboards with widgets

### 3. Access Phase 1 Features

- **Calendar**: Navigate to `/calendar` in the app
- **Dashboards**: Navigate to `/dashboards` in the app
- **Integrations**: Go to Settings > Integrations to connect calendars and view SendGrid status
- **Email Events**: Check campaign details to see email tracking data

---

## 🛠️ NPM Scripts

### Backend (Server)

```bash
# Development
npm run dev              # Start development server with nodemon

# Database
npm run db:push          # Push schema changes to database
npm run db:push:force    # Force push (data loss warning)

# Seeding
npm run seed:all         # Seed all data (base + Phase 1)
npm run seed:rbac        # Seed roles and permissions only
npm run seed:phase1      # Seed Phase 1 data (emails, calendars, dashboards)

# Testing
npm test                 # Run all tests
npm run test:security    # Run security tests (OWASP, RBAC)
npm run test:e2e         # Run end-to-end tests

# Utilities
npm run backup           # Create database backup
npm run restore          # Restore from backup
npm run rotate-keys      # Rotate encryption keys
```

### Frontend (Client)

```bash
npm start                # Start development server on port 3000
npm run build            # Production build
npm test                 # Run tests
```

---

## 🔧 Configuration

### Required Environment Variables

```bash
# Core
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/besahubs_crm

# Security (REQUIRED)
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-different-refresh-secret-min-32-chars
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# Frontend
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Optional Integrations

See `.env.example` for complete configuration options including:
- Redis caching
- SMTP/SendGrid email
- Google/Microsoft Calendar OAuth
- External market data APIs (ATTOM, Estated)
- Third-party services (Twilio, Cloudinary, Stripe, DocuSign)

---

## 📚 Documentation

- **[Phase 1 Documentation](docs/PHASE1.md)** - SendGrid, Calendar, and Dashboard features
- **[Security Documentation](docs/security.md)** - Security features and best practices
- **[Compliance Guide](docs/compliance.md)** - GDPR and data protection compliance
- **[Client User Guide](CLIENT_USER_GUIDE.md)** - End-user documentation
- **[Database Security Guidelines](DATABASE_SECURITY_GUIDELINES.md)** - Database security practices

---

## 🔐 Default Credentials

### Demo Mode (Development Only)

**Important**: Demo mode must be enabled for demo login to work.

The `npm run dev` command automatically sets `DEMO_MODE=true`, but if you're running the server manually, ensure your `.env` file has:

```env
DEMO_MODE=true
NODE_ENV=development
```

**Demo Login Credentials**:
- **Email**: `admin@demo.com`
- **Password**: `Admin@Demo123`

⚠️ **Warning**: Demo credentials are automatically blocked in production (`NODE_ENV=production`)

If you see "Demo mode is not enabled" error, see [LOCALHOST_SETUP.md](./LOCALHOST_SETUP.md) for troubleshooting.

---

## 🏗️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM
- **Redis** - Caching (optional)
- **SendGrid** - Email service
- **Google APIs** - Calendar integration
- **Microsoft Graph** - Microsoft 365 integration

### Frontend
- **React** - UI library
- **Material-UI** - Component library
- **Recharts** - Data visualization
- **React Grid Layout** - Dashboard builder
- **Axios** - HTTP client

### Security
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **speakeasy** - TOTP for MFA
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **PostgreSQL pgcrypto** - Data encryption

---

## 🐛 Phase 1 Troubleshooting

### SendGrid Issues

**Problem**: Emails not sending
- ✅ Verify `SENDGRID_API_KEY` is correct
- ✅ Check `SENDGRID_ENABLED=true` in `.env`
- ✅ Ensure SendGrid account is active and verified
- ✅ Check server logs for error messages

**Problem**: Webhooks not working
- ✅ Verify webhook URL is publicly accessible (use ngrok for local dev)
- ✅ Check `SENDGRID_WEBHOOK_SIGNING_KEY` matches SendGrid dashboard
- ✅ Ensure webhook URL ends with `/api/integrations/sendgrid/webhook`
- ✅ Check SendGrid webhook logs in dashboard

### Calendar Integration Issues

**Problem**: OAuth authentication fails
- ✅ Verify OAuth credentials (`GOOGLE_CLIENT_ID`, `MS_CLIENT_ID`, etc.)
- ✅ Check redirect URIs match exactly in OAuth app settings
- ✅ Ensure `CALENDAR_ENABLED=true` in `.env`
- ✅ For Google: Enable Google Calendar API in Google Cloud Console
- ✅ For Microsoft: Add correct permissions in Azure AD

**Problem**: Calendar sync not working
- ✅ Check if access token has expired (account status endpoint)
- ✅ Verify required scopes are granted
- ✅ Try disconnecting and reconnecting the calendar account
- ✅ Check server logs for API errors

### Dashboard Issues

**Problem**: Dashboards feature not available
- ✅ Verify `DASHBOARDS_ENABLED=true` in `.env`
- ✅ Restart the backend server after changing feature flags
- ✅ Check user has `dashboards:read` permission

**Problem**: Widget queries failing
- ✅ Verify dataset and query syntax
- ✅ Check user has permissions to access the dataset
- ✅ Review query engine logs for errors
- ✅ Test query using `/api/dashboards/widgets/query` endpoint

### General Issues

**Problem**: Feature flags not working
- ✅ Restart backend server after changing `.env`
- ✅ Check `server/config/featureFlags.js` for flag names
- ✅ Verify environment variables are loaded (check server startup logs)

**Problem**: Permission denied errors
- ✅ Run `npm run seed:rbac` to ensure permissions are set up
- ✅ Check user's role has the required permissions
- ✅ Review RBAC matrix in [Phase 1 Documentation](docs/PHASE1.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues, questions, or feature requests, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Commercial Real Estate professionals**

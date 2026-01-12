# BesaHubs Commercial Real Estate CRM - MVP Edition

## Overview
BesaHubs is a comprehensive Commercial Real Estate CRM designed to manage core property, contact, deal, and company operations with advanced team and marketing capabilities. The system features 9+ essential CRM modules with resilient database fallback mechanisms to ensure functionality even with intermittent connectivity. Built with enterprise-grade security and performance optimization, the project provides a robust, efficient, and user-friendly platform for commercial real estate professionals.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with Material-UI (MUI).
- **Design Principles**: Professional, CRE-focused layout with improved visual hierarchy, consistent typography, unified spacing, and a theme-based color palette.
- **Key UI/UX Features**: Enhanced KPIs with trend indicators, advanced sorting and filtering, color-coded status indicators, quick action buttons, responsive layouts, route-level code splitting, comprehensive memoization, pagination, and debounced search for optimized performance.
- **Modern UI**: Premium theme system with gradient color palette, elevated shadow system, enhanced typography, glass morphism utilities, and modern component overrides. Includes a complete animation system with CSS keyframes, GPU-optimized performance, reusable skeleton components, and empty state components. Branding features custom BesaHub logo and a login screen as the default entry point.
- **Navigation Simplification**: Streamlined navigation with single-click access to all core features, removing unnecessary dropdowns and submenus for a cleaner user experience. Current single-click navigation: Properties, Contacts, Pipeline, Deals, Agents, Campaigns. Remaining dropdowns: Companies, Tasks, Reports.
- **Dashboard Simplification**: Removed greeting header (date, user greeting, role badge) for a cleaner, more focused dashboard experience that prioritizes data and KPIs.

### Technical Implementations
- **Frontend**: React 18, React Query, React Context for authentication, React Router v6, Chart.js/Recharts, React Leaflet, React Hook Form, React Dropzone.
- **Backend**: Express.js with Node.js, PostgreSQL with Sequelize ORM, JWT for authentication, Socket.IO for real-time communication, Multer for file uploads, RESTful API design.
- **Data Layer**: Sequelize ORM with PostgreSQL, supporting complex relationships. Express-validator for input validation, and Sequelize migrations.
- **Security**: Comprehensive enterprise-grade security including password complexity, Redis-backed account lockout, refresh token rotation, TOTP MFA, Helmet HSTS, HTTPS enforcement, global Joi validation, XSS sanitization, strict CORS whitelist, IP-based rate limiting, RBAC with granular permissions, append-only audit logs with SHA-256 hash chain verification, sensitive data masking, PII encryption at rest, structured JSON logging, admin security dashboard, 90-day log retention, GDPR compliance, and OWASP Top 10 security tests.
- **Enterprise Infrastructure**: Production-ready infrastructure with Doppler SDK for secrets management, zero-downtime dual-key PII key rotation, daily AES-256-GCM encrypted backups, SOC 2 / ISO 27001 compliance documentation, Cloudflare Turnstile CAPTCHA for DDoS mitigation, and GitHub Actions for SAST/DAST in CI/CD.
- **Performance & Scalability**: Database indexing, Redis caching, Gzip/Brotli response compression, query performance monitoring, and background job processing.
- **Lease & Debt Intelligence Layer**: Data models for Lease and Debt, automated trigger detection for expirations/maturities, and integration with the notification system.
- **CRE Workflow Optimization**: Bulk pipeline operations for multi-select deal management, automated Lease/Debt alerts with multi-interval warnings and notification creation, and Pipeline UI enhancements.
- **Database Resilience & Fallback System**: Implemented comprehensive database fallback mechanisms for production-ready resilience, including a `DatabaseWrapper` utility with timeout protection and automatic fallback to demo data when the database is unavailable.

### Feature Specifications (9+ Core Features)
- **1. Dashboard**: Real-time CRM metrics with KPIs, pipeline visualization, upcoming tasks, and quick access to all core features.
- **2. Properties Management**: Comprehensive commercial real estate property management system with 50+ organized fields across 6 categories (Basic Info, Financials, Property Details, Contacts, Marketing Info, Transaction Info). Features include full property CRUD, advanced search/filtering/sorting, card/list views, property details page, image gallery support, document uploads (offering memorandum, brochures, floor plans, site plans), and business-focused data capture (MLS#, lot dimensions, clear height, loading docks, parking ratios, renovation year, owner/agent information, transaction details). Clean, organized UI using tabs and sections for optimal data entry and viewing experience.
- **3. Contacts Management**: Contact management with create/edit, company associations, search, filters, and slim horizontal card layout.
- **4. Companies Management**: Full-featured companies page with card grid layout, industry badges, portfolio values, lead status chips, search/filter/sort capabilities, and company logo uploads.
- **5. Deals Pipeline**: Visual Kanban-style pipeline with drag-and-drop, deal stages, bulk operations, deal CRUD, and real-time updates.
- **6. Tasks Management**: Task system with table view, status/priority indicators, overdue alerts, filters, search, quick actions, and dashboard integration.
- **7. Agents/Team Management**: Comprehensive team collaboration module with agent list page (card grid layout), agent detail pages with 6 tabs (Overview, Properties, Contacts, Deals, Tasks, Performance), performance KPIs (active properties, deals, contacts, win rate), assignment tracking, and role-based access control. Features include agent cards with avatars, metrics, filtering by role/department/status, search by name/email, and performance charts for tracking team productivity.
- **8. Marketing/Campaigns**: Full-featured email marketing campaign system with campaign creation wizard (multi-tab form: Basic Info, Email Content, Recipients, Settings), campaign list page (card grid with status tracking), campaign analytics dashboard (open rates, click rates, engagement charts), recipient management (all contacts, filtered, custom lists, specific selection), scheduling and automation, template builder for email content, and performance tracking. Campaign types include newsletters, property promotions, investor updates, and event announcements. Note: SendGrid integration infrastructure ready but not yet configured.
- **9. Basic Authentication**: Secure login/logout with JWT tokens, refresh tokens, demo user support, and instant authentication.

### Supporting Infrastructure
- **Real-time Features**: Live notifications via Socket.IO for deal updates, task reminders, and property changes.
- **Notifications System**: Real-time notification center with various notification types, read/unread status, archive functionality, and deep linking.
- **RBAC System**: Complete Role-Based Access Control with granular permissions and default roles.
- **Bulk Import System**: CSV import functionality for properties and contacts with validation and error handling.
- **Data Backup & Export**: Automated daily database backups, manual backup triggers, and CSV export for major entities.
- **Comprehensive Demo Data System**: Enhanced `server/scripts/seedAll.js` with production-ready comprehensive demo data for manual testing across all CRM features.

## External Dependencies

### Third-party APIs
- **ATTOM Data API**: Property details, sales history, valuations.
- **Estated API**: Comprehensive property data and market analytics.
- **Twilio**: SMS and voice communication.
- **Stripe**: Payment processing.
- **DocuSign**: Electronic signatures.
- **SendGrid**: Email marketing and notifications (infrastructure ready, not yet configured - deferred per user request).
- **Cloudinary**: Image storage and optimization.

### Databases
- **PostgreSQL**: Primary relational database.
- **Redis**: Caching layer.

### Infrastructure & Libraries
- **Node.js**: Runtime environment.
- **NPM**: Package management.
- **Material-UI**: Frontend component library.
- **Axios**: HTTP client.
- **Chart.js/Recharts**: Data visualization.
- **React Query**: Server state management.
- **React Router**: Client-side routing.
- **React Hook Form**: Form handling.
- **DOMPurify**: XSS protection.
- **Winston**: Logging system.
- **Helmet**: Security middleware.
- **Express Rate Limit**: API rate limiting.
- **Express Validator**: Input validation.
- **Multer**: File upload handling.
- **Node Cron**: Scheduled tasks.
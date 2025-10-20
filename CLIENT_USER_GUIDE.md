# BesaHubs CRM - User Guide

## Welcome to BesaHubs!

BesaHubs is your all-in-one Commercial Real Estate management platform. This guide will help you get started and make the most of the system.

---

## Getting Started

### Demo Login Credentials

**Email:** `admin@demo.com`  
**Password:** `Admin@Demo123`

> **Note:** These demo credentials provide full access to explore all features. In your production environment, you'll have your own secure login.

### Demo Data Overview

This demo environment comes pre-loaded with sample data for testing:

- **15+ Properties** across different types (office, retail, industrial, mixed-use)
- **20+ Contacts** with various lead temperatures and engagement levels
- **10+ Active Deals** in different pipeline stages
- **Sample Entities** for testing ownership graph features
- **Pre-configured Cohorts** demonstrating segmentation capabilities

**Important:** This is sample data for testing purposes. Your production environment will start fresh, and you can import your own data.

### First Time Login

1. Open BesaHubs in your web browser
2. Enter your email and password
3. Click "Sign In"
4. You'll be taken to the Dashboard

---

## Main Features

### 1. Dashboard

Your central hub showing:
- **Key Performance Metrics** - Property counts, deal values, active leads
- **Recent Activity** - Latest updates across your portfolio
- **Quick Actions** - Fast access to common tasks
- **Upcoming Tasks** - Stay on top of deadlines

**Tip:** The dashboard auto-refreshes to show real-time data.

### 2. Properties

Manage your entire commercial real estate portfolio:

- **Add Properties** - Click the "+" button to add new listings
- **View Details** - Click any property card to see full information
- **Track Status** - Available, Under Contract, Sold, Leased, Off Market
- **Upload Images** - Add property photos and documents
- **Leases & Debt** - Track lease agreements and financing details

**Key Actions:**
- Filter by property type (Office, Retail, Industrial, etc.)
- Sort by price, date, status
- Export property list to CSV

### 3. Contacts & Companies

Build and manage your professional network:

- **Contact Management** - Store client and prospect information
- **Lead Temperature** - Track engagement levels (Hot, Warm, Cold)
- **Company Profiles** - Link contacts to organizations
- **Communication History** - Log calls, emails, and meetings
- **CSV Import** - Bulk upload contacts from spreadsheets

**Best Practice:** Update lead temperature after each interaction to prioritize follow-ups.

### 4. Pipeline (Deal Management)

Visual kanban board for tracking deals:

- **Drag & Drop** - Move deals between stages
- **Bulk Operations** - Select multiple deals to update stages or archive
- **Stage Headers** - Use checkboxes to select all deals in a stage
- **Deal Values** - Track total value per stage
- **Automated Alerts** - Get notified when deals need attention

**Pipeline Stages:**
1. Lead
2. Qualified
3. Meeting Scheduled
4. Proposal Sent
5. Negotiation
6. Closed Won / Closed Lost

### 5. Ownership Graph

Visualize complex property ownership structures:

- **Entity Management** - Track individuals, LLCs, trusts, REITs
- **Ownership Chains** - See multi-level ownership relationships
- **Property Links** - View all properties owned by an entity

**Use Case:** Perfect for understanding ownership structures in syndications and complex investments.

### 6. Cohorts & Campaigns

Targeted email marketing for your CRE network:

- **Create Cohorts** - Segment contacts by criteria (location, property type, investment size)
- **Campaign Builder** - Step-by-step wizard for email campaigns
- **Templates** - Pre-built email templates with variable insertion
- **Analytics** - Track open rates, clicks, and engagement

**Example Workflow:**
1. Create a cohort: "Industrial Investors in California"
2. Choose a template: "New Industrial Listing Alert"
3. Schedule campaign for optimal send time
4. Monitor results on the analytics dashboard

### 7. Market Analytics

Data-driven insights for better decisions:

- **Market Trends** - Track pricing and demand over time
- **Comparable Properties** - Find similar listings
- **Submarket Analysis** - Drill down by neighborhood
- **Custom Reports** - Generate reports for clients

---

## Common Tasks

### Add a New Property

1. Navigate to **Properties**
2. Click the **"+ New Property"** button (top right)
3. Fill in required fields:
   - Property Name
   - Address & Location
   - Property Type
   - Listing Type (Sale / Lease / Both)
   - Price or Lease Rate
4. Add optional details (square footage, year built, amenities)
5. Click **"Create Property"**

### Create a Deal

1. Go to **Pipeline**
2. Click **"+ New Deal"** button
3. Select the associated property
4. Choose the contact/buyer
5. Enter deal value
6. Click **"Create"** - Deal appears in "Lead" stage

### Import Contacts from CSV

1. Navigate to **Contacts**
2. Click **"Import"** button
3. Download the CSV template (if needed)
4. Upload your CSV file
5. Map columns to BesaHubs fields
6. Review validation results
7. Confirm import

**CSV Safety:** BesaHubs automatically prevents formula injection attacks in CSV files.

### Set Up Automated Lease Alerts

Lease expiration alerts run automatically every day at 9 AM:

- **90 days before expiration** - Early warning
- **60 days before expiration** - Start renewal discussions
- **30 days before expiration** - Urgent action needed
- **7 days before expiration** - Critical alert

**No setup required!** Just add lease details to properties, and you'll receive notifications automatically.

### Bulk Update Deals

1. Go to **Pipeline**
2. Check the boxes on deals you want to update
3. Use the **bulk actions toolbar** at the top
4. Select action: Change Stage or Archive
5. Confirm the operation

**Tip:** Use stage header checkboxes to select all deals in a stage at once.

---

## Tips & Best Practices

### Data Security

- Change demo password immediately in production
- Enable Two-Factor Authentication (MFA) for admin accounts
- Regularly review user permissions
- Audit logs track all system changes

### Performance Optimization

- Use filters and search to narrow large data sets
- Export reports instead of keeping large views open
- Clear browser cache if pages load slowly
- Use Chrome or Firefox for best performance

### Team Collaboration

- Assign properties to specific agents
- Use activity logs to track team actions
- Set up email notifications for important events
- Use the calendar to schedule team tasks

---

## Troubleshooting

### Can't Log In

- **Check Credentials:** Ensure email and password are correct (case-sensitive)
- **Demo Mode:** Remember to use `admin@demo.com` / `Admin@Demo123` for demo
- **Account Locked:** After 5 failed attempts, accounts lock for 30 minutes
- **Contact Support:** If issues persist, contact your system administrator

### Property Won't Save

- **Required Fields:** Name, Address, City, State, Zip, Property Type, and Listing Type are required
- **State Format:** Must be 2-letter state code (e.g., "CA" not "California")
- **Zip Code Format:** Must be 5 digits (e.g., "90210")
- **Check Console:** Press F12 to see detailed error messages

### Missing Data or Empty Pages

- **Refresh the Page:** Press Ctrl+R (Windows) or Cmd+R (Mac)
- **Check Filters:** You may have active filters hiding data
- **Clear Cache:** Clear browser cache and reload
- **Check Permissions:** You may not have access to view certain data

### Images Not Uploading

- **File Size:** Maximum 50MB per file
- **Supported Formats:** JPG, PNG, GIF, PDF
- **Connection:** Ensure stable internet connection
- **Retry:** Try uploading one image at a time

### Pipeline Not Updating

- **Refresh Required:** Click the refresh button after bulk operations
- **Browser Issues:** Try hard refresh (Ctrl+Shift+R)
- **Archived Deals:** Archived deals don't appear in pipeline view
- **Check Filters:** Ensure "Active" filter is selected

---

## Security & Compliance

BesaHubs is built with enterprise-grade security:

### Data Protection

- **Encryption:** All sensitive data (emails, phone numbers, tax IDs) encrypted at rest
- **Secure Transport:** HTTPS/TLS encryption for all data in transit
- **Password Requirements:** Minimum 12 characters with complexity rules
- **MFA:** Two-factor authentication for admin and manager roles

### Compliance

- **GDPR Compliant:** Data export and account deletion requests supported
- **SOC 2 Controls:** Security, availability, and confidentiality controls implemented
- **Audit Logs:** Complete activity tracking with tamper detection
- **Data Retention:** Configurable retention policies for audit logs

### Backup & Recovery

- **Daily Backups:** Automatic encrypted backups at 3 AM daily
- **Retention:** 30 daily + 12 monthly + unlimited yearly backups
- **Weekly Testing:** Automated restore tests every Sunday
- **Emergency Recovery:** Contact support for immediate restore needs

---

## Getting Help

### System Status

- Both workflows (Backend and Frontend) should show "RUNNING" status
- If you see errors, try refreshing your browser
- Check the notifications bell (top right) for system alerts

### Contact Support

**For MVP Testing Support:**

If you encounter any issues during testing, please document:
- **What you were trying to do**
- **Error message or screenshot**  
- **Your user email and role**
- **Date and time of the issue**
- **Steps to reproduce the problem**

Contact your BesaHubs implementation team directly for immediate assistance during the testing period.

**Post-Launch Support:**

After go-live, your organization's system administrator will be your primary point of contact. Admin users can access detailed audit logs and system health dashboards under the Admin menu.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search | Ctrl + K |
| New Property | Alt + P |
| New Contact | Alt + C |
| New Deal | Alt + D |
| Dashboard | Ctrl + Home |
| Refresh Page | Ctrl + R |
| Open Notifications | Alt + N |

---

## Next Steps

1. **Explore the Dashboard** - Get familiar with the layout
2. **Add Test Data** - Create a few properties and contacts
3. **Try the Pipeline** - Move deals through stages
4. **Review Analytics** - Check out market insights
5. **Invite Your Team** - Add users and set permissions

**Welcome to BesaHubs!** We're here to streamline your commercial real estate operations.

---

*For technical documentation and API details, see the system documentation in `replit.md`.*

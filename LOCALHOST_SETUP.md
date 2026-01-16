# Localhost Setup Guide

## Quick Start for Local Development

After pulling from GitHub, follow these steps to get the app running locally:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies  
cd client && npm install && cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory with these **REQUIRED** variables:

```env
# Development Environment Variables
NODE_ENV=development

# IMPORTANT: Must be set to 'true' for demo login to work
DEMO_MODE=true

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/cre_crm

# JWT Secret (minimum 32 characters)
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars-long

# Server Configuration
PORT=3001

# Client Configuration
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

**⚠️ Important**: Without `DEMO_MODE=true`, you won't be able to use demo credentials!

### 3. Demo Login Credentials

When `DEMO_MODE=true` is set, you can login with:

- **Email**: `admin@demo.com`
- **Password**: `Admin@Demo123`

### 4. Start the Development Server

```bash
npm run dev
```

This will automatically:
- Set `DEMO_MODE=true` for you
- Start both the server (port 3001) and client (port 3000)
- Enable demo login functionality

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

---

## Troubleshooting

### "Demo mode is not enabled" Error

If you see this error when trying to login:

1. **Check your `.env` file** - Make sure `DEMO_MODE=true` is set
2. **Restart the server** - Environment variables are loaded at startup
3. **Use `npm run dev`** - This script automatically sets `DEMO_MODE=true`

### Database Connection Issues

If the database isn't configured:
- Demo login will still work (it doesn't require a database)
- For full functionality, set up PostgreSQL and configure `DATABASE_URL`

### Missing Dependencies

If you get module errors:
```bash
# Install all dependencies
npm install
cd client && npm install && cd ..
```

---

## Notes

- Demo mode is **automatically disabled** in production (`NODE_ENV=production`)
- The `npm run dev` command automatically sets `DEMO_MODE=true` for convenience
- For production deployments, ensure `DEMO_MODE=false` or remove it entirely

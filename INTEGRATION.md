# Siloq Platform Integration Guide

This guide explains how to set up and integrate the three main components of the Siloq platform:
- **siloq-app**: Backend API server (Node.js/Express)
- **siloq-dashboard**: Frontend dashboard (Next.js)
- **siloq-wordpress**: WordPress plugin

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│ siloq-dashboard │ ──────> │   siloq-app     │ ──────> │ siloq-wordpress │
│   (Frontend)    │  HTTP   │   (Backend API) │  REST   │   (WordPress)   │
│   Port: 3000    │         │   Port: 3001    │         │   Port: 80/443  │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database with pgvector extension
- WordPress installation(s) to manage
- npm, yarn, or pnpm package manager

## Step 1: Setup siloq-app (Backend API)

### 1.1 Clone and Install

```bash
git clone <siloq-app-repo-url>
cd siloq-app
npm install
```

### 1.2 Configure Environment

Create `.env` file in siloq-app:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/siloq_db
PGVECTOR_ENABLED=true

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# WordPress Integration
WP_API_TIMEOUT=30000
WP_API_RETRY_ATTEMPTS=3

# OpenAI/Anthropic API (for content generation)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### 1.3 Start Backend Server

```bash
npm run dev
# or
npm start
```

The API should be running at `http://localhost:3001`

### 1.4 Verify API Health

```bash
curl http://localhost:3001/api/v1/health
```

## Step 2: Setup siloq-dashboard (Frontend)

### 2.1 Configure Environment

The dashboard is already configured. Update `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Optional: App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Start Dashboard

```bash
cd siloq-dashboard
npm install
npm run dev
```

The dashboard should be running at `http://localhost:3000`

## Step 3: Setup siloq-wordpress (WordPress Plugin)

### 3.1 Install Plugin

1. Copy the `siloq-wordpress` plugin to your WordPress `wp-content/plugins/` directory
2. Or install via WordPress admin: Plugins > Add New > Upload Plugin

### 3.2 Configure Plugin

In WordPress admin, go to **Siloq Settings** and configure:

- **API Endpoint**: `http://localhost:3001/api/v1` (or your production API URL)
- **API Key**: Generated from siloq-app dashboard
- **Site ID**: Auto-generated when site is registered
- **Sync Interval**: How often to sync data (default: hourly)

### 3.3 Register Site in Dashboard

1. Open siloq-dashboard at `http://localhost:3000`
2. Go to **Sites** > **Add Site**
3. Enter your WordPress site URL (e.g., `https://example.com`)
4. The dashboard will connect to siloq-app, which will:
   - Validate the WordPress site
   - Install/activate the siloq-wordpress plugin if needed
   - Generate API credentials
   - Register the site in the database

## Step 4: Authentication Setup

### 4.1 User Registration/Login

The siloq-app should provide authentication endpoints:

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh JWT token

### 4.2 Dashboard Authentication Flow

1. User logs in through siloq-dashboard
2. Dashboard receives JWT token from siloq-app
3. Token is stored in `localStorage` as `auth_token`
4. All API requests include token in `Authorization: Bearer <token>` header

### 4.3 Add Login Page (if not exists)

Create `app/auth/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('auth_token', data.token)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Login form UI */}
    </form>
  )
}
```

## Step 5: API Endpoints Required

Ensure siloq-app implements these endpoints that siloq-dashboard expects:

### Sites
- `GET /api/v1/sites` - List all sites
- `GET /api/v1/sites/:id` - Get site details
- `POST /api/v1/sites` - Register new site
- `PUT /api/v1/sites/:id` - Update site
- `DELETE /api/v1/sites/:id` - Remove site

### Pages
- `GET /api/v1/sites/:id/pages` - List pages for a site
- `GET /api/v1/pages/:id` - Get page details
- `POST /api/v1/pages/:id/validate` - Validate page compliance

### Content Jobs
- `GET /api/v1/content-jobs` - List content jobs
- `GET /api/v1/content-jobs/:id` - Get job details
- `POST /api/v1/content-jobs` - Create new job

### Reverse Silos
- `GET /api/v1/reverse-silos` - List silos
- `POST /api/v1/reverse-silos` - Create silo
- `POST /api/v1/reverse-silos/:id/finalize` - Finalize silo

### Events & Billing
- `GET /api/v1/events` - System events
- `GET /api/v1/billing/usage` - Usage statistics

## Step 6: WordPress Plugin API Endpoints

The siloq-wordpress plugin should expose these REST endpoints:

### WordPress REST API Extensions
- `GET /wp-json/siloq/v1/status` - Plugin status
- `GET /wp-json/siloq/v1/pages` - List all pages
- `GET /wp-json/siloq/v1/pages/:id` - Get page details
- `POST /wp-json/siloq/v1/sync` - Trigger manual sync
- `POST /wp-json/siloq/v1/content` - Create/update content

### Authentication
The plugin should validate requests using:
- API key in `X-Siloq-API-Key` header
- Or JWT token in `Authorization` header

## Step 7: Data Flow

### Site Registration Flow

1. **User adds site in dashboard**
   ```
   Dashboard → POST /api/v1/sites { url: "https://example.com" }
   ```

2. **Backend validates and registers**
   ```
   siloq-app → Validates WordPress site
   siloq-app → Checks for siloq-wordpress plugin
   siloq-app → Generates API credentials
   siloq-app → Stores site in database
   ```

3. **WordPress plugin receives credentials**
   ```
   siloq-app → POST https://example.com/wp-json/siloq/v1/register
   WordPress → Stores credentials securely
   ```

### Content Sync Flow

1. **WordPress plugin syncs data**
   ```
   WordPress → POST /api/v1/sites/:id/sync
   siloq-app → Processes and stores data
   ```

2. **Dashboard displays data**
   ```
   Dashboard → GET /api/v1/sites/:id/pages
   siloq-app → Returns synced page data
   ```

### Content Generation Flow

1. **User creates content job**
   ```
   Dashboard → POST /api/v1/content-jobs
   siloq-app → Validates request
   siloq-app → Queues job
   ```

2. **Backend processes job**
   ```
   siloq-app → Generates content via AI
   siloq-app → Validates content
   siloq-app → Updates job status
   ```

3. **Content published to WordPress**
   ```
   siloq-app → POST https://example.com/wp-json/siloq/v1/content
   WordPress → Creates/updates page
   ```

## Step 8: Production Deployment

### 8.1 Environment Variables

Update all `.env` files with production values:

**siloq-app/.env**
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/siloq_db
CORS_ORIGIN=https://dashboard.siloq.com
```

**siloq-dashboard/.env.local**
```env
NEXT_PUBLIC_API_URL=https://api.siloq.com/api/v1
NEXT_PUBLIC_APP_URL=https://dashboard.siloq.com
```

### 8.2 Build Commands

**siloq-app:**
```bash
npm run build
npm start
```

**siloq-dashboard:**
```bash
npm run build
npm start
```

### 8.3 WordPress Plugin

- Upload plugin to production WordPress sites
- Configure with production API URL
- Ensure HTTPS is enabled for secure communication

## Step 9: Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` in siloq-app matches dashboard URL
   - Check browser console for specific CORS errors

2. **Authentication Failures**
   - Verify JWT_SECRET matches between services
   - Check token expiration settings
   - Ensure token is stored correctly in localStorage

3. **WordPress Connection Issues**
   - Verify WordPress REST API is enabled
   - Check plugin is activated
   - Verify API credentials are correct
   - Check WordPress site is accessible from siloq-app server

4. **API Connection Issues**
   - Verify siloq-app is running on correct port
   - Check `NEXT_PUBLIC_API_URL` in dashboard matches backend
   - Test API health endpoint: `curl http://localhost:3001/api/v1/health`

### Debug Mode

Enable debug logging in siloq-app:
```env
DEBUG=true
LOG_LEVEL=debug
```

## Step 10: Development Workflow

### Local Development Setup

1. **Terminal 1 - Backend**
   ```bash
   cd siloq-app
   npm run dev
   ```

2. **Terminal 2 - Frontend**
   ```bash
   cd siloq-dashboard
   npm run dev
   ```

3. **Terminal 3 - Database** (if using local PostgreSQL)
   ```bash
   # Ensure PostgreSQL is running
   psql -U postgres -d siloq_db
   ```

### Testing Integration

1. Start all services
2. Register a test WordPress site
3. Verify data syncs correctly
4. Test content job creation
5. Verify content appears in WordPress

## Additional Resources

- [siloq-app API Documentation](./docs/api.md) (if exists)
- [siloq-wordpress Plugin Documentation](./docs/wordpress-plugin.md) (if exists)
- [Database Schema](./docs/database-schema.md) (if exists)

## Support

For issues or questions:
- Check each repository's README
- Review API endpoint documentation
- Check service logs for errors

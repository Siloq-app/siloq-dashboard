# Quick Start Guide - Siloq Platform Integration

This is a quick reference for setting up the three Siloq components together.

## Quick Setup (5 minutes)

### 1. Start siloq-app (Backend)

```bash
cd siloq-app
npm install
cp .env.example .env
# Edit .env with your database and API keys
npm run dev
```

**Verify:** `curl http://localhost:3001/api/v1/health`

### 2. Start siloq-dashboard (Frontend)

```bash
cd siloq-dashboard
npm install
cp .env.example .env.local
# .env.local should have: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm run dev
```

**Verify:** Open `http://localhost:3000`

### 3. Install siloq-wordpress Plugin

1. Copy plugin to WordPress `wp-content/plugins/siloq-wordpress/`
2. Activate plugin in WordPress admin
3. Go to **Siloq Settings** and enter API URL: `http://localhost:3001/api/v1`

### 4. Connect WordPress Site

1. Open dashboard at `http://localhost:3000`
2. Go to **Sites** → **Add Site**
3. Enter your WordPress site URL
4. Click **Test Connection** then **Add Site**

## Environment Variables Summary

### siloq-app/.env
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/siloq_db
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

### siloq-dashboard/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### siloq-wordpress (WordPress Admin)
- API Endpoint: `http://localhost:3001/api/v1`
- API Key: (auto-generated when site is registered)

## Ports Used

- **siloq-dashboard**: `3000` (Next.js)
- **siloq-app**: `3001` (Express API)
- **WordPress**: `80` or `443` (your WordPress sites)

## Common Issues

**CORS Error?**
- Check `CORS_ORIGIN` in siloq-app matches dashboard URL

**Can't connect to WordPress?**
- Verify WordPress REST API is enabled
- Check plugin is activated
- Ensure site URL is accessible from siloq-app server

**Authentication fails?**
- Verify JWT_SECRET is set in siloq-app
- Check token in browser localStorage

## Next Steps

See [INTEGRATION.md](./INTEGRATION.md) for detailed setup and troubleshooting.

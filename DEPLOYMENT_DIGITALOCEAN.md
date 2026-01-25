# DigitalOcean Deployment Guide - Siloq Dashboard

This guide covers deploying siloq-dashboard to DigitalOcean using App Platform (recommended) or Droplets.

## Option 1: DigitalOcean App Platform (Recommended)

App Platform is the easiest way to deploy Next.js applications on DigitalOcean.

### Prerequisites

- DigitalOcean account
- GitHub repository with siloq-dashboard code
- siloq-app backend API deployed and accessible

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub
2. Verify `.env.example` is in the repository
3. Make sure `package.json` has build scripts:
   ```json
   {
     "scripts": {
       "build": "next build",
       "start": "next start"
     }
   }
   ```

### Step 2: Create App on DigitalOcean

1. Log in to [DigitalOcean Control Panel](https://cloud.digitalocean.com)
2. Click **Create** → **Apps**
3. Click **GitHub** to connect your repository
4. Authorize DigitalOcean to access your GitHub account
5. Select the `siloq-dashboard` repository
6. Choose the branch (usually `main` or `master`)

### Step 3: Configure App Settings

#### Basic Settings

- **Name**: `siloq-dashboard` (or your preferred name)
- **Region**: Choose closest to your users
- **Type**: Web Service

#### Build Settings

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Source Directory**: `/` (root)

#### Environment Variables

Add these environment variables in the App Platform interface:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-siloq-app-url.com/api/v1
NEXT_PUBLIC_APP_URL=https://your-dashboard-url.com
```

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never put secrets in `NEXT_PUBLIC_*` variables
- Use App Platform's encrypted environment variables for sensitive data

#### Resource Plan

- **Basic Plan**: $5/month (512MB RAM, 1 vCPU) - Good for development
- **Professional Plan**: $12/month (1GB RAM, 1 vCPU) - Recommended for production
- **Professional Plan**: $24/month (2GB RAM, 2 vCPU) - For high traffic

### Step 4: Deploy

1. Review all settings
2. Click **Create Resources**
3. DigitalOcean will:
   - Clone your repository
   - Install dependencies
   - Build the Next.js app
   - Deploy to production

### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `dashboard.siloq.com`)
4. Add the CNAME record provided by DigitalOcean to your DNS:
   ```
   Type: CNAME
   Name: dashboard (or @)
   Value: [provided-by-digitalocean]
   ```

### Step 6: Verify Deployment

1. Check the **Runtime Logs** for any errors
2. Visit your app URL (provided by DigitalOcean)
3. Test the dashboard functionality
4. Verify API connection to siloq-app

## Option 2: DigitalOcean Droplet (Manual Deployment)

For more control, deploy to a Droplet (VPS).

### Step 1: Create Droplet

1. Go to **Create** → **Droplets**
2. Choose configuration:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: 
     - Basic: $6/month (1GB RAM) - Development
     - Basic: $12/month (2GB RAM) - Production (recommended)
     - Basic: $24/month (4GB RAM) - High traffic
   - **Region**: Choose closest to users
   - **Authentication**: SSH keys (recommended) or password
3. Click **Create Droplet**

### Step 2: Initial Server Setup

SSH into your droplet:

```bash
ssh root@your-droplet-ip
```

Update system:

```bash
apt update && apt upgrade -y
```

Install Node.js 18+:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version  # Should show v18.x or higher
```

Install PM2 (Process Manager):

```bash
npm install -g pm2
```

Install Nginx (Reverse Proxy):

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Step 3: Clone and Setup Application

```bash
# Create app directory
mkdir -p /var/www/siloq-dashboard
cd /var/www/siloq-dashboard

# Clone repository (or use git pull if already exists)
git clone https://github.com/your-org/siloq-dashboard.git .

# Install dependencies
npm install --production

# Create .env file
nano .env.local
```

Add environment variables to `.env.local`:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-siloq-app-url.com/api/v1
NEXT_PUBLIC_APP_URL=https://your-dashboard-url.com
```

Build the application:

```bash
npm run build
```

### Step 4: Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add:

```javascript
module.exports = {
  apps: [{
    name: 'siloq-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/siloq-dashboard',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/siloq-dashboard/error.log',
    out_file: '/var/log/siloq-dashboard/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
```

Create log directory:

```bash
mkdir -p /var/log/siloq-dashboard
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on reboot
```

### Step 5: Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/siloq-dashboard
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts for Next.js
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/siloq-dashboard /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl reload nginx
```

### Step 6: Setup SSL with Let's Encrypt

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Get SSL certificate:

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow prompts and Certbot will:
- Obtain SSL certificate
- Configure Nginx automatically
- Set up auto-renewal

### Step 7: Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 8: Verify Deployment

1. Visit `http://your-domain.com` (should redirect to HTTPS)
2. Check PM2 status: `pm2 status`
3. View logs: `pm2 logs siloq-dashboard`
4. Check Nginx: `systemctl status nginx`

## Option 3: Docker Deployment (Advanced)

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Update next.config.js

Enable standalone output:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable for Docker
}

module.exports = nextConfig
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  siloq-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
```

### Deploy to Droplet with Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Clone repository
git clone https://github.com/your-org/siloq-dashboard.git
cd siloq-dashboard

# Create .env file
nano .env

# Build and run
docker-compose up -d --build
```

## Environment Variables Reference

### Required Variables

```env
NEXT_PUBLIC_API_URL=https://api.siloq.com/api/v1
```

### Optional Variables

```env
NEXT_PUBLIC_APP_URL=https://dashboard.siloq.com
NODE_ENV=production
PORT=3000
```

### Never Expose These

- Database credentials
- API keys
- JWT secrets
- Private tokens

These should be handled server-side in siloq-app.

## Monitoring and Maintenance

### View Logs (App Platform)

1. Go to your app in DigitalOcean
2. Click **Runtime Logs** tab
3. Filter by log level if needed

### View Logs (Droplet)

```bash
# PM2 logs
pm2 logs siloq-dashboard

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Update Application

**App Platform:**
- Push to GitHub
- App Platform auto-deploys (if enabled)
- Or manually trigger deployment

**Droplet:**
```bash
cd /var/www/siloq-dashboard
git pull origin main
npm install --production
npm run build
pm2 restart siloq-dashboard
```

### Health Checks

App Platform automatically monitors your app. For Droplet, add health check endpoint:

Create `app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}
```

## Cost Estimation

### App Platform
- **Basic**: $5/month (development)
- **Professional**: $12-24/month (production)
- **Bandwidth**: Included (generous limits)

### Droplet
- **Basic**: $6/month (1GB RAM)
- **Basic**: $12/month (2GB RAM) - Recommended
- **Bandwidth**: 1-3TB included

### Additional Costs
- Domain: ~$10-15/year
- SSL: Free (Let's Encrypt)
- Database: If using DigitalOcean Managed Database ($15+/month)

## Troubleshooting

### Build Failures

**Issue**: Build fails during deployment
**Solution**: 
- Check build logs in App Platform
- Verify `package.json` has correct build script
- Ensure all dependencies are in `package.json`, not `devDependencies`

### Environment Variables Not Working

**Issue**: `NEXT_PUBLIC_*` variables not available
**Solution**:
- Variables must be set before build time
- Rebuild after changing environment variables
- Restart application after changes

### API Connection Issues

**Issue**: Dashboard can't connect to siloq-app
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in siloq-app
- Verify siloq-app is accessible from internet
- Check firewall rules

### High Memory Usage

**Issue**: App crashes or slow performance
**Solution**:
- Upgrade to higher tier plan
- Enable Next.js image optimization
- Review and optimize components
- Consider caching strategies

## Security Best Practices

1. **Use HTTPS**: Always enable SSL/TLS
2. **Environment Variables**: Never commit `.env` files
3. **Secrets**: Store sensitive data in DigitalOcean's encrypted environment variables
4. **Firewall**: Restrict access to necessary ports only
5. **Updates**: Keep Node.js and dependencies updated
6. **Monitoring**: Set up alerts for errors and downtime

## Next Steps

1. Deploy siloq-app backend first
2. Deploy siloq-dashboard
3. Configure domain and SSL
4. Set up monitoring and alerts
5. Configure CI/CD for automatic deployments

## Support

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)

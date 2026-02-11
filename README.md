# Siloq Dashboard

Next.js frontend for Siloq — a WordPress SEO dashboard platform. Built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## Quick Start

```bash
# Install dependencies
npm install

# Environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Features

- **Authentication** — Email/password login, Google OAuth integration
- **Dashboard** — Multi-site management with analytics overview
- **SEO Tools** — Cannibalization detection, silo visualization, link opportunities
- **API Keys** — Generate and manage keys for WordPress plugin integration
- **Settings** — User profile, billing, and site configuration

## Project Structure

```
app/
├── auth/
│   ├── login/           # Login page
│   ├── register/        # Registration with Google OAuth
│   └── callback/        # OAuth callback handler
├── dashboard/
│   ├── page.tsx         # Main dashboard
│   ├── sites/
│   │   └── page.tsx     # Site management
│   ├── cannibalization/
│   │   └── page.tsx     # SEO cannibalization analysis
│   ├── silos/
│   │   └── page.tsx     # Silo structure visualization
│   └── settings/
│       └── page.tsx     # User & site settings
└── layout.tsx           # Root layout with auth provider

components/
├── ui/                  # shadcn/ui components
├── app-sidebar.tsx      # Navigation sidebar
├── site-header.tsx      # Top navigation bar
├── nav-main.tsx         # Main navigation items
└── team-switcher.tsx    # Site/team selector

lib/
├── utils.ts             # Utility functions
└── auth.ts              # Authentication helpers
```

## Stack

- **Framework** — Next.js 15, React 18
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **UI Components** — shadcn/ui, Radix UI
- **State** — React hooks, Context
- **Charts** — Recharts
- **Drag & Drop** — @dnd-kit
- **Validation** — Zod
- **Linting** — ESLint, Prettier

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Proprietary — All rights reserved.

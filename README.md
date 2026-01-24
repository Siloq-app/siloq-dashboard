# Siloq Dashboard

A governance-first SEO platform interface that enforces structural doctrine, manages AI-assisted content generation, and provides multi-site WordPress management.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State:** React Query (TanStack Query)
- **Backend:** Node.js/Express API (already built)
- **Database:** PostgreSQL with pgvector
- **Auth:** JWT-based authentication

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (default: `http://localhost:3001`)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── sites/        # Site management
│   │   ├── content-jobs/ # Content job tracking
│   │   ├── billing/      # Billing & usage
│   │   ├── events/       # System events
│   │   ├── settings/     # Settings
│   │   └── ...
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (redirects to dashboard)
│   ├── providers.tsx     # React Query provider
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── dashboard/        # Dashboard-specific components
│       ├── compliance-badge.tsx
│       ├── content-job-status-badge.tsx
│       ├── site-status-badge.tsx
│       ├── sidebar.tsx
│       └── index.ts      # Component exports
├── lib/                   # Utilities and configurations
│   ├── api-client.ts     # Axios API client
│   ├── chart-utils.ts    # Chart data preparation utilities
│   ├── queries.ts        # React Query hooks
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions (date, formatting, etc.)
└── public/               # Static assets
```

## Core Features

### Phase 1 (MVP) - ✅ Complete

1. **Dashboard Home** - Overview of all connected sites and system health
2. **Sites Management** - Connect and manage WordPress sites
3. **Reverse Silo Planner** - Plan and visualize silo architecture
4. **Content Jobs** - Track AI content generation status
5. **Page Governance** - View compliance status and cannibalization detection

### Phase 2 - 🚧 In Progress

6. **Entity Coverage Map** - Visualize entity distribution
7. **Restoration Queue** - Manage site restoration workflow
8. **System Events** - Audit log viewer
9. **Billing & Usage** - Manage API keys and track costs

### Phase 3 - 📋 Planned

10. **Settings** - User and workspace configuration
11. Polish & animations
12. Advanced visualizations
13. Mobile optimization

## Core Principles

1. **No UI overrides of Decision Engine** - If backend blocks an action, UI must show WHY (not allow bypass)
2. **Disabled buttons > Error popups** - Prevent invalid actions rather than showing errors after
3. **Validation indicators everywhere** - Users must see governance status at all times
4. **Functional first, pretty later** - MVP focuses on working governance, not polish

## API Integration

The dashboard integrates with the following API endpoints:

- `GET /api/v1/sites` - List connected sites
- `POST /api/v1/sites` - Connect new site
- `GET /api/v1/sites/:id/pages` - Get pages for site
- `POST /api/v1/pages/:id/validate` - Validate page
- `GET /api/v1/reverse-silos` - List silos
- `POST /api/v1/reverse-silos` - Create silo
- `POST /api/v1/reverse-silos/:id/finalize` - Finalize silo
- `GET /api/v1/content-jobs` - List jobs
- `POST /api/v1/content-jobs` - Create job
- `GET /api/v1/events` - System events
- `GET /api/v1/billing/usage` - Usage stats

## Development

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Authentication

The dashboard uses JWT-based authentication. Tokens are stored in `localStorage` and automatically included in API requests via the axios interceptor in `lib/api-client.ts`.

## License

[Your License Here]

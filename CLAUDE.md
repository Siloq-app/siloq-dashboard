# CLAUDE.md — Siloq Dashboard Development Rules

## Stack
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **State:** React hooks + context (no Redux)
- **API:** All calls go through `/api/v1/` on the Siloq API (Django backend)
- **Auth:** JWT token stored in localStorage as `siloq_token`

## API Field Mapping (CRITICAL)
The API returns **snake_case**. The dashboard must map to camelCase for React state.
Always check the API response shape before writing a component.
Common gotcha: `subscription_tier` (API) → `subscriptionTier` (component state).

## TAB_REDIRECTS Trap
`app/(dashboard)/page.tsx` has a `TAB_REDIRECTS` object.
**Before adding a new tab:** check it's not accidentally listed there — it silently redirects.
If a tab stops working, check this object first.

## Navigation Pattern
- Tabs use `?tab=xxx` query params
- `router.push()` for tab switches
- Never `window.location.href` inside the app

## Component Rules
- Every toggle, button, or interactive element MUST have an `onClick` handler wired up
- Never commit static/hardcoded UI that looks interactive but isn't
- After `create` operations: stay on current page and call the load function — don't redirect to another tab while context hasn't refreshed

## Internal Link Pattern
```tsx
import Link from 'next/link'
<Link href="/dashboard?tab=sites">Sites</Link>
```

## API Call Pattern
```tsx
const res = await fetch(`/api/v1/sites/${siteId}/endpoint/`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Branch Strategy
- All work branches off `release/v1.0`
- Feature branches: `feat/description`
- Bug fixes: `fix/description`
- Never commit directly to `main` or `release/v1.0`

## Pre-Commit Checklist
1. No TypeScript errors (`npm run build` or `tsc --noEmit`)
2. No hardcoded user IDs, site IDs, or API keys
3. All new buttons/toggles have real handlers
4. Snake_case API fields mapped to camelCase in components
5. No `console.log` left in production code

## Common Bugs Reference
- **API keys showing "Revoked"** → snake_case mapping issue in API key component
- **Sites tab invisible** → check TAB_REDIRECTS in page.tsx
- **Notifications not saving** → check if toggle has real onClick + API call
- **onSiteCreated redirect loop** → use loadSites() instead of tab redirect

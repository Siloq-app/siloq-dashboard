# Siloq Dashboard

A modern SEO analytics platform built with Next.js 15, TypeScript, and Tailwind CSS. Provides comprehensive site management, cannibalization analysis, and SEO optimization tools.

## Quick Start

```bash
# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Configure API endpoints in .env.local

# Development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

## Core Features

- **Multi-Site Management** - Centralized dashboard for multiple WordPress sites
- **SEO Analytics** - Cannibalization detection, silo visualization, and performance metrics
- **Content Optimization** - Link opportunities and recommendation engine
- **API Integration** - WordPress plugin connectivity with managed API keys
- **User Management** - Authentication, profiles, and site configurations

## Architecture

### Modern React Patterns
- **Modular Context** - Separated concerns with custom hooks
- **Error Handling** - Centralized error management with typed errors
- **Caching Strategy** - Intelligent cache management with TTL
- **State Management** - Optimized loading states and request cancellation

### Project Structure

```
app/
├── auth/                 # Authentication flows
├── dashboard/            # Main application interface
└── layout.tsx           # Root layout

components/
├── screens/             # Feature-specific components
├── ui/                  # Reusable UI components
└── layout/              # Navigation and layout components

lib/
├── auth/                # Authentication utilities
├── backend/             # Backend API integration
├── billing/             # Billing and subscription logic
├── content/             # Help content and documentation
├── hooks/               # Custom React hooks
├── services/            # API service layer
└── utils/               # Utility functions and helpers
```

## Technology Stack

- **Framework**: Next.js 15.5.10, React 18
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with Prettier plugin
- **UI Components**: shadcn/ui, Radix UI primitives
- **State Management**: React Context with custom hooks
- **Data Visualization**: Recharts
- **Code Quality**: ESLint, Prettier, comprehensive error handling

## Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run format       # Prettier formatting
```

## Key Improvements

- **Enhanced Error Handling** - Typed error classes with severity levels
- **Performance Optimization** - Intelligent caching and request management
- **Type Safety** - Comprehensive TypeScript interfaces
- **Code Organization** - Modular architecture with clear separation of concerns
- **Developer Experience** - Consistent patterns and comprehensive utilities

## License

Proprietary - All rights reserved.

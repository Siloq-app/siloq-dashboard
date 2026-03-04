/**
 * Mock Data Service
 * Provides fallback data when the backend server is unavailable
 */

import { Site } from '@/lib/services/api';

export interface MockSite {
  id: number;
  name: string;
  url: string;
  created_at: string;
  is_active: boolean;
}

export interface MockPage {
  id: number;
  url: string;
  title: string;
  status: 'publish' | 'draft' | 'private';
  published_at: string | null;
  last_synced_at: string | null;
  is_money_page: boolean;
  is_noindex: boolean;
}

export interface MockPageAnalysis {
  id: string;
  url: string;
  geo_recommendations: any[];
  seo_recommendations: any[];
  cro_recommendations: any[];
  created_at: string;
}

// Mock data for development when backend is unavailable
export const mockSites: Site[] = [
  {
    id: 999,
    name: 'Demo Website',
    url: 'https://example.com',
    is_active: true,
    page_count: 3,
    api_key_count: 1,
    last_synced_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    gsc_connected: false,
  },
];

export const mockPages: MockPage[] = [
  {
    id: 1,
    url: 'https://example.com/',
    title: 'Home Page',
    status: 'publish',
    published_at: '2024-01-01T00:00:00Z',
    last_synced_at: '2024-01-01T00:00:00Z',
    is_money_page: true,
    is_noindex: false,
  },
  {
    id: 2,
    url: 'https://example.com/about',
    title: 'About Us',
    status: 'publish',
    published_at: '2024-01-01T00:00:00Z',
    last_synced_at: '2024-01-01T00:00:00Z',
    is_money_page: false,
    is_noindex: false,
  },
  {
    id: 3,
    url: 'https://example.com/contact',
    title: 'Contact',
    status: 'draft',
    published_at: null,
    last_synced_at: '2024-01-01T00:00:00Z',
    is_money_page: true,
    is_noindex: false,
  },
];

export const mockPageAnalysis: MockPageAnalysis = {
  id: 'demo-analysis-1',
  url: 'https://example.com/',
  geo_recommendations: [
    {
      id: 'geo-1',
      layer: 'geo',
      priority: 'high',
      issue: 'Missing local business schema',
      recommendation: 'Add LocalBusiness schema markup',
      before: '<html>',
      after: '<html><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness",...}</script>',
      field: 'schema',
      status: 'pending',
    },
  ],
  seo_recommendations: [
    {
      id: 'seo-1',
      layer: 'seo',
      priority: 'medium',
      issue: 'Title tag too long',
      recommendation: 'Shorten title to under 60 characters',
      before: '<title>This is a very long title that exceeds the recommended length for SEO purposes</title>',
      after: '<title>This is a better title</title>',
      field: 'title',
      status: 'pending',
    },
  ],
  cro_recommendations: [
    {
      id: 'cro-1',
      layer: 'cro',
      priority: 'low',
      issue: 'Weak call-to-action',
      recommendation: 'Make CTA button more prominent',
      before: '<button class="btn">Click here</button>',
      after: '<button class="btn btn-primary btn-large">Get Started Now!</button>',
      field: 'cta',
      status: 'pending',
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
};

export const mockConflicts = [
  {
    id: 1,
    winner_url: 'https://example.com/page-a',
    loser_url: 'https://example.com/page-b',
    conflict_type: 'cannibalization',
    similarity_score: 0.85,
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockSilos = [
  {
    id: 1,
    name: 'Main Silo',
    pages: ['https://example.com/', 'https://example.com/about'],
    created_at: '2024-01-01T00:00:00Z',
  },
];

/**
 * Check if we should use mock data based on backend availability
 */
export function shouldUseMockData(): boolean {
  // In development, we can check if backend is available
  // For now, return true if we're in development mode
  return process.env.NODE_ENV === 'development';
}

/**
 * Get mock data with a delay to simulate network latency
 */
export async function getMockData<T>(data: T, delay: number = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

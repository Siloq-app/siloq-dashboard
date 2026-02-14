import { MockPage } from './types';

export const MOCK_PAGES: MockPage[] = [
  {
    id: 123,
    title: 'Test Page',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Test page for WordPress plugin demo.',
    synced: true,
    lastSyncedAt: '2024-02-14 16:00'
  },
  {
    id: 11,
    title: 'Hello World 2!',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Another Hello World post.',
    synced: true,
    lastSyncedAt: '2024-02-14 15:45'
  },
  {
    id: 8,
    title: 'Hello World!',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Welcome to WordPress. This is your first post.',
    synced: true,
    lastSyncedAt: '2024-02-14 15:30'
  },
  {
    id: 3,
    title: 'Privacy Policy',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Privacy policy page.',
    synced: true,
    lastSyncedAt: '2024-02-14 15:15'
  },
  {
    id: 2,
    title: 'Sample Page',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'This is a sample page.',
    synced: true,
    lastSyncedAt: '2024-02-14 15:00'
  },
  {
    id: 1,
    title: 'Hello world!',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Welcome to WordPress. This is your first post.',
    synced: true,
    lastSyncedAt: '2024-02-14 14:45'
  },
  {
    id: 13,
    title: 'Create',
    status: 'publish',
    date: '2024-02-14',
    author: 'admin',
    excerpt: 'Create new content.',
    synced: false
  }
];

export const WP_COLORS = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  success: '#46b450',
  warning: '#ffb900',
  error: '#dc3232',
  bg: '#f0f0f1',
  text: '#3c434a'
};

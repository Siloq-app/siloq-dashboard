import { MockPage } from './types';

export const MOCK_PAGES: MockPage[] = [
  {
    id: 1,
    title: 'Homepage - Welcome to Our Business',
    status: 'publish',
    date: '2024-01-15',
    author: 'admin',
    excerpt: 'Welcome to our premier business solutions company. We provide innovative services to help your business grow and succeed in the modern marketplace.',
    synced: true,
    lastSyncedAt: '2024-02-10 14:30'
  },
  {
    id: 2,
    title: 'About Us - Our Story',
    status: 'publish',
    date: '2024-01-10',
    author: 'admin',
    excerpt: 'Founded in 2010, our company has been at the forefront of digital innovation. Learn more about our journey and mission.',
    synced: true,
    lastSyncedAt: '2024-02-09 10:15'
  },
  {
    id: 3,
    title: 'Services - What We Offer',
    status: 'publish',
    date: '2024-01-20',
    author: 'editor',
    excerpt: 'Discover our comprehensive range of services including digital marketing, web development, SEO optimization, and business consulting.',
    synced: false
  },
  {
    id: 4,
    title: 'Contact - Get In Touch',
    status: 'publish',
    date: '2024-01-12',
    author: 'admin',
    excerpt: 'Ready to take your business to the next level? Contact us today for a free consultation. Our team is here to help you succeed.',
    synced: true,
    lastSyncedAt: '2024-02-08 16:45'
  },
  {
    id: 5,
    title: 'Blog - Latest Insights',
    status: 'draft',
    date: '2024-02-05',
    author: 'editor',
    excerpt: 'Stay up to date with the latest trends in digital marketing, SEO strategies, and business growth tips from our expert team.',
    synced: false
  },
  {
    id: 6,
    title: 'Products - Our Solutions',
    status: 'publish',
    date: '2024-01-25',
    author: 'admin',
    excerpt: 'Explore our product lineup designed to streamline your business operations and maximize efficiency.',
    synced: true,
    lastSyncedAt: '2024-02-07 09:20'
  },
  {
    id: 7,
    title: 'Testimonials - Client Success',
    status: 'publish',
    date: '2024-01-18',
    author: 'editor',
    excerpt: 'See what our clients have to say about working with us. Real success stories from real businesses.',
    synced: false
  },
  {
    id: 8,
    title: 'Pricing - Flexible Plans',
    status: 'private',
    date: '2024-02-01',
    author: 'admin',
    excerpt: 'Choose the plan that fits your business needs. From startups to enterprises, we have pricing options for everyone.',
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

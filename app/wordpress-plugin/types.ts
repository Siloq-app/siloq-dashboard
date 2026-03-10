export interface MockPage {
  id: number;
  title: string;
  status: 'publish' | 'draft' | 'private';
  date: string;
  author: string;
  excerpt: string;
  url?: string;
  synced: boolean;
  lastSyncedAt?: string;
}

export interface SeoAnalysisResult {
  score: number;
  summary: string;
  keywords: string[];
  improvements: string[];
  leadGenHook: string;
}

export enum AppView {
  DASHBOARD = 'dashboard',
  SETUP = 'setup',
  SYNC = 'sync',
  SCANNER = 'scanner',
  SETTINGS = 'settings',
}

export interface SetupConfig {
  apiKey: string;
  connected: boolean;
  postTypes: string[];
  autoSync: boolean;
}

import { CannibalizationIssue, Silo, PendingChange, LinkOpportunity } from './types';

export const linkOpportunities: LinkOpportunity[] = [
  {
    id: 1,
    sourcePage: {
      title: 'Kitchen Cabinet Styles 2024',
      url: '/kitchen-cabinets',
    },
    targetPage: {
      title: 'Complete Kitchen Remodeling Guide',
      url: '/kitchen-remodel-guide',
    },
    anchorText: 'kitchen remodeling guide',
    context: 'For a complete overhaul, see our kitchen remodeling guide with cost breakdowns.',
    priority: 'high',
    estimatedImpact: '+15% page authority',
    siloContext: 'Kitchen Remodeling',
  },
  {
    id: 2,
    sourcePage: {
      title: 'Countertop Materials Compared',
      url: '/countertop-materials',
    },
    targetPage: {
      title: 'Complete Kitchen Remodeling Guide',
      url: '/kitchen-remodel-guide',
    },
    anchorText: 'full kitchen renovation',
    context: 'Countertops are a key component of any full kitchen renovation project.',
    priority: 'high',
    estimatedImpact: '+12% page authority',
    siloContext: 'Kitchen Remodeling',
  },
  {
    id: 3,
    sourcePage: {
      title: 'Shower Tile Ideas',
      url: '/shower-tiles',
    },
    targetPage: {
      title: 'Bathroom Renovation Guide',
      url: '/bathroom-renovation',
    },
    anchorText: 'bathroom renovation',
    context: 'Tiles set the tone for your entire bathroom renovation.',
    priority: 'medium',
    estimatedImpact: '+8% page authority',
    siloContext: 'Bathroom Renovation',
  },
  {
    id: 4,
    sourcePage: {
      title: 'Kitchen Layout Ideas',
      url: '/kitchen-layouts',
    },
    targetPage: {
      title: 'Complete Kitchen Remodeling Guide',
      url: '/kitchen-remodel-guide',
    },
    anchorText: 'kitchen remodel planning',
    context: 'Layout is the foundation of kitchen remodel planning.',
    priority: 'medium',
    estimatedImpact: '+10% page authority',
    siloContext: 'Kitchen Remodeling',
  },
  {
    id: 5,
    sourcePage: {
      title: 'Vanity Buying Guide',
      url: '/vanity-guide',
    },
    targetPage: {
      title: 'Bathroom Renovation Guide',
      url: '/bathroom-renovation',
    },
    anchorText: 'bathroom renovation costs',
    context: 'Vanities typically represent 15-20% of bathroom renovation costs.',
    priority: 'low',
    estimatedImpact: '+5% page authority',
    siloContext: 'Bathroom Renovation',
  },
];

export const cannibalizationIssues: CannibalizationIssue[] = [
  {
    id: 1,
    keyword: 'kitchen remodeling',
    pages: [
      '/kitchen-remodel-cost',
      '/kitchen-renovation-guide',
      '/remodel-your-kitchen',
    ],
    severity: 'high',
    impressions: 12400,
    splitClicks: '34% / 41% / 25%',
    recommendation: 'Consolidate into single Target Page',
  },
  {
    id: 2,
    keyword: 'bathroom vanity ideas',
    pages: ['/bathroom-vanity-styles', '/vanity-buying-guide'],
    severity: 'medium',
    impressions: 8200,
    splitClicks: '52% / 48%',
    recommendation: 'Differentiate entity targeting',
  },
  {
    id: 3,
    keyword: 'hardwood floor installation',
    pages: ['/hardwood-installation', '/flooring-installation-cost'],
    severity: 'low',
    impressions: 3100,
    splitClicks: '78% / 22%',
    recommendation: 'Add internal links to strengthen Target',
  },
];

export const silos: Silo[] = [
  {
    id: 1,
    name: 'Kitchen Remodeling',
    targetPage: {
      title: 'Complete Kitchen Remodeling Guide',
      url: '/kitchen-remodel-guide',
      status: 'published',
      entities: ['kitchen remodel', 'renovation cost', 'kitchen design'],
    },
    supportingPages: [
      {
        title: 'Kitchen Cabinet Styles 2024',
        url: '/kitchen-cabinets',
        status: 'published',
        linked: true,
        entities: ['cabinet styles', 'shaker cabinets'],
      },
      {
        title: 'Countertop Materials Compared',
        url: '/countertop-materials',
        status: 'published',
        linked: true,
        entities: ['granite', 'quartz', 'marble'],
      },
      {
        title: 'Kitchen Layout Ideas',
        url: '/kitchen-layouts',
        status: 'draft',
        linked: false,
        entities: ['galley kitchen', 'L-shaped'],
      },
    ],
  },
  {
    id: 2,
    name: 'Bathroom Renovation',
    targetPage: {
      title: 'Bathroom Renovation Guide',
      url: '/bathroom-renovation',
      status: 'published',
      entities: ['bathroom remodel', 'renovation cost'],
    },
    supportingPages: [
      {
        title: 'Shower Tile Ideas',
        url: '/shower-tiles',
        status: 'published',
        linked: true,
        entities: ['tile patterns', 'mosaic tiles'],
      },
      {
        title: 'Vanity Buying Guide',
        url: '/vanity-guide',
        status: 'draft',
        linked: false,
        entities: ['vanity styles', 'storage'],
      },
    ],
  },
];

export const pendingChanges: PendingChange[] = [
  {
    id: 1,
    type: '301_redirect',
    description: 'Redirect /old-kitchen-page to /kitchen-remodel-guide',
    risk: 'safe',
    impact: 'Consolidates link equity',
  },
  {
    id: 2,
    type: 'internal_link',
    description: 'Add links from 3 supporting pages to Target',
    risk: 'safe',
    impact: 'Strengthens entity relationships',
  },
  {
    id: 3,
    type: 'content_update',
    description: 'Update /bathroom-vanity with new 2024 trends',
    risk: 'safe',
    impact: 'Refreshes entity coverage',
  },
  {
    id: 4,
    type: 'entity_assign',
    description:
      'Assign entities [pendant lights, task lighting] to /kitchen-lighting',
    risk: 'safe',
    impact: 'Improves semantic targeting',
    doctrine: 'ENTITY_001',
  },
  {
    id: 5,
    type: 'content_merge',
    description: 'Merge /remodel-your-kitchen into /kitchen-remodel-guide',
    risk: 'destructive',
    impact: 'Eliminates cannibalization, consolidates 4,100 impressions',
    doctrine: 'CANN_RESTORE_002',
  },
];

export const automationModes = [
  {
    id: 'manual' as const,
    label: 'Manual',
    desc: 'All changes require approval',
  },
  {
    id: 'semi' as const,
    label: 'Semi-Auto',
    desc: 'Safe changes auto-execute',
  },
  { id: 'full' as const, label: 'Full-Auto', desc: '48-hour rollback window' },
];

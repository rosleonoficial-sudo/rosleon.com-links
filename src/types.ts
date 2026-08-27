export interface SocialLink {
  id: string;
  platform: 'telegram' | 'whatsapp' | 'youtube' | 'instagram' | 'tiktok';
  title: string;
  subtitle: string;
  url: string;
  buttonText: string;
  badge?: string;
  iconBgColor?: string;
  buttonGradient?: string;
  enabled: boolean;
}

export interface CreatorStats {
  subscribers: string;
  views: string;
  levelBadge: string;
  videos?: string;
  subscribersFull?: string;
  viewsFull?: string;
  videosFull?: string;
  rawViews?: number;
  rawSubscribers?: number;
  lastUpdated?: string;
  isLiveApiData?: boolean;
}

export interface InstagramStats {
  name?: string;
  username?: string;
  profilePictureUrl?: string;
  followers?: number | null;
  followersCount?: number | null;
  followersFormatted?: string | null;
  mediaCount?: number | null;
  mediaCountFormatted?: string | null;
  views30Days?: number | null;
  views30DaysFormatted?: string | null;
  views30d?: number | null;
  views30dFormatted?: string | null;
  viewsTotal?: number | null;
  viewsTotalFormatted?: string | null;
  videosTotal?: number | null;
  tiktokFollowers?: number | null;
  tiktokViews?: number | null;
  tiktokVideos?: number | null;
  totalViews3Networks?: number | null;
  totalViews3NetworksFormatted?: string | null;
  reach30d?: number | null;
  reach30dFormatted?: string | null;
  profileVisits30d?: number | null;
  profileVisits30dFormatted?: string | null;
  source?: string;
  isAutoSynced?: boolean;
  lastSyncedAt?: string;
  stale?: boolean;
  syncError?: string | null;
  updatedAt?: string;
}

export interface CreatorProfile {
  name: string;
  title: string;
  bioHeadline: string;
  bioParagraph1: string;
  bioParagraph2: string;
  bioParagraph3?: string;
  photoUrl: string;
  aboutPhotoUrl: string;
  pillars: {
    title: string;
    subtitle?: string;
    icon: string;
  }[];
}

export interface CouponItem {
  id: string;
  category: string;
  discount: string;
  timeAgo: string;
  activeUsers: string;
  active: boolean;
}

export interface StateAudience {
  id: string;
  name: string;
  region: string;
  topCity: string;
  x: number;
  y: number;
  viewers: number;
  viewersFormatted: string;
  activeUsers: number;
  percentage: number;
  sharePercent: number;
  instagram: number;
  youtube: number;
  site: number;
  instagramShare: number;
  youtubeShare: number;
  siteShare: number;
}

export interface PlatformAudience {
  instagram: number;
  instagramFormatted: string;
  youtube: number;
  youtubeFormatted: string;
  site: number;
  siteFormatted: string;
  total: number;
  totalFormatted: string;
}

export interface RealtimeAudienceData {
  snapshotId: string;
  activeNow: number;
  activeNowFormatted: string;
  generatedAt: string;
  nextUpdateAt: string;
  platforms: PlatformAudience;
  states: StateAudience[];
}

export interface CentralMediaKitData {
  success: boolean;
  snapshotId: string;
  generatedAt: string;
  nextUpdateAt: string;
  instagram: InstagramStats;
  youtube: {
    subscribers: number;
    subscribersFormatted: string;
    views: number;
    viewsFormatted: string;
    videos: number;
  };
  tiktok: {
    followers: number;
    followersFormatted: string;
    views: number;
    viewsFormatted: string;
    isAutoSynced: boolean;
  };
  communityTotal: {
    total: number;
    totalFormatted: string;
    breakdown: {
      youtube: number;
      instagram: number;
      tiktok: number;
    };
  };
  realtimeAudience: RealtimeAudienceData;
}

export interface SiteConfig {
  siteTitle: string;
  logoText: string;
  badgeText: string;
  heroTitlePrefix: string;
  heroTitleHighlight1: string;
  heroTitleMiddle: string;
  heroTitleHighlight2: string;
  heroTitleSuffix: string;
  heroSubtitle: string;
  heroHighlights: string[];
  
  telegramLink: SocialLink;
  whatsappLink: SocialLink;
  whatsappSupportLink?: SocialLink;
  youtubeSection: {
    title: string;
    description: string;
    buttonText: string;
    url: string;
    bannerText: string;
    bannerImage: string;
  };
  instagramLink: SocialLink;
  tiktokLink: SocialLink;
  
  creator: CreatorProfile;
  stats: CreatorStats;
  
  couponsFeed: CouponItem[];
  
  primaryGlowColor: string;
}

// ==========================================
// PORTAL DE RESULTADOS TYPES
// ==========================================

export interface Brand {
  id: number | string;
  name: string;
  slug: string;
  keywords: string[];
  contentCount?: number;
}

export type PlatformType = 'youtube' | 'instagram' | 'tiktok';
export type ContentType = 'all' | 'video' | 'shorts' | 'reels';
export type SortOption = 'recent' | 'views' | 'likes' | 'comments' | 'shares' | 'engagement';
export type PeriodFilter = '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';

export interface ContentMetrics {
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number | null; // null when not publicly provided (e.g. YouTube API)
  engagementRate: number | null;
  performanceScore?: number;
  lastSyncedAt: string;
}

export interface ContentClassification {
  primaryBrands: string[];
  primaryProducts: string[];
  secondaryBrands: string[];
  secondaryProducts: string[];
  aliases: string[];
  isComparison: boolean;
  confidenceScore: number;
}

export interface ContentItem {
  id: number | string;
  platform: PlatformType;
  externalId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  contentType: 'video' | 'shorts' | 'reels';
  publishedAt: string;
  brands: string[]; // Brand names or slugs
  classification?: ContentClassification;
  metrics: ContentMetrics;
  performanceScore?: number;
}

export interface ResultsFilterState {
  q: string;
  platform: 'all' | PlatformType;
  sortBy: SortOption;
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
  contentType: ContentType;
  brand?: string;
  minViews?: number;
  page: number;
  limit: number;
}

export interface PlatformSummaryBreakdown {
  platform: PlatformType;
  totalContents: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number | null;
}

export interface BrandRankMetric {
  rank: number;
  totalValue: number;
}

export interface BrandRankEngagement {
  rank: number;
  value: number;
}

export interface BrandRankingItem {
  brandName: string;
  totalBrands: number;
  ranks: {
    views: BrandRankMetric;
    likes: BrandRankMetric;
    comments: BrandRankMetric;
    shares: BrandRankMetric;
    engagement: BrandRankEngagement;
  };
}

export interface ResultsSummaryData {
  totalContents: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number | null;
  avgEngagementRate: number;
  breakdown: {
    youtube?: PlatformSummaryBreakdown;
    instagram?: PlatformSummaryBreakdown;
    tiktok?: PlatformSummaryBreakdown;
  };
  brandRanking?: BrandRankingItem | null;
}

export interface ResultsApiResponse {
  success: boolean;
  contents: ContentItem[];
  summary: ResultsSummaryData;
  brandRanking?: BrandRankingItem | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  activeFilters: ResultsFilterState;
  lastSyncedAt: string;
  nextSyncAt: string;
}

export interface ResultsStatusResponse {
  success: boolean;
  lastSyncedAt: string;
  nextSyncAt: string;
  syncIntervalMs: number;
  isSyncing: boolean;
  platforms: {
    youtube: { status: 'active' | 'error'; totalContents: number; lastSyncedAt: string };
    instagram: { status: 'active' | 'error'; totalContents: number; lastSyncedAt: string };
    tiktok: { status: 'active' | 'in_progress' | 'error'; totalContents: number; connected?: boolean; lastSyncedAt?: string; message?: string };
  };
}


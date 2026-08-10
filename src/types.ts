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

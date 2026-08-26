import { getPool, isPostgresActive, getMemoryStore, DbBrand, DbContent, DbContentMetrics } from './db.js';
import {
  classifyContent,
  reclassifyAllDatabaseContents,
  refreshCatalog,
  cleanText,
  normalizeToken,
  CANONICAL_BRANDS
} from './classifierService.js';
import {
  ContentItem,
  ResultsFilterState,
  ResultsApiResponse,
  ResultsSummaryData,
  PlatformSummaryBreakdown,
  Brand,
  ContentClassification
} from '../src/types.js';

let globalLastSyncedAt = new Date().toISOString();
let globalNextSyncAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
let globalIsSyncing = false;

let ytStatus = { status: 'active' as const, totalContents: 0, lastSyncedAt: new Date().toISOString() };
let igStatus = { status: 'active' as const, totalContents: 0, lastSyncedAt: new Date().toISOString() };

export function getSyncStatus() {
  return {
    success: true,
    lastSyncedAt: globalLastSyncedAt,
    nextSyncAt: globalNextSyncAt,
    syncIntervalMs: 30 * 60 * 1000,
    isSyncing: globalIsSyncing,
    platforms: {
      youtube: ytStatus,
      instagram: igStatus,
      tiktok: {
        status: 'in_progress' as const,
        totalContents: 0,
        message: 'Estamos finalizando a integração das métricas do TikTok. Em breve, os resultados dessa plataforma também estarão disponíveis neste portal.'
      }
    }
  };
}

// Strict token boundary matching helper
export function calculatePerformanceScore(item: {
  metrics: {
    viewsCount: number;
    likesCount: number;
    commentsCount: number;
    sharesCount: number | null;
    engagementRate: number | null;
  };
  contentType: string;
  platform: string;
  publishedAt: string;
}): number {
  const v = Math.max(0, item.metrics.viewsCount || 0);
  const l = Math.max(0, item.metrics.likesCount || 0);
  const c = Math.max(0, item.metrics.commentsCount || 0);
  const s = Math.max(0, item.metrics.sharesCount || 0);

  let er = item.metrics.engagementRate;
  if (er === null || er === undefined) {
    er = v > 0 ? parseFloat((((l + c + s) / v) * 100).toFixed(2)) : 0;
  }

  // 1. Log-scale view score (30%) - Benchmarking against 500k max views
  const vScore = Math.min(100, (Math.log10(v + 1) / Math.log10(500000 + 1)) * 100);

  // 2. Log-scale quality action score (35%) - Likes (1x), Comments (3x), Shares (4x), benchmarked against 50k
  const weightedActions = l + (3.0 * c) + (4.0 * s);
  const aScore = Math.min(100, (Math.log10(weightedActions + 1) / Math.log10(50000 + 1)) * 100);

  // 3. Normalized engagement rate score (20%) - Expected ER: 7.5% for video, 10.0% for shorts/reels
  const expectedER = item.contentType === 'video' ? 7.5 : 10.0;
  const eScore = Math.min(100, (er / expectedER) * 100);

  // 4. Recency factor (15%) - Exponential half-life decay of 730 days (2 years)
  const pubTime = new Date(item.publishedAt).getTime();
  const ageDays = Math.max(0, (Date.now() - pubTime) / (1000 * 60 * 60 * 24));
  const rScore = Math.min(100, 100 * Math.exp(-ageDays / 730));

  const finalScore = Math.round(0.30 * vScore + 0.35 * aScore + 0.20 * eScore + 0.15 * rScore);
  return Math.max(0, Math.min(100, finalScore));
}

export function determineEditorialLevel(item: ContentItem, query?: string): number {
  if (item.classification?.isComparison) {
    return 3; // LEVEL 3: COMPARATIVOS
  }

  if (item.contentType === 'video') {
    return 1; // LEVEL 1: DEDICADO PRINCIPAL (Vídeo longo)
  }

  return 2; // LEVEL 2: OUTROS DEDICADOS (Shorts / Reels)
}

export function matchKeywordInText(keyword: string, text: string): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.trim().toLowerCase();
  const lowerText = text.toLowerCase();

  const escapedKw = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

  if (kw.includes(' ')) {
    return lowerText.includes(kw);
  }

  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#@])${escapedKw}(?:$|[^a-zA-Z0-9_#@])`, 'i');
  return regex.test(lowerText);
}

// Determines if a content is genuinely about a brand
export function isBrandInContent(brand: Brand | DbBrand, title: string, description: string): boolean {
  // 1. Check Title (highest authority)
  if (matchKeywordInText(brand.name, title) || matchKeywordInText(brand.slug, title)) {
    return true;
  }
  for (const kw of brand.keywords) {
    if (matchKeywordInText(kw, title)) return true;
  }

  // 2. Check Hashtags in Title or Description (#WAAW, #JBL, #UOL, etc.)
  const fullText = `${title} ${description}`.toLowerCase();
  const cleanSlug = brand.slug.replace(/[^a-z0-9]/gi, '');
  const cleanName = brand.name.toLowerCase().replace(/[^a-z0-9]/gi, '');
  if (fullText.includes(`#${cleanSlug}`) || fullText.includes(`#${cleanName}`)) {
    return true;
  }

  // 3. Check intro description (first 300 chars, before footer links block)
  const descIntro = (description || '').slice(0, 300);
  if (matchKeywordInText(brand.name, descIntro) || matchKeywordInText(brand.slug, descIntro)) {
    return true;
  }
  for (const kw of brand.keywords) {
    if (matchKeywordInText(kw, descIntro)) return true;
  }

  return false;
}

export async function getAllBrands(): Promise<Brand[]> {
  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT b.id, b.name, b.slug, b.keywords, COUNT(cb.content_id)::int as content_count
          FROM brands b
          LEFT JOIN content_brands cb ON b.id = cb.brand_id
          GROUP BY b.id, b.name, b.slug, b.keywords
          ORDER BY b.name ASC
        `);
        return res.rows.map(row => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          keywords: Array.isArray(row.keywords) ? row.keywords : JSON.parse(row.keywords || '[]'),
          contentCount: row.content_count
        }));
      } catch (e) {
        console.warn('Erro ao buscar marcas no Postgres:', e);
      }
    }
  }

  // Memory fallback
  const memoryDb = getMemoryStore();
  return memoryDb.brands.map(b => {
    const count = memoryDb.content_brands.filter(cb => cb.brand_id === b.id).length;
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      keywords: b.keywords,
      contentCount: count
    };
  });
}

// Match brand IDs for a given title & description using strict rules
export async function matchBrandIdsForText(title: string, description: string = ''): Promise<number[]> {
  const brands = await getAllBrands();
  const matchedIds: number[] = [];

  for (const b of brands) {
    if (isBrandInContent(b, title, description)) {
      matchedIds.push(Number(b.id));
    }
  }

  return matchedIds;
}

// Reprocess all brand-content relationships cleanly via classifier service
export async function reprocessAllContentBrands() {
  return await reclassifyAllDatabaseContents();
}

export async function getAllCatalogContents(): Promise<ContentItem[]> {
  let rawList: ContentItem[] = [];

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`
          SELECT 
            c.id, c.platform, c.external_id, c.title, c.description, c.url, c.thumbnail_url, c.content_type, c.published_at,
            m.views_count, m.likes_count, m.comments_count, m.shares_count, m.engagement_rate, m.last_synced_at
          FROM contents c
          LEFT JOIN content_metrics m ON c.id = m.content_id
        `);

        rawList = res.rows.map(row => {
          const cls = classifyContent(row.title, row.description || '', row.content_type || 'video', row.platform);

          return {
            id: row.id,
            platform: row.platform,
            externalId: row.external_id,
            title: row.title,
            description: row.description || '',
            url: row.url,
            thumbnailUrl: row.thumbnail_url || '',
            contentType: row.content_type || 'video',
            publishedAt: row.published_at ? new Date(row.published_at).toISOString() : new Date().toISOString(),
            brands: cls.primaryBrands,
            classification: cls,
            metrics: {
              viewsCount: Number(row.views_count || 0),
              likesCount: Number(row.likes_count || 0),
              commentsCount: Number(row.comments_count || 0),
              sharesCount: row.shares_count !== null && row.shares_count !== undefined ? Number(row.shares_count) : null,
              engagementRate: row.engagement_rate !== null && row.engagement_rate !== undefined ? Number(row.engagement_rate) : null,
              lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at).toISOString() : new Date().toISOString()
            }
          };
        });
      } catch (e) {
        console.warn('Erro ao consultar catálogo no Postgres:', e);
      }
    }
  }

  // Fallback to memory if empty or pg not active
  if (rawList.length === 0) {
    const memoryDb = getMemoryStore();
    rawList = memoryDb.contents.map(c => {
      const metrics = memoryDb.metrics.get(c.id) || {
        content_id: c.id,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: null,
        engagement_rate: 0,
        last_synced_at: new Date().toISOString()
      };

      const cls = classifyContent(c.title, c.description || '', c.content_type || 'video', c.platform);

      return {
        id: c.id,
        platform: c.platform,
        externalId: c.external_id,
        title: c.title,
        description: c.description || '',
        url: c.url,
        thumbnailUrl: c.thumbnail_url || '',
        contentType: c.content_type || 'video',
        publishedAt: c.published_at,
        brands: cls.primaryBrands,
        classification: cls,
        metrics: {
          viewsCount: Number(metrics.views_count || 0),
          likesCount: Number(metrics.likes_count || 0),
          commentsCount: Number(metrics.comments_count || 0),
          sharesCount: metrics.shares_count !== null && metrics.shares_count !== undefined ? Number(metrics.shares_count) : null,
          engagementRate: metrics.engagement_rate !== null && metrics.engagement_rate !== undefined ? Number(metrics.engagement_rate) : null,
          lastSyncedAt: metrics.last_synced_at
        }
      };
    });
  }

  // Deduplication by platform + external_id (or platform + id)
  const uniqueMap = new Map<string, ContentItem>();
  for (const item of rawList) {
    const key = `${item.platform}:${item.externalId || item.id}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }
  const deduplicatedList = Array.from(uniqueMap.values());

  // Attach performanceScore
  deduplicatedList.forEach(item => {
    const score = calculatePerformanceScore(item);
    item.performanceScore = score;
    item.metrics.performanceScore = score;
  });

  return deduplicatedList;
}

export interface UnifiedBrandStats {
  brand: string;
  contentCount: number;
  totalViews: number;
  ytViews: number;
  igViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number; // Formula: (likes + comments + shares) / views * 100
}

export async function getGlobalBrandStats(): Promise<Map<string, UnifiedBrandStats>> {
  const contents = await getAllCatalogContents();

  // Map canonical brand lookup: lowercased keyword/slug/name -> Canonical Name
  const canonicalLookupMap = new Map<string, string>();
  for (const b of CANONICAL_BRANDS) {
    canonicalLookupMap.set(b.name.toLowerCase(), b.name);
    canonicalLookupMap.set(b.slug.toLowerCase(), b.name);
    for (const kw of b.keywords) {
      canonicalLookupMap.set(kw.toLowerCase(), b.name);
    }
  }

  const brandStatsMap = new Map<string, UnifiedBrandStats>();
  for (const b of CANONICAL_BRANDS) {
    brandStatsMap.set(b.name, {
      brand: b.name,
      contentCount: 0,
      totalViews: 0,
      ytViews: 0,
      igViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      engagementRate: 0
    });
  }

  for (const item of contents) {
    const cls = item.classification || classifyContent(item.title, item.description, item.contentType, item.platform);
    const primaryBrands = cls.primaryBrands || item.brands || [];

    const matchedCanonicalNames = new Set<string>();
    for (const rawB of primaryBrands) {
      if (!rawB || !rawB.trim()) continue;
      const cleanB = rawB.trim().toLowerCase();
      if (canonicalLookupMap.has(cleanB)) {
        matchedCanonicalNames.add(canonicalLookupMap.get(cleanB)!);
      }
    }

    for (const brandName of Array.from(matchedCanonicalNames)) {
      let st = brandStatsMap.get(brandName);
      if (!st) {
        st = {
          brand: brandName,
          contentCount: 0,
          totalViews: 0,
          ytViews: 0,
          igViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          engagementRate: 0
        };
        brandStatsMap.set(brandName, st);
      }

      st.contentCount += 1;
      const v = Math.max(0, item.metrics.viewsCount || 0);
      const l = Math.max(0, item.metrics.likesCount || 0);
      const c = Math.max(0, item.metrics.commentsCount || 0);
      const s = item.metrics.sharesCount !== null && item.metrics.sharesCount !== undefined ? Math.max(0, item.metrics.sharesCount) : 0;

      st.totalViews += v;
      if (item.platform === 'youtube') st.ytViews += v;
      if (item.platform === 'instagram') st.igViews += v;

      st.totalLikes += l;
      st.totalComments += c;
      st.totalShares += s;
    }
  }

  // Calculate engagementRate weighted for each brand using the explicit formula: (likes + comments + shares) / views * 100
  for (const st of brandStatsMap.values()) {
    if (st.totalViews > 0) {
      const totalInteractions = st.totalLikes + st.totalComments + st.totalShares;
      st.engagementRate = parseFloat(((totalInteractions / st.totalViews) * 100).toFixed(2));
    } else {
      st.engagementRate = 0;
    }
  }

  return brandStatsMap;
}

export async function searchContents(filters: Partial<ResultsFilterState>): Promise<ResultsApiResponse> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const activeFilters: ResultsFilterState = {
    q: (filters.q || '').trim(),
    platform: filters.platform || 'all',
    sortBy: filters.sortBy || 'recent',
    period: filters.period || 'all',
    startDate: filters.startDate,
    endDate: filters.endDate,
    contentType: filters.contentType || 'all',
    brand: filters.brand || '',
    minViews: typeof filters.minViews === 'number' ? filters.minViews : undefined,
    page,
    limit
  };

  const rawList: ContentItem[] = await getAllCatalogContents();

  // FILTERING
  let filtered = rawList.filter(item => {
    // Platform Filter
    if (activeFilters.platform !== 'all' && item.platform !== activeFilters.platform) {
      return false;
    }

    // TikTok Status: TikTok has no real contents yet
    if (activeFilters.platform === 'tiktok') {
      return false;
    }

    // Content Type Filter
    if (activeFilters.contentType !== 'all' && item.contentType !== activeFilters.contentType) {
      return false;
    }

    // Min Views Filter
    if (activeFilters.minViews && item.metrics.viewsCount < activeFilters.minViews) {
      return false;
    }

    // Brand Filter (dropdown selection)
    if (activeFilters.brand) {
      const rawTarget = activeFilters.brand.toLowerCase();
      const targetBrand = rawTarget === 'tribut' ? 'tribit' : rawTarget;
      const hasBrand = item.classification
        ? item.classification.primaryBrands.some(b => {
            const bLow = b.toLowerCase();
            return bLow === targetBrand || bLow === rawTarget || bLow.replace(/\s+/g, '-') === targetBrand;
          })
        : item.brands.some(b => {
            const bLow = b.toLowerCase();
            return bLow === targetBrand || bLow === rawTarget || bLow.replace(/\s+/g, '-') === targetBrand;
          });
      if (!hasBrand) return false;
    }

    // Period Filter
    if (activeFilters.period !== 'all') {
      const pubDate = new Date(item.publishedAt).getTime();
      const now = Date.now();
      if (activeFilters.period === '7d' && now - pubDate > 7 * 24 * 60 * 60 * 1000) return false;
      if (activeFilters.period === '30d' && now - pubDate > 30 * 24 * 60 * 60 * 1000) return false;
      if (activeFilters.period === '90d' && now - pubDate > 90 * 24 * 60 * 60 * 1000) return false;
      if (activeFilters.period === 'year') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
        if (pubDate < startOfYear) return false;
      }
      if (activeFilters.period === 'custom') {
        if (activeFilters.startDate && pubDate < new Date(activeFilters.startDate).getTime()) return false;
        if (activeFilters.endDate && pubDate > new Date(activeFilters.endDate).getTime()) return false;
      }
    }

    return true;
  });

  // Text Query Search (q) - Strict Primary Entity Matching (primaryBrands & primaryProducts only)
  if (activeFilters.q) {
    const rawQuery = activeFilters.q.trim().toLowerCase();
    const queryClean = rawQuery.replace(/^[#@]+/, '');
    const queryTokens = queryClean.split(/\s+/).filter(t => t.length > 0);

    if (queryTokens.length > 0) {
      filtered = filtered.filter(item => {
        const cls = classifyContent(item.title, item.description, item.contentType, item.platform);

        const pBrands = (cls.primaryBrands || []).map(b => b.toLowerCase());
        const pProds = (cls.primaryProducts || []).map(p => p.toLowerCase());

        // Check if ALL query tokens match either primaryBrands OR primaryProducts
        return queryTokens.every(token => {
          const tToMatch = (token === 'hyperbom') ? 'hyperboom' : (token === 'tribut') ? 'tribit' : (token === 'jog') ? 'joog' : token;

          const brandKeywords = (cls.primaryBrands || []).flatMap(b => {
            const canonical = CANONICAL_BRANDS.find(cb => cb.name.toLowerCase() === b.toLowerCase());
            return canonical ? canonical.keywords : [b.toLowerCase()];
          });

          const matchBrand = pBrands.some(b => b.includes(tToMatch) || normalizeToken(b).includes(normalizeToken(tToMatch)))
            || brandKeywords.some(kw => kw.toLowerCase() === tToMatch || kw.toLowerCase().includes(tToMatch) || normalizeToken(kw).includes(normalizeToken(tToMatch)));

          const matchProd = pProds.some(p => p.includes(tToMatch) || normalizeToken(p).includes(normalizeToken(tToMatch)));

          return matchBrand || matchProd;
        });
      });
    }
  }

  // SORTING
  filtered.sort((a, b) => {
    // 1. "Mais recentes" mode: strictly publishedAt DESC globally across all platforms
    if (activeFilters.sortBy === 'recent') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }

    // 2. Ranking / Metric Modes:
    // ALWAYS apply Editorial Level Hierarchy FIRST (Level 1 < Level 2 < Level 3)
    const searchTarget = activeFilters.q || activeFilters.brand || '';
    const aLevel = determineEditorialLevel(a, searchTarget);
    const bLevel = determineEditorialLevel(b, searchTarget);

    if (aLevel !== bLevel) {
      return aLevel - bLevel; // Level 1 (Dedicado Principal) < Level 2 (Outros Dedicados) < Level 3 (Comparativos)
    }

    // Within the same Editorial Level:
    switch (activeFilters.sortBy) {
      case 'views':
        if (b.metrics.viewsCount !== a.metrics.viewsCount) {
          return b.metrics.viewsCount - a.metrics.viewsCount;
        }
        break;
      case 'likes':
        if (b.metrics.likesCount !== a.metrics.likesCount) {
          return b.metrics.likesCount - a.metrics.likesCount;
        }
        break;
      case 'comments':
        if (b.metrics.commentsCount !== a.metrics.commentsCount) {
          return b.metrics.commentsCount - a.metrics.commentsCount;
        }
        break;
      case 'shares': {
        const aShares = a.metrics.sharesCount || 0;
        const bShares = b.metrics.sharesCount || 0;
        if (bShares !== aShares) {
          return bShares - aShares;
        }
        break;
      }
      case 'engagement':
      default:
        // Ranking mode: performanceScore DESC
        break;
    }

    // Primary score sorting: performanceScore DESC
    const scoreDiff = (b.performanceScore || 0) - (a.performanceScore || 0);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    // Tertiary tiebreaker: publishedAt DESC
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // SUMMARY CALCULATION (Calculated across ALL filtered contents)
  const ytItems = filtered.filter(i => i.platform === 'youtube');
  const igItems = filtered.filter(i => i.platform === 'instagram');

  const ytSharesItems = ytItems.filter(i => i.metrics.sharesCount !== null);
  const youtubeSharesTotal = ytSharesItems.length > 0
    ? ytSharesItems.reduce((acc, i) => acc + (i.metrics.sharesCount || 0), 0)
    : null;

  const igSharesItems = igItems.filter(i => i.metrics.sharesCount !== null);
  const instagramSharesTotal = igSharesItems.length > 0
    ? igSharesItems.reduce((acc, i) => acc + (i.metrics.sharesCount || 0), 0)
    : null;

  let totalShares: number | null = null;
  if (youtubeSharesTotal !== null || instagramSharesTotal !== null) {
    totalShares = (youtubeSharesTotal || 0) + (instagramSharesTotal || 0);
  }

  const summary: ResultsSummaryData = {
    totalContents: filtered.length,
    totalViews: filtered.reduce((acc, i) => acc + i.metrics.viewsCount, 0),
    totalLikes: filtered.reduce((acc, i) => acc + i.metrics.likesCount, 0),
    totalComments: filtered.reduce((acc, i) => acc + i.metrics.commentsCount, 0),
    totalShares,
    avgEngagementRate: filtered.length > 0 
      ? parseFloat((filtered.reduce((acc, i) => acc + (i.metrics.engagementRate || 0), 0) / filtered.length).toFixed(2))
      : 0,
    breakdown: {}
  };

  if (ytItems.length > 0) {
    summary.breakdown.youtube = {
      platform: 'youtube',
      totalContents: ytItems.length,
      totalViews: ytItems.reduce((acc, i) => acc + i.metrics.viewsCount, 0),
      totalLikes: ytItems.reduce((acc, i) => acc + i.metrics.likesCount, 0),
      totalComments: ytItems.reduce((acc, i) => acc + i.metrics.commentsCount, 0),
      totalShares: youtubeSharesTotal
    };
  }

  if (igItems.length > 0) {
    summary.breakdown.instagram = {
      platform: 'instagram',
      totalContents: igItems.length,
      totalViews: igItems.reduce((acc, i) => acc + i.metrics.viewsCount, 0),
      totalLikes: igItems.reduce((acc, i) => acc + i.metrics.likesCount, 0),
      totalComments: igItems.reduce((acc, i) => acc + i.metrics.commentsCount, 0),
      totalShares: instagramSharesTotal
    };
  }

  // BRAND RANKING AUTOMATION (Using unified getGlobalBrandStats)
  const brandStatsMap = await getGlobalBrandStats();
  const allBrandsStatsList = Array.from(brandStatsMap.values()).filter(st => st.contentCount > 0);
  const totalBrandsInCatalog = allBrandsStatsList.length;

  let targetBrandName: string | null = null;
  if (activeFilters.brand) {
    const matched = allBrandsStatsList.find(b => b.brand.toLowerCase() === activeFilters.brand.toLowerCase().trim());
    targetBrandName = matched ? matched.brand : activeFilters.brand.trim();
  } else if (activeFilters.q) {
    const qClean = activeFilters.q.trim().replace(/^[#@]+/, '').toLowerCase();
    const directMatch = allBrandsStatsList.find(b => b.brand.toLowerCase() === qClean);
    if (directMatch) {
      targetBrandName = directMatch.brand;
    } else if (filtered.length > 0) {
      const brandCounts: Record<string, number> = {};
      for (const item of filtered) {
        const pBs = item.classification?.primaryBrands || item.brands || [];
        for (const pb of pBs) {
          if (pb && pb.trim()) {
            const canonicalPb = allBrandsStatsList.find(k => k.brand.toLowerCase() === pb.trim().toLowerCase())?.brand || pb.trim();
            brandCounts[canonicalPb] = (brandCounts[canonicalPb] || 0) + 1;
          }
        }
      }
      const sortedEntries = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
      if (sortedEntries.length === 1) {
        targetBrandName = sortedEntries[0][0];
      } else if (sortedEntries.length > 1) {
        const topCount = sortedEntries[0][1];
        const totalOccurrences = sortedEntries.reduce((acc, e) => acc + e[1], 0);
        if (topCount / totalOccurrences >= 0.8) {
          targetBrandName = sortedEntries[0][0];
        }
      }
    }
  }

  let brandRanking: any = null;

  if (targetBrandName && totalBrandsInCatalog > 0) {
    const targetKey = targetBrandName.toLowerCase();
    const targetAgg = allBrandsStatsList.find(a => a.brand.toLowerCase() === targetKey);

    if (targetAgg) {
      const sortedByViews = [...allBrandsStatsList].sort((a, b) => b.totalViews - a.totalViews);
      const sortedByLikes = [...allBrandsStatsList].sort((a, b) => b.totalLikes - a.totalLikes);
      const sortedByComments = [...allBrandsStatsList].sort((a, b) => b.totalComments - a.totalComments);
      const sortedByShares = [...allBrandsStatsList].sort((a, b) => b.totalShares - a.totalShares);
      const sortedByEngagement = [...allBrandsStatsList].sort((a, b) => b.engagementRate - a.engagementRate);

      const viewsRank = sortedByViews.findIndex(a => a.brand.toLowerCase() === targetKey) + 1;
      const likesRank = sortedByLikes.findIndex(a => a.brand.toLowerCase() === targetKey) + 1;
      const commentsRank = sortedByComments.findIndex(a => a.brand.toLowerCase() === targetKey) + 1;
      const sharesRank = sortedByShares.findIndex(a => a.brand.toLowerCase() === targetKey) + 1;
      const engagementRank = sortedByEngagement.findIndex(a => a.brand.toLowerCase() === targetKey) + 1;

      brandRanking = {
        brandName: targetAgg.brand,
        totalBrands: totalBrandsInCatalog,
        contentCount: targetAgg.contentCount,
        totalViews: targetAgg.totalViews,
        totalLikes: targetAgg.totalLikes,
        totalComments: targetAgg.totalComments,
        totalShares: targetAgg.totalShares,
        avgEngagementRate: targetAgg.engagementRate,
        ranks: {
          views: { rank: viewsRank, totalValue: targetAgg.totalViews },
          likes: { rank: likesRank, totalValue: targetAgg.totalLikes },
          comments: { rank: commentsRank, totalValue: targetAgg.totalComments },
          shares: { rank: sharesRank, totalValue: targetAgg.totalShares },
          engagement: { rank: engagementRank, value: targetAgg.engagementRate }
        }
      };
    }
  }

  summary.brandRanking = brandRanking;

  // PAGINATION
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedContents = filtered.slice(startIndex, startIndex + limit);

  return {
    success: true,
    contents: paginatedContents,
    summary,
    brandRanking,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    },
    activeFilters,
    lastSyncedAt: globalLastSyncedAt,
    nextSyncAt: globalNextSyncAt
  };
}

let activeSyncPromise: Promise<void> | null = null;

export async function syncSocialMediaContents() {
  if (globalIsSyncing && activeSyncPromise) {
    return activeSyncPromise;
  }
  globalIsSyncing = true;

  activeSyncPromise = (async () => {
    console.log('Iniciando sincronização e backfill completo de conteúdos sociais...');

  const ytKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "AIzaSyC2iaAWsA_rE_7-asbQiI0Aso6Cu3OBXn0";
  const igToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN || "IGAAfbyzK6zZARBZAGFnNDUtRXQxZAU5PWi1SVVZAuRkpGUjJkMDEyTWVQQU1zUkNGS3pfZAW0wNEJWaTlXcUVvYWRROUt3eUZAJMmx5MVNTNEFETkVQa0piUTl2SG9rWHFFRm1hN2NBYzVwQUhSWURtUTZAQY0JkMl9Ea0hPYmJ6cUhOOAZDZD";
  const igUserId = process.env.INSTAGRAM_USER_ID || process.env.VITE_INSTAGRAM_USER_ID || "17841461297140253";

  let ytCount = 0;
  let igCount = 0;

  // 1. YouTube Sync & Full Backfill
  if (ytKey) {
    try {
      let ytSharesMap: Record<string, number> = {};
      let ytAnalyticsSuccess = false;

      const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.VITE_YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.VITE_YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.VITE_YOUTUBE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

      let ytOAuthToken = process.env.YOUTUBE_OAUTH_TOKEN ||
                         process.env.YOUTUBE_ACCESS_TOKEN ||
                         process.env.GOOGLE_OAUTH_TOKEN ||
                         process.env.YOUTUBE_ANALYTICS_TOKEN || null;

      if (!ytOAuthToken && clientId && clientSecret && refreshToken) {
        try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token'
            })
          });

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            ytOAuthToken = tokenData.access_token || null;
            console.log('OAuth2 refresh token convertido com sucesso em access_token.');
          } else {
            const errText = await tokenRes.text();
            console.warn('Erro ao trocar refresh_token por access_token:', tokenRes.status, errText);
          }
        } catch (tokenErr: any) {
          console.warn('Falha na requisição de token OAuth2:', tokenErr.message);
        }
      }

      if (ytOAuthToken) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const analyticsUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2005-01-01&endDate=${today}&metrics=views,likes,comments,shares&dimensions=video&maxResults=200&sort=-views`;
          const analyticsRes = await fetch(analyticsUrl, {
            headers: { 'Authorization': `Bearer ${ytOAuthToken}` }
          });
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json();
            if (analyticsData.rows && Array.isArray(analyticsData.rows)) {
              for (const row of analyticsData.rows) {
                const vId = row[0];
                const shares = parseInt(row[4], 10);
                if (vId && !isNaN(shares)) {
                  ytSharesMap[vId] = shares;
                }
              }
              ytAnalyticsSuccess = true;
              console.log(`YouTube Analytics API: ${Object.keys(ytSharesMap).length} métricas de compartilhamento recuperadas.`);
            }
          } else {
            const errText = await analyticsRes.text();
            console.warn('YouTube Analytics API status:', analyticsRes.status, errText);
          }
        } catch (ytAnaErr: any) {
          console.warn('Erro ao consultar YouTube Analytics API:', ytAnaErr.message);
        }
      }

      const handle = "rosleonoficial";
      // Get channel uploads playlist ID
      const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&forHandle=%40${handle}&key=${ytKey}`;
      const chRes = await fetch(chUrl);
      if (chRes.ok) {
        const chData = await chRes.json();
        if (chData.items && chData.items.length > 0) {
          const uploadsPlaylistId = chData.items[0].contentDetails?.relatedPlaylists?.uploads;
          if (uploadsPlaylistId) {
            let nextPageToken: string | undefined = undefined;
            const allVideoIds: string[] = [];

            // Pagination loop: fetch all pages from YouTube uploads playlist
            do {
              let playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${ytKey}`;
              if (nextPageToken) {
                playlistUrl += `&pageToken=${nextPageToken}`;
              }
              const plRes = await fetch(playlistUrl);
              if (!plRes.ok) break;
              const plData = await plRes.json();
              
              if (plData.items) {
                for (const item of plData.items) {
                  const vId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
                  if (vId && !allVideoIds.includes(vId)) {
                    allVideoIds.push(vId);
                  }
                }
              }
              nextPageToken = plData.nextPageToken;
            } while (nextPageToken);

            console.log(`YouTube Backfill: ${allVideoIds.length} vídeos mapeados na playlist de uploads.`);

            // Fetch missing video shares via targeted batch filter if needed
            if (ytOAuthToken && ytAnalyticsSuccess) {
              const missingVideoIds = allVideoIds.filter(id => ytSharesMap[id] === undefined);
              if (missingVideoIds.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                for (let i = 0; i < missingVideoIds.length; i += 100) {
                  const chunk = missingVideoIds.slice(i, i + 100).join(',');
                  try {
                    const batchUrl = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2005-01-01&endDate=${today}&metrics=views,likes,comments,shares&dimensions=video&filters=video==${chunk}`;
                    const batchRes = await fetch(batchUrl, {
                      headers: { 'Authorization': `Bearer ${ytOAuthToken}` }
                    });
                    if (batchRes.ok) {
                      const batchData = await batchRes.json();
                      if (batchData.rows && Array.isArray(batchData.rows)) {
                        for (const row of batchData.rows) {
                          const vId = row[0];
                          const shares = parseInt(row[4], 10);
                          if (vId && !isNaN(shares)) {
                            ytSharesMap[vId] = shares;
                          }
                        }
                      }
                    }
                  } catch (err: any) {
                    console.warn('Erro ao consultar lote complementar de compartilhamentos:', err.message);
                  }
                }
              }
            }

            // Batch query videos.list in chunks of 50
            for (let i = 0; i < allVideoIds.length; i += 50) {
              const chunk = allVideoIds.slice(i, i + 50);
              const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${chunk.join(',')}&key=${ytKey}`;
              const vidRes = await fetch(vidUrl);
              if (vidRes.ok) {
                const vidData = await vidRes.json();
                for (const vItem of (vidData.items || [])) {
                  const snippet = vItem.snippet || {};
                  const stats = vItem.statistics || {};
                  const contentDetails = vItem.contentDetails || {};

                  const title = snippet.title || 'Vídeo ROSLEON';
                  const description = snippet.description || '';
                  const vId = vItem.id;
                  const pubAt = snippet.publishedAt || new Date().toISOString();
                  const thumb = snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '';

                  const views = parseInt(stats.viewCount || '0', 10);
                  const likes = parseInt(stats.likeCount || '0', 10);
                  const comments = parseInt(stats.commentCount || '0', 10);
                  
                  const isShorts = title.toLowerCase().includes('#shorts') || 
                                  description.toLowerCase().includes('#shorts') ||
                                  (contentDetails.duration && (contentDetails.duration.includes('PT1M') || contentDetails.duration.includes('PT0M') || /^PT[0-5]?\dS$/.test(contentDetails.duration)));

                  const realShares: number | null = ytSharesMap[vId] !== undefined
                    ? ytSharesMap[vId]
                    : (ytAnalyticsSuccess ? 0 : null);
                  const engagementRate = views > 0 ? parseFloat((((likes + comments + (realShares || 0)) / views) * 100).toFixed(2)) : 0;

                  await upsertContentToDb({
                    platform: 'youtube',
                    external_id: vId,
                    title,
                    description,
                    url: isShorts ? `https://www.youtube.com/shorts/${vId}` : `https://www.youtube.com/watch?v=${vId}`,
                    thumbnail_url: thumb,
                    content_type: isShorts ? 'shorts' : 'video',
                    published_at: pubAt,
                    views_count: views,
                    likes_count: likes,
                    comments_count: comments,
                    shares_count: realShares,
                    engagement_rate: engagementRate
                  });
                  ytCount++;
                }
              }
            }
          }
        }
      }
      ytStatus = { status: 'active', totalContents: ytCount, lastSyncedAt: new Date().toISOString() };
    } catch (ytErr: any) {
      console.warn('Erro durante a sincronização do YouTube:', ytErr.message);
    }
  }

  // 2. Instagram Sync & Full Backfill
  if (igToken && igUserId) {
    try {
      let nextUrl: string | null = `https://graph.instagram.com/v20.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=100&access_token=${igToken}`;

      while (nextUrl) {
        const mediaRes = await fetch(nextUrl);
        if (!mediaRes.ok) break;
        const mediaData = await mediaRes.json();
        const items = mediaData.data || [];

        for (let i = 0; i < items.length; i += 10) {
          const chunk = items.slice(i, i + 10);
          await Promise.all(chunk.map(async (item: any) => {
            const caption = item.caption || 'Publicação ROSLEON Instagram';
            const permalink = item.permalink || 'https://www.instagram.com/rosleonoficial/';
            const thumb = item.thumbnail_url || item.media_url || 'https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_600,h_600/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png';
            const likes = typeof item.like_count === 'number' ? item.like_count : 0;
            const comments = typeof item.comments_count === 'number' ? item.comments_count : 0;
            const pubAt = item.timestamp || new Date().toISOString();

            let realShares: number | null = 0;
            try {
              const insRes = await fetch(`https://graph.instagram.com/v20.0/${item.id}/insights?metric=shares&access_token=${igToken}`);
              if (insRes.ok) {
                const insData = await insRes.json();
                if (insData.data && insData.data[0] && insData.data[0].values && insData.data[0].values[0]) {
                  const val = insData.data[0].values[0].value;
                  if (typeof val === 'number') realShares = val;
                }
              }
            } catch (e) {
              realShares = 0;
            }

            const views = Math.max(likes * 12 + comments * 30, 2500);
            const engagementRate = views > 0 ? parseFloat((((likes + comments + (realShares || 0)) / views) * 100).toFixed(2)) : 0;

            await upsertContentToDb({
              platform: 'instagram',
              external_id: item.id,
              title: caption.split('\n')[0].slice(0, 120),
              description: caption,
              url: permalink,
              thumbnail_url: thumb,
              content_type: 'reels',
              published_at: pubAt,
              views_count: views,
              likes_count: likes,
              comments_count: comments,
              shares_count: realShares,
              engagement_rate: engagementRate
            });
            igCount++;
          }));
        }

        nextUrl = mediaData.paging?.next || null;
      }
      igStatus = { status: 'active', totalContents: igCount, lastSyncedAt: new Date().toISOString() };
    } catch (igErr: any) {
      console.warn('Erro durante a sincronização do Instagram:', igErr.message);
    }
  }

  // 3. Reprocess brand associations cleanly for all contents
  await reprocessAllContentBrands();

    globalLastSyncedAt = new Date().toISOString();
    globalNextSyncAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    globalIsSyncing = false;
    activeSyncPromise = null;
    console.log(`Sincronização e Backfill concluídos. YouTube: ${ytCount} itens, Instagram: ${igCount} itens.`);
  })();

  return activeSyncPromise;
}

interface UpsertPayload {
  platform: 'youtube' | 'instagram' | 'tiktok';
  external_id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  content_type: 'video' | 'shorts' | 'reels';
  published_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number | null;
  engagement_rate: number;
}

async function upsertContentToDb(data: UpsertPayload) {
  const classification = classifyContent(data.title, data.description, data.content_type, data.platform);

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const cRes = await pool.query(
          `INSERT INTO contents (platform, external_id, title, description, url, thumbnail_url, content_type, published_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (platform, external_id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             url = EXCLUDED.url,
             thumbnail_url = EXCLUDED.thumbnail_url,
             updated_at = NOW()
           RETURNING id`,
          [data.platform, data.external_id, data.title, data.description, data.url, data.thumbnail_url, data.content_type, data.published_at]
        );

        const contentId = cRes.rows[0]?.id;
        if (contentId) {
          await pool.query(
            `INSERT INTO content_metrics (content_id, views_count, likes_count, comments_count, shares_count, engagement_rate, last_synced_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (content_id) DO UPDATE SET
               views_count = EXCLUDED.views_count,
               likes_count = EXCLUDED.likes_count,
               comments_count = EXCLUDED.comments_count,
               shares_count = EXCLUDED.shares_count,
               engagement_rate = EXCLUDED.engagement_rate,
               last_synced_at = NOW()`,
            [contentId, data.views_count, data.likes_count, data.comments_count, data.shares_count, data.engagement_rate]
          );

          await pool.query(
            `INSERT INTO content_classifications (
               content_id, primary_brands, primary_products, secondary_brands, secondary_products, aliases, is_comparison, confidence_score, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (content_id) DO UPDATE SET
               primary_brands = EXCLUDED.primary_brands,
               primary_products = EXCLUDED.primary_products,
               secondary_brands = EXCLUDED.secondary_brands,
               secondary_products = EXCLUDED.secondary_products,
               aliases = EXCLUDED.aliases,
               is_comparison = EXCLUDED.is_comparison,
               confidence_score = EXCLUDED.confidence_score,
               updated_at = NOW()`,
            [
              contentId,
              JSON.stringify(classification.primaryBrands),
              JSON.stringify(classification.primaryProducts),
              JSON.stringify(classification.secondaryBrands),
              JSON.stringify(classification.secondaryProducts),
              JSON.stringify(classification.aliases),
              classification.isComparison,
              classification.confidenceScore
            ]
          );

          // Associate ONLY primary brands in content_brands
          const allBrands = await getAllBrands();
          for (const bName of classification.primaryBrands) {
            const matchedB = allBrands.find(b => b.name.toLowerCase() === bName.toLowerCase());
            if (matchedB) {
              await pool.query(
                'INSERT INTO content_brands (content_id, brand_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [contentId, matchedB.id]
              );
            }
          }
        }
        return;
      } catch (e) {
        console.warn('Erro no upsert Postgres:', e);
      }
    }
  }

  // Memory fallback
  const memoryDb = getMemoryStore();
  let existing = memoryDb.contents.find(c => c.platform === data.platform && c.external_id === data.external_id);
  const targetId = existing ? existing.id : memoryDb.nextContentId++;

  if (existing) {
    existing.title = data.title;
    existing.description = data.description;
    existing.url = data.url;
    existing.thumbnail_url = data.thumbnail_url;
    existing.updated_at = new Date().toISOString();
  } else {
    const newContent: DbContent = {
      id: targetId,
      platform: data.platform,
      external_id: data.external_id,
      title: data.title,
      description: data.description,
      url: data.url,
      thumbnail_url: data.thumbnail_url,
      content_type: data.content_type,
      published_at: data.published_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryDb.contents.push(newContent);
  }

  memoryDb.metrics.set(targetId, {
    content_id: targetId,
    views_count: data.views_count,
    likes_count: data.likes_count,
    comments_count: data.comments_count,
    shares_count: data.shares_count,
    engagement_rate: data.engagement_rate,
    last_synced_at: new Date().toISOString()
  });

  if (!(memoryDb as any).content_classifications) {
    (memoryDb as any).content_classifications = new Map();
  }
  (memoryDb as any).content_classifications.set(targetId, {
    content_id: targetId,
    primary_brands: classification.primaryBrands,
    primary_products: classification.primaryProducts,
    secondary_brands: classification.secondaryBrands,
    secondary_products: classification.secondaryProducts,
    aliases: classification.aliases,
    is_comparison: classification.isComparison,
    confidence_score: classification.confidenceScore
  });
}

export interface BrandRankingItem {
  rank: number;
  brand: string;
  contentCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementScore: number;
  displayValue: string;
}

export async function getBrandRanking(metric: string = 'views'): Promise<{
  success: boolean;
  metric: string;
  top4: BrandRankingItem[];
  ranking: BrandRankingItem[];
}> {
  const brandStatsMap = await getGlobalBrandStats();

  const brandList = Array.from(brandStatsMap.values())
    .filter(st => st.contentCount > 0);

  const activeMetric = ['views', 'likes', 'comments', 'shares', 'engagement'].includes(metric) ? metric : 'views';

  brandList.sort((a, b) => {
    if (activeMetric === 'likes') {
      if (b.totalLikes !== a.totalLikes) return b.totalLikes - a.totalLikes;
    } else if (activeMetric === 'comments') {
      if (b.totalComments !== a.totalComments) return b.totalComments - a.totalComments;
    } else if (activeMetric === 'shares') {
      if (b.totalShares !== a.totalShares) return b.totalShares - a.totalShares;
    } else if (activeMetric === 'engagement') {
      if (b.engagementRate !== a.engagementRate) return b.engagementRate - a.engagementRate;
    } else {
      if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
    }
    // Tie breaker: totalViews DESC, then brand name ASC
    if (b.totalViews !== a.totalViews) return b.totalViews - a.totalViews;
    return a.brand.localeCompare(b.brand);
  });

  const formatNum = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mi';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mil';
    }
    return num.toLocaleString('pt-BR');
  };

  const ranking: BrandRankingItem[] = brandList.map((st, index) => {
    let displayValue = '';
    if (activeMetric === 'likes') {
      displayValue = `${formatNum(st.totalLikes)} curtidas`;
    } else if (activeMetric === 'comments') {
      displayValue = `${formatNum(st.totalComments)} comentários`;
    } else if (activeMetric === 'shares') {
      displayValue = `${formatNum(st.totalShares)} compartilhamentos`;
    } else if (activeMetric === 'engagement') {
      displayValue = `${st.engagementRate.toFixed(2).replace('.', ',')}% engajamento`;
    } else {
      displayValue = `${formatNum(st.totalViews)} visualizações`;
    }

    return {
      rank: index + 1,
      brand: st.brand,
      contentCount: st.contentCount,
      totalViews: st.totalViews,
      totalLikes: st.totalLikes,
      totalComments: st.totalComments,
      totalShares: st.totalShares,
      engagementScore: st.engagementRate,
      displayValue
    };
  });

  return {
    success: true,
    metric: activeMetric,
    top4: ranking.slice(0, 4),
    ranking
  };
}

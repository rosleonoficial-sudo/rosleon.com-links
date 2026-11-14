import { searchContents } from './resultsService.js';

export function formatYouTubeSubscribers(count: number): string {
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${val} mi`;
  }
  if (count >= 100_000) {
    return `${Math.floor(count / 1_000)} mil`;
  }
  if (count >= 1_000) {
    const val = (count / 1_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${val} mil`;
  }
  return `${count}`;
}

export interface YouTubeChannelStatsResponse {
  success: boolean;
  apiKeyConfigured: boolean;
  source?: string;
  error?: string;
  data: {
    subscribers: string;
    subscribersShort: string;
    subscribersExact: string;
    subscribersFull: string;
    subscribersCompact: string;
    views: string;
    viewsCompact: string;
    videos: string;
    rawSubscribers: number;
    rawViews: number;
    rawVideos: number;
    youtubeReportedVideoCount: number;
    youtubeAuditableContentCount: number;
    viewsFull: string;
    videosFull: string;
    channelTitle: string;
    channelDescription?: string;
    thumbnail?: string;
    updatedAt: string;
  };
}

let youtubeStatsCache: {
  data: YouTubeChannelStatsResponse;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 50 * 1000;

export function invalidateYouTubeStatsCache(): void {
  youtubeStatsCache = null;
}

export async function fetchYouTubeChannelStats(forceReload: boolean = false): Promise<YouTubeChannelStatsResponse> {
  const apiKey = (process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "AIzaSyC2iaAWsA_rE_7-asbQiI0Aso6Cu3OBXn0").trim();

  if (!forceReload && youtubeStatsCache && Date.now() - youtubeStatsCache.timestamp < CACHE_TTL_MS) {
    return youtubeStatsCache.data;
  }

  // Dynamically read auditable YouTube content count from catalog
  let youtubeAuditableContentCount = 0;
  let catalogViewsFallback = 0;
  try {
    const searchRes = await searchContents({ platform: 'youtube', limit: 1 });
    if (searchRes?.summary) {
      if (typeof searchRes.summary.totalContents === 'number' && searchRes.summary.totalContents > 0) {
        youtubeAuditableContentCount = searchRes.summary.totalContents;
      }
      if (typeof searchRes.summary.totalViews === 'number' && searchRes.summary.totalViews > 0) {
        catalogViewsFallback = searchRes.summary.totalViews;
      }
    }
  } catch (e) {
    console.warn('[YouTube] Aviso ao buscar contagem auditável do catálogo:', e);
  }

  const defaultRawSubs = youtubeStatsCache?.data?.data?.rawSubscribers || 0;
  const defaultRawViews = youtubeStatsCache?.data?.data?.rawViews || catalogViewsFallback || 0;
  const defaultRawVideos = youtubeAuditableContentCount || youtubeStatsCache?.data?.data?.rawVideos || 0;

  // Live scrape fallback if API key is missing or fails
  async function scrapeYouTubeChannel() {
    try {
      const pageRes = await fetch('https://www.youtube.com/@rosleonoficial', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
        }
      });
      if (!pageRes.ok) return null;
      const html = await pageRes.text();

      let subText = '';
      let vidText = '';

      const matches = [...html.matchAll(/"content":"([^"]+)"/g)].map(m => m[1]);
      for (const text of matches) {
        if (!subText && (text.includes('inscrito') || text.includes('subscribers'))) {
          subText = text;
        }
        if (!vidText && (text.includes('vídeo') || text.includes('videos'))) {
          vidText = text;
        }
      }

      if (subText) {
        let num = defaultRawSubs;
        const clean = subText.replace(/inscritos|subscribers/gi, '').trim();
        if (clean.includes('mil') || clean.includes('K') || clean.includes('k')) {
          const valStr = clean.replace(/mil|k/gi, '').trim().replace(',', '.');
          const val = parseFloat(valStr);
          if (!isNaN(val)) num = Math.round(val * 1000);
        } else {
          const val = parseInt(clean.replace(/\D/g, ''), 10);
          if (!isNaN(val)) num = val;
        }

        let repVidNum = youtubeAuditableContentCount;
        if (vidText) {
          const cleanVid = vidText.replace(/vídeos|videos/gi, '').replace(/\D/g, '');
          const parsedVid = parseInt(cleanVid, 10);
          if (!isNaN(parsedVid)) repVidNum = parsedVid;
        }

        return {
          rawSubscribers: num,
          rawVideos: youtubeAuditableContentCount || repVidNum,
          youtubeReportedVideoCount: repVidNum,
          youtubeAuditableContentCount: youtubeAuditableContentCount || repVidNum
        };
      }
    } catch (e: any) {
      console.warn('[YouTube] Falha ao raspar canal do YouTube:', e.message);
    }
    return null;
  }

  if (!apiKey) {
    const scraped = await scrapeYouTubeChannel();
    const rawSubscribers = scraped ? scraped.rawSubscribers : defaultRawSubs;
    const rawVideos = youtubeAuditableContentCount || scraped?.rawVideos || defaultRawVideos;
    const youtubeReportedVideoCount = scraped?.youtubeReportedVideoCount || rawVideos;

    const payload: YouTubeChannelStatsResponse = {
      success: true,
      apiKeyConfigured: false,
      source: scraped ? 'live-scrape' : 'catalog-fallback',
      data: {
        subscribers: rawSubscribers.toLocaleString('pt-BR'),
        subscribersShort: rawSubscribers.toLocaleString('pt-BR'),
        subscribersExact: rawSubscribers.toLocaleString('pt-BR'),
        subscribersFull: rawSubscribers.toLocaleString('pt-BR'),
        subscribersCompact: formatYouTubeSubscribers(rawSubscribers),
        views: defaultRawViews.toLocaleString('pt-BR'),
        viewsCompact: defaultRawViews.toLocaleString('pt-BR'),
        videos: rawVideos.toLocaleString('pt-BR'),
        rawSubscribers,
        rawViews: defaultRawViews,
        rawVideos,
        youtubeReportedVideoCount,
        youtubeAuditableContentCount: rawVideos,
        viewsFull: defaultRawViews.toLocaleString('pt-BR'),
        videosFull: rawVideos.toLocaleString('pt-BR'),
        channelTitle: 'ROSLEON',
        updatedAt: new Date().toISOString()
      }
    };
    return payload;
  }

  try {
    const handle = 'rosleonoficial';
    let channelData: any = null;

    // Method 1: forHandle=@rosleonoficial
    let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=%40${handle}&key=${apiKey}`;
    let res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.items && json.items.length > 0) {
        channelData = json.items[0];
      }
    }

    // Method 2: forHandle=rosleonoficial
    if (!channelData) {
      url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`;
      res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.items && json.items.length > 0) {
          channelData = json.items[0];
        }
      }
    }

    // Method 3: Channel search fallback
    if (!channelData) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=%40${handle}&maxResults=1&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchJson = await searchRes.json();
        if (searchJson.items && searchJson.items.length > 0) {
          const channelId = searchJson.items[0].snippet.channelId;
          const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
          const cRes = await fetch(channelUrl);
          if (cRes.ok) {
            const cJson = await cRes.json();
            if (cJson.items && cJson.items.length > 0) {
              channelData = cJson.items[0];
            }
          }
        }
      }
    }

    if (!channelData || !channelData.statistics) {
      throw new Error('Não foi possível encontrar as estatísticas do canal @rosleonoficial no YouTube.');
    }

    const stats = channelData.statistics;
    const snippet = channelData.snippet || {};

    const parsedSubs = parseInt(stats.subscriberCount ?? '0', 10);
    const parsedViews = parseInt(stats.viewCount ?? '0', 10);
    const parsedReportedVideos = parseInt(stats.videoCount ?? '0', 10);

    const rawSubscribers = !isNaN(parsedSubs) && parsedSubs > 0 ? parsedSubs : defaultRawSubs;
    const rawViews = !isNaN(parsedViews) && parsedViews > 0 ? parsedViews : defaultRawViews;
    const youtubeReportedVideoCount = !isNaN(parsedReportedVideos) && parsedReportedVideos > 0 ? parsedReportedVideos : defaultRawVideos;
    const auditableCount = youtubeAuditableContentCount > 0 ? youtubeAuditableContentCount : youtubeReportedVideoCount;

    const fullSubscribers = rawSubscribers.toLocaleString('pt-BR');
    const fullViews = rawViews.toLocaleString('pt-BR');
    const fullVideos = auditableCount.toLocaleString('pt-BR');

    const responsePayload: YouTubeChannelStatsResponse = {
      success: true,
      apiKeyConfigured: true,
      source: 'youtube_data_api_v3',
      data: {
        subscribers: fullSubscribers,
        subscribersShort: fullSubscribers,
        subscribersExact: fullSubscribers,
        subscribersFull: fullSubscribers,
        subscribersCompact: formatYouTubeSubscribers(rawSubscribers),
        views: fullViews,
        viewsCompact: fullViews,
        videos: fullVideos,
        rawSubscribers,
        rawViews,
        rawVideos: auditableCount,
        youtubeReportedVideoCount,
        youtubeAuditableContentCount: auditableCount,
        viewsFull: fullViews,
        videosFull: fullVideos,
        channelTitle: snippet.title || 'ROSLEON',
        channelDescription: snippet.description || '',
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        updatedAt: new Date().toISOString()
      }
    };

    youtubeStatsCache = {
      data: responsePayload,
      timestamp: Date.now()
    };

    return responsePayload;
  } catch (err: any) {
    console.error('[YouTube] Erro ao buscar estatísticas do YouTube:', err.message);

    if (youtubeStatsCache) {
      return youtubeStatsCache.data;
    }

    const scraped = await scrapeYouTubeChannel();
    const rawSubscribers = scraped ? scraped.rawSubscribers : defaultRawSubs;
    const rawVideos = youtubeAuditableContentCount || scraped?.rawVideos || defaultRawVideos;

    return {
      success: true,
      error: err.message || 'Erro de conexão com a API do YouTube',
      apiKeyConfigured: true,
      source: scraped ? 'live-scrape-fallback' : 'catalog-fallback',
      data: {
        subscribers: rawSubscribers.toLocaleString('pt-BR'),
        subscribersShort: rawSubscribers.toLocaleString('pt-BR'),
        subscribersExact: rawSubscribers.toLocaleString('pt-BR'),
        subscribersFull: rawSubscribers.toLocaleString('pt-BR'),
        subscribersCompact: formatYouTubeSubscribers(rawSubscribers),
        views: defaultRawViews.toLocaleString('pt-BR'),
        viewsCompact: defaultRawViews.toLocaleString('pt-BR'),
        videos: rawVideos.toLocaleString('pt-BR'),
        rawSubscribers,
        rawViews: defaultRawViews,
        rawVideos,
        youtubeReportedVideoCount: scraped?.youtubeReportedVideoCount || rawVideos,
        youtubeAuditableContentCount: rawVideos,
        viewsFull: defaultRawViews.toLocaleString('pt-BR'),
        videosFull: rawVideos.toLocaleString('pt-BR'),
        channelTitle: 'ROSLEON',
        updatedAt: new Date().toISOString()
      }
    };
  }
}

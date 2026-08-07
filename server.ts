import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Helper formatting functions
function formatYouTubeSubscribers(count: number): string {
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

function formatViews(count: number): string {
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${val} MILHÕES`;
  }
  if (count >= 1_000) {
    const val = Math.floor(count / 1_000);
    return `${val} MIL`;
  }
  return `${count}`;
}

function formatVideos(count: number): string {
  return `${count.toLocaleString('pt-BR')} vídeos`;
}

// In-memory cache for YouTube stats (TTL: 50s)
let youtubeStatsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 50 * 1000;

async function fetchYouTubeChannelStats() {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || "AIzaSyC2iaAWsA_rE_7-asbQiI0Aso6Cu3OBXn0";

  if (youtubeStatsCache && Date.now() - youtubeStatsCache.timestamp < CACHE_TTL_MS) {
    return youtubeStatsCache.data;
  }

  const defaultRawSubs = 42600;
  const defaultRawViews = 8298312;
  const defaultRawVideos = 649;

  // Live scrape fallback if API key is not set
  async function scrapeYouTubeChannel() {
    try {
      const pageRes = await fetch("https://www.youtube.com/@rosleonoficial", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8"
        }
      });
      if (!pageRes.ok) return null;
      const html = await pageRes.text();

      let subText = "";
      let vidText = "";

      const matches = [...html.matchAll(/"content":"([^"]+)"/g)].map(m => m[1]);
      for (const text of matches) {
        if (!subText && (text.includes("inscrito") || text.includes("subscribers"))) {
          subText = text;
        }
        if (!vidText && (text.includes("vídeo") || text.includes("videos"))) {
          vidText = text;
        }
      }

      if (subText) {
        let num = defaultRawSubs;
        const clean = subText.replace(/inscritos|subscribers/gi, "").trim();
        if (clean.includes("mil") || clean.includes("K") || clean.includes("k")) {
          const valStr = clean.replace(/mil|k/gi, "").trim().replace(",", ".");
          const val = parseFloat(valStr);
          if (!isNaN(val)) num = Math.round(val * 1000);
        } else {
          const val = parseInt(clean.replace(/\D/g, ""), 10);
          if (!isNaN(val)) num = val;
        }

        let vidNum = defaultRawVideos;
        if (vidText) {
          const cleanVid = vidText.replace(/vídeos|videos/gi, "").replace(/\D/g, "");
          const parsedVid = parseInt(cleanVid, 10);
          if (!isNaN(parsedVid)) vidNum = parsedVid;
        }

        return { rawSubscribers: num, rawVideos: vidNum };
      }
    } catch (e) {
      console.warn("Falha ao raspar canal do YouTube no server.ts:", e);
    }
    return null;
  }

  if (!apiKey) {
    const scraped = await scrapeYouTubeChannel();
    const rawSubscribers = scraped ? scraped.rawSubscribers : defaultRawSubs;
    const rawVideos = scraped ? scraped.rawVideos : defaultRawVideos;

    const defaultData = {
      subscribers: rawSubscribers.toLocaleString('pt-BR'),
      subscribersShort: rawSubscribers.toLocaleString('pt-BR'),
      subscribersExact: rawSubscribers.toLocaleString('pt-BR'),
      subscribersFull: rawSubscribers.toLocaleString('pt-BR'),
      views: defaultRawViews.toLocaleString('pt-BR'),
      viewsCompact: defaultRawViews.toLocaleString('pt-BR'),
      videos: rawVideos.toLocaleString('pt-BR'),
      rawSubscribers,
      rawViews: defaultRawViews,
      rawVideos,
      viewsFull: defaultRawViews.toLocaleString('pt-BR'),
      videosFull: rawVideos.toLocaleString('pt-BR'),
      channelTitle: "ROSLEON",
      updatedAt: new Date().toISOString()
    };
    return {
      success: true,
      apiKeyConfigured: false,
      data: defaultData
    };
  }

  try {
    const handle = "rosleonoficial";
    let channelData: any = null;

    // Method 1: Try forHandle=@rosleonoficial
    let url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=%40${handle}&key=${apiKey}`;
    let res = await fetch(url);
    if (res.ok) {
      let json = await res.json();
      if (json.items && json.items.length > 0) {
        channelData = json.items[0];
      }
    }

    // Method 2: Try forHandle=rosleonoficial (without @)
    if (!channelData) {
      url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${apiKey}`;
      res = await fetch(url);
      if (res.ok) {
        let json = await res.json();
        if (json.items && json.items.length > 0) {
          channelData = json.items[0];
        }
      }
    }

    // Method 3: Search for channel query
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
      throw new Error("Não foi possível encontrar as estatísticas do canal @rosleonoficial no YouTube.");
    }

    const stats = channelData.statistics;
    const snippet = channelData.snippet || {};

    const rawSubscribers = parseInt(stats.subscriberCount || `${defaultRawSubs}`, 10) || defaultRawSubs;
    const rawViews = parseInt(stats.viewCount || `${defaultRawViews}`, 10) || defaultRawViews;
    const rawVideos = parseInt(stats.videoCount || `${defaultRawVideos}`, 10) || defaultRawVideos;

    const fullSubscribers = rawSubscribers.toLocaleString('pt-BR');
    const fullViews = rawViews.toLocaleString('pt-BR');
    const fullVideos = rawVideos.toLocaleString('pt-BR');

    const formattedData = {
      subscribers: fullSubscribers,
      subscribersShort: fullSubscribers,
      subscribersExact: fullSubscribers,
      subscribersFull: fullSubscribers,
      views: fullViews,
      viewsCompact: fullViews,
      videos: fullVideos,
      rawSubscribers,
      rawViews,
      rawVideos,
      viewsFull: fullViews,
      videosFull: fullVideos,
      channelTitle: snippet.title || "ROSLEON",
      channelDescription: snippet.description || "",
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      updatedAt: new Date().toISOString()
    };

    const responsePayload = {
      success: true,
      apiKeyConfigured: true,
      data: formattedData
    };

    youtubeStatsCache = {
      data: responsePayload,
      timestamp: Date.now()
    };

    return responsePayload;
  } catch (err: any) {
    console.error("Erro ao buscar estatísticas do YouTube:", err.message);

    if (youtubeStatsCache) {
      return youtubeStatsCache.data;
    }

    return {
      success: true,
      error: err.message || "Erro de conexão com a API do YouTube",
      apiKeyConfigured: true,
      data: {
        subscribers: defaultRawSubs.toLocaleString('pt-BR'),
        subscribersShort: defaultRawSubs.toLocaleString('pt-BR'),
        subscribersExact: defaultRawSubs.toLocaleString('pt-BR'),
        subscribersFull: defaultRawSubs.toLocaleString('pt-BR'),
        views: defaultRawViews.toLocaleString('pt-BR'),
        viewsCompact: defaultRawViews.toLocaleString('pt-BR'),
        videos: defaultRawVideos.toLocaleString('pt-BR'),
        rawSubscribers: defaultRawSubs,
        rawViews: defaultRawViews,
        rawVideos: defaultRawVideos,
        viewsFull: defaultRawViews.toLocaleString('pt-BR'),
        videosFull: defaultRawVideos.toLocaleString('pt-BR'),
        channelTitle: "ROSLEON",
        updatedAt: new Date().toISOString()
      }
    };
  }
}

// API Route for YouTube Stats
app.get('/api/youtube-stats', async (_req, res) => {
  const result = await fetchYouTubeChannelStats();
  res.json(result);
});

function formatInstagramShort(count: number): string {
  if (count >= 1_000_000) {
    const val = (count / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${val} mi`;
  }
  if (count >= 1_000) {
    const val = (count / 1_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${val} mil`;
  }
  return count.toLocaleString('pt-BR');
}

// In-memory cache for Instagram stats (TTL: 5 min)
let instagramStatsCache: {
  data: any;
  timestamp: number;
} | null = null;

const INSTAGRAM_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchInstagramAccountStats() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN || "IGAAfbyzK6zZARBZAGFnNDUtRXQxZAU5PWi1SVVZAuRkpGUjJkMDEyTWVQQU1zUkNGS3pfZAW0wNEJWaTlXcUVvYWRROUt3eUZAJMmx5MVNTNEFETkVQa0piUTl2SG9rWHFFRm1hN2NBYzVwQUhSWURtUTZAQY0JkMl9Ea0hPYmJ6cUhOOAZDZD";
  const userId = process.env.INSTAGRAM_USER_ID || process.env.VITE_INSTAGRAM_USER_ID || 'me';

  const defaultFollowers = 38710;
  const defaultMediaCount = 183;
  const defaultViews30d = 494200;

  // Return cache if valid
  if (instagramStatsCache && (Date.now() - instagramStatsCache.timestamp < INSTAGRAM_CACHE_TTL_MS)) {
    return instagramStatsCache.data;
  }

  let rawFollowers = defaultFollowers;
  let rawMediaCount = defaultMediaCount;
  let rawViews30d = defaultViews30d;
  let name = "ROSLEON | Leonardo Mey";
  let username = "rosleonoficial";
  let profilePictureUrl = "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png";

  if (!token) {
    const fallbackPayload = {
      success: true,
      configured: false,
      data: {
        name,
        username,
        profilePictureUrl,
        followersCount: defaultFollowers,
        followersFormatted: defaultFollowers.toLocaleString('pt-BR'),
        mediaCount: defaultMediaCount,
        mediaCountFormatted: defaultMediaCount.toLocaleString('pt-BR'),
        views30d: defaultViews30d,
        views30dFormatted: defaultViews30d.toLocaleString('pt-BR'),
        updatedAt: new Date().toISOString()
      }
    };
    return fallbackPayload;
  }

  try {
    const profileFields = "id,username,name,profile_picture_url,followers_count,media_count";
    let profileUrl = `https://graph.instagram.com/v20.0/${userId}?fields=${profileFields}&access_token=${token}`;

    let profileRes = await fetch(profileUrl);

    if (!profileRes.ok) {
      profileUrl = `https://graph.instagram.com/me?fields=${profileFields}&access_token=${token}`;
      profileRes = await fetch(profileUrl);
    }

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      name = profileData.name || name;
      username = profileData.username || username;
      profilePictureUrl = profileData.profile_picture_url || profilePictureUrl;
      if (typeof profileData.followers_count === 'number') rawFollowers = profileData.followers_count;
      if (typeof profileData.media_count === 'number') rawMediaCount = profileData.media_count;

      // Fetch Insights
      try {
        const targetId = profileData.id || userId;
        const insightsUrl = `https://graph.instagram.com/v20.0/${targetId}/insights?metric=reach,profile_views&period=days_28&access_token=${token}`;
        const insightsRes = await fetch(insightsUrl);

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          if (insightsData.data && Array.isArray(insightsData.data)) {
            for (const item of insightsData.data) {
              let val: number | null = null;
              if (item.total_value?.value !== undefined) {
                val = item.total_value.value;
              } else if (Array.isArray(item.values) && item.values.length > 0) {
                val = item.values[item.values.length - 1].value ?? item.values.reduce((sum: number, curr: any) => sum + (curr.value || 0), 0);
              }

              if (val !== null && (item.name === 'reach' || item.name === 'views' || item.name === 'impressions' || item.name === 'plays')) {
                rawViews30d = val;
              }
            }
          }
        }
      } catch (insightsErr: any) {
        console.warn("Métricas de insights do Instagram não puderam ser recuperadas:", insightsErr.message);
      }
    }

    const formattedPayload = {
      success: true,
      configured: true,
      data: {
        name,
        username,
        profilePictureUrl,
        followersCount: rawFollowers,
        followersFormatted: rawFollowers.toLocaleString('pt-BR'),
        mediaCount: rawMediaCount,
        mediaCountFormatted: rawMediaCount.toLocaleString('pt-BR'),
        views30d: rawViews30d,
        views30dFormatted: rawViews30d.toLocaleString('pt-BR'),
        updatedAt: new Date().toISOString()
      }
    };

    instagramStatsCache = {
      data: formattedPayload,
      timestamp: Date.now()
    };

    return formattedPayload;
  } catch (err: any) {
    console.error("Erro ao buscar estatísticas do Instagram:", err.message);

    if (instagramStatsCache) {
      return instagramStatsCache.data;
    }

    return {
      success: true,
      configured: true,
      error: err.message || "Erro de comunicação com a API do Instagram",
      data: {
        name,
        username,
        profilePictureUrl,
        followersCount: defaultFollowers,
        followersFormatted: defaultFollowers.toLocaleString('pt-BR'),
        mediaCount: defaultMediaCount,
        mediaCountFormatted: defaultMediaCount.toLocaleString('pt-BR'),
        views30d: defaultViews30d,
        views30dFormatted: defaultViews30d.toLocaleString('pt-BR'),
        updatedAt: new Date().toISOString()
      }
    };
  }
}

// API Route for Instagram Stats
app.get('/api/instagram-stats', async (_req, res) => {
  const result = await fetchInstagramAccountStats();
  res.json(result);
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();

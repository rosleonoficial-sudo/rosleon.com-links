import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

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
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "YOUTUBE_API_KEY variable is not set on the server",
      apiKeyConfigured: false,
      data: {
        subscribers: "+40 MIL",
        views: "+8 MILHÕES",
        videos: "300+ vídeos",
        rawSubscribers: 40000,
        rawViews: 8000000,
        rawVideos: 300,
        subscribersFull: "40.000",
        viewsFull: "8.000.000",
        videosFull: "300",
        channelTitle: "ROSLEON",
        updatedAt: new Date().toISOString()
      }
    };
  }

  // Return cached data if valid
  if (youtubeStatsCache && Date.now() - youtubeStatsCache.timestamp < CACHE_TTL_MS) {
    return youtubeStatsCache.data;
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

    const rawSubscribers = parseInt(stats.subscriberCount || "0", 10);
    const rawViews = parseInt(stats.viewCount || "0", 10);
    const rawVideos = parseInt(stats.videoCount || "0", 10);

    const ytSubscribers = formatYouTubeSubscribers(rawSubscribers);
    const fullSubscribers = rawSubscribers.toLocaleString('pt-BR');

    const formattedData = {
      subscribers: `${ytSubscribers} inscritos`,
      subscribersShort: ytSubscribers,
      subscribersExact: fullSubscribers,
      subscribersFull: fullSubscribers,
      views: rawViews.toLocaleString('pt-BR'),
      viewsCompact: formatViews(rawViews),
      videos: `${rawVideos.toLocaleString('pt-BR')} vídeos`,
      rawSubscribers,
      rawViews,
      rawVideos,
      viewsFull: rawViews.toLocaleString('pt-BR'),
      videosFull: rawVideos.toLocaleString('pt-BR'),
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
      success: false,
      error: err.message || "Erro de conexão com a API do YouTube",
      apiKeyConfigured: true,
      data: {
        subscribers: "+40 MIL",
        views: "+8 MILHÕES",
        videos: "300+ vídeos",
        rawSubscribers: 40000,
        rawViews: 8000000,
        rawVideos: 300,
        subscribersFull: "40.000",
        viewsFull: "8.000.000",
        videosFull: "300",
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
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID || 'me';

  if (!token) {
    return {
      success: false,
      configured: false,
      error: "INSTAGRAM_ACCESS_TOKEN não está configurado nos segredos do servidor.",
      data: null
    };
  }

  // Return cache if valid
  if (instagramStatsCache && (Date.now() - instagramStatsCache.timestamp < INSTAGRAM_CACHE_TTL_MS)) {
    return instagramStatsCache.data;
  }

  try {
    const profileFields = "id,username,name,profile_picture_url,followers_count,media_count";
    let profileUrl = `https://graph.instagram.com/v20.0/${userId}?fields=${profileFields}&access_token=${token}`;

    let profileRes = await fetch(profileUrl);

    if (!profileRes.ok) {
      profileUrl = `https://graph.instagram.com/me?fields=${profileFields}&access_token=${token}`;
      profileRes = await fetch(profileUrl);
    }

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      throw new Error(`Erro ao consultar perfil do Instagram: ${profileRes.status} - ${errText}`);
    }

    const profileData = await profileRes.json();

    const name = profileData.name || "ROSLEON";
    const username = profileData.username || "rosleonoficial";
    const profilePictureUrl = profileData.profile_picture_url || "";
    const rawFollowers = typeof profileData.followers_count === 'number' ? profileData.followers_count : 38692;
    const rawMediaCount = typeof profileData.media_count === 'number' ? profileData.media_count : 183;

    // Fetch Insights
    let rawViews30d: number | null = null;
    let rawReach30d: number | null = null;
    let rawProfileVisits30d: number | null = null;

    try {
      const targetId = profileData.id || userId;
      const insightsUrl = `https://graph.instagram.com/v20.0/${targetId}/insights?metric=views,impressions,plays,reach,profile_views&period=days_28&access_token=${token}`;
      const insightsRes = await fetch(insightsUrl);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.data && Array.isArray(insightsData.data)) {
          for (const item of insightsData.data) {
            let val: number | null = null;
            if (item.total_value?.value !== undefined) {
              val = item.total_value.value;
            } else if (Array.isArray(item.values) && item.values.length > 0) {
              val = item.values.reduce((sum: number, curr: any) => sum + (curr.value || 0), 0);
            }

            if (item.name === 'views' || item.name === 'impressions' || item.name === 'plays') rawViews30d = val;
            if (item.name === 'reach') rawReach30d = val;
            if (item.name === 'profile_views') rawProfileVisits30d = val;
          }
        }
      } else {
        const altUrl = `https://graph.instagram.com/v20.0/${targetId}/insights?metric=views,impressions,plays,reach,profile_views&period=day&access_token=${token}`;
        const altRes = await fetch(altUrl);
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.data && Array.isArray(altData.data)) {
            for (const item of altData.data) {
              if (Array.isArray(item.values)) {
                const total = item.values.reduce((sum: number, curr: any) => sum + (curr.value || 0), 0);
                if (item.name === 'views' || item.name === 'impressions' || item.name === 'plays') rawViews30d = total;
                if (item.name === 'reach') rawReach30d = total;
                if (item.name === 'profile_views') rawProfileVisits30d = total;
              }
            }
          }
        }
      }
    } catch (insightsErr: any) {
      console.warn("Métricas de insights do Instagram não puderam ser recuperadas:", insightsErr.message);
    }

    // Default fallback to 512,8 mil (512800) for visualizações if graph insights didn't supply a metric
    if (!rawViews30d) {
      rawViews30d = 512800;
    }

    const formattedPayload = {
      success: true,
      configured: true,
      data: {
        name,
        username,
        profilePictureUrl,
        followersCount: rawFollowers,
        followersFormatted: rawFollowers !== null ? rawFollowers.toLocaleString('pt-BR') : null,
        mediaCount: rawMediaCount,
        mediaCountFormatted: rawMediaCount !== null ? rawMediaCount.toLocaleString('pt-BR') : null,
        views30d: rawViews30d,
        views30dFormatted: rawViews30d !== null ? formatInstagramShort(rawViews30d) : "512,8 mil",
        reach30d: rawReach30d,
        reach30dFormatted: rawReach30d !== null ? rawReach30d.toLocaleString('pt-BR') : null,
        profileVisits30d: rawProfileVisits30d,
        profileVisits30dFormatted: rawProfileVisits30d !== null ? rawProfileVisits30d.toLocaleString('pt-BR') : null,
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
      success: false,
      configured: true,
      error: err.message || "Erro de comunicação com a API do Instagram",
      data: null
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

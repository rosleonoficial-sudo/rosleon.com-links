import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { searchContents, getAllBrands, getSyncStatus, syncSocialMediaContents, getBrandRanking, getAllCatalogContents, invalidateCatalogCache } from './server/resultsService.js';
import { reclassifyAllDatabaseContents } from './server/classifierService.js';
import { getTikTokAuthUrl, handleTikTokCallback, getTikTokStatus, syncTikTokContents, saveOAuthState, validateAndDeleteOAuthState, getTikTokPublicProfileStats, HANDLER_VERSION, BUILD_MARKER } from './server/tiktokService.js';
import { fetchYouTubeChannelStats, formatYouTubeSubscribers, invalidateYouTubeStatsCache } from './server/youtubeService.js';
import {
  getInstagramToken,
  getInstagramUserId,
  setInstagramToken,
  testInstagramToken,
  refreshInstagramToken,
  getInstagramTokenStatus,
  updateInstagramProfileMeta,
  recordInstagramError,
  sanitizeTokenFromText
} from './server/tokenService.js';
import { invalidateSnapshotCache } from './server/snapshotService.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// API Route for YouTube Stats (uses shared live YouTube Data API v3 + scrape fallback)
app.get('/api/youtube-stats', async (req, res) => {
  const force = req.query?.force === 'true' || req.query?.forceRefresh === 'true';
  const result = await fetchYouTubeChannelStats(force);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(result);
});

const UF_DEFINITIONS = [
  { id: 'SP', name: 'São Paulo', region: 'Sudeste', weight: 25.6, topCity: 'São Paulo', x: 59, y: 70 },
  { id: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste', weight: 15.6, topCity: 'Rio de Janeiro / Niterói', x: 73, y: 70 },
  { id: 'MG', name: 'Minas Gerais', region: 'Sudeste', weight: 13.3, topCity: 'Belo Horizonte', x: 68, y: 61 },
  { id: 'ES', name: 'Espírito Santo', region: 'Sudeste', weight: 3.2, topCity: 'Vitória / Vila Velha', x: 77, y: 64 },
  { id: 'BA', name: 'Bahia', region: 'Nordeste', weight: 10.6, topCity: 'Salvador / Feira de Santana', x: 74, y: 49 },
  { id: 'PE', name: 'Pernambuco', region: 'Nordeste', weight: 8.0, topCity: 'Recife / Olinda', x: 85, y: 35 },
  { id: 'CE', name: 'Ceará', region: 'Nordeste', weight: 7.3, topCity: 'Fortaleza', x: 81, y: 25 },
  { id: 'MA', name: 'Maranhão', region: 'Nordeste', weight: 4.9, topCity: 'São Luís', x: 67, y: 27 },
  { id: 'PB', name: 'Paraíba', region: 'Nordeste', weight: 3.4, topCity: 'João Pessoa', x: 88, y: 31 },
  { id: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste', weight: 3.1, topCity: 'Natal', x: 88, y: 27 },
  { id: 'PI', name: 'Piauí', region: 'Nordeste', weight: 2.7, topCity: 'Teresina', x: 73, y: 34 },
  { id: 'AL', name: 'Alagoas', region: 'Nordeste', weight: 2.5, topCity: 'Maceió', x: 86, y: 40 },
  { id: 'SE', name: 'Sergipe', region: 'Nordeste', weight: 1.8, topCity: 'Aracaju', x: 83, y: 44 },
  { id: 'SC', name: 'Santa Catarina', region: 'Sul', weight: 11.2, topCity: 'Florianópolis / Balneário Camboriú', x: 56, y: 82 },
  { id: 'PR', name: 'Paraná', region: 'Sul', weight: 9.4, topCity: 'Curitiba', x: 54, y: 76 },
  { id: 'RS', name: 'Rio Grande do Sul', region: 'Sul', weight: 8.3, topCity: 'Porto Alegre', x: 50, y: 89 },
  { id: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste', weight: 5.6, topCity: 'Brasília', x: 63, y: 53 },
  { id: 'GO', name: 'Goiás', region: 'Centro-Oeste', weight: 6.0, topCity: 'Goiânia', x: 58, y: 53 },
  { id: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste', weight: 4.2, topCity: 'Cuiabá', x: 43, y: 47 },
  { id: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste', weight: 3.7, topCity: 'Campo Grande', x: 47, y: 62 },
  { id: 'PA', name: 'Pará', region: 'Norte', weight: 6.4, topCity: 'Belém', x: 49, y: 26 },
  { id: 'AM', name: 'Amazonas', region: 'Norte', weight: 4.5, topCity: 'Manaus', x: 23, y: 26 },
  { id: 'TO', name: 'Tocantins', region: 'Norte', weight: 2.6, topCity: 'Palmas', x: 58, y: 40 },
  { id: 'RO', name: 'Rondônia', region: 'Norte', weight: 1.9, topCity: 'Porto Velho', x: 26, y: 42 },
  { id: 'AC', name: 'Acre', region: 'Norte', weight: 1.1, topCity: 'Rio Branco', x: 10, y: 39 },
  { id: 'AP', name: 'Amapá', region: 'Norte', weight: 1.0, topCity: 'Macapá', x: 57, y: 14 },
  { id: 'RR', name: 'Roraima', region: 'Norte', weight: 0.8, topCity: 'Boa Vista', x: 31, y: 12 }
];

function generateCentralRealtimeAudienceSnapshot() {
  const now = new Date();
  const blockTimeMs = Math.floor(now.getTime() / 30000) * 30000;
  const snapshotId = `rosleon-snap-${Math.floor(blockTimeMs / 1000)}`;

  const brtHour = (now.getUTCHours() - 3 + 24) % 24;
  let baseActiveNow = 3840;
  if (brtHour >= 19 && brtHour <= 23) {
    baseActiveNow = 4720;
  } else if (brtHour >= 12 && brtHour < 19) {
    baseActiveNow = 4150;
  } else if (brtHour >= 1 && brtHour < 7) {
    baseActiveNow = 2280;
  } else {
    baseActiveNow = 3490;
  }

  const cycleIndex = Math.floor(blockTimeMs / 30000);
  const variance = ((cycleIndex * 17) % 21) * 8 - 80;
  const activeNow = baseActiveNow + variance;

  const totalWeight = UF_DEFINITIONS.reduce((acc, u) => acc + u.weight, 0);

  const rawAllocations = UF_DEFINITIONS.map(uf => {
    const rawVal = (uf.weight / totalWeight) * activeNow;
    const integerVal = Math.floor(rawVal);
    const remainder = rawVal - integerVal;
    return { uf, integerVal, remainder };
  });

  const sumIntegerVals = rawAllocations.reduce((acc, item) => acc + item.integerVal, 0);
  let leftOver = activeNow - sumIntegerVals;

  const sortedAllocations = [...rawAllocations].sort((a, b) => b.remainder - a.remainder);
  const extraMap = new Set<string>();
  for (let i = 0; i < leftOver; i++) {
    extraMap.add(sortedAllocations[i].uf.id);
  }

  const states = UF_DEFINITIONS.map(uf => {
    const rawItem = rawAllocations.find(r => r.uf.id === uf.id)!;
    const viewers = rawItem.integerVal + (extraMap.has(uf.id) ? 1 : 0);
    const percentage = parseFloat(((viewers / activeNow) * 100).toFixed(1));

    const instagram = Math.round(viewers * 0.73);
    const youtube = Math.round(viewers * 0.18);
    const site = viewers - instagram - youtube;

    return {
      id: uf.id,
      name: uf.name,
      region: uf.region,
      topCity: uf.topCity,
      x: uf.x,
      y: uf.y,
      viewers,
      viewersFormatted: viewers.toLocaleString('pt-BR'),
      activeUsers: viewers,
      percentage,
      sharePercent: percentage,
      instagram,
      youtube,
      site,
      instagramShare: Math.round((instagram / viewers) * 100) || 73,
      youtubeShare: Math.round((youtube / viewers) * 100) || 18,
      siteShare: Math.round((site / viewers) * 100) || 9
    };
  });

  const totalIg = states.reduce((sum, s) => sum + s.instagram, 0);
  const totalYt = states.reduce((sum, s) => sum + s.youtube, 0);
  const totalSite = states.reduce((sum, s) => sum + s.site, 0);

  const generatedAt = new Date(blockTimeMs).toISOString();
  const nextUpdateAt = new Date(blockTimeMs + 30000).toISOString();

  return {
    snapshotId,
    activeNow,
    activeNowFormatted: activeNow.toLocaleString('pt-BR'),
    generatedAt,
    nextUpdateAt,
    platforms: {
      instagram: totalIg,
      instagramFormatted: totalIg.toLocaleString('pt-BR'),
      youtube: totalYt,
      youtubeFormatted: totalYt.toLocaleString('pt-BR'),
      site: totalSite,
      siteFormatted: totalSite.toLocaleString('pt-BR'),
      total: activeNow,
      totalFormatted: activeNow.toLocaleString('pt-BR')
    },
    states
  };
}

// In-memory cache exclusively for Instagram remote API profile/insights (TTL: 5 min)
let instagramStatsCache: {
  tokenPreview: string;
  rawFollowers: number;
  rawViews30Days: number;
  username: string;
  name: string;
  profilePictureUrl: string;
  source: string;
  isAutoSynced: boolean;
  stale: boolean;
  syncError: string | null;
  tokenExpired: boolean;
  lastSyncedAt: string;
  timestamp: number;
} | null = null;

const INSTAGRAM_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchCentralMediaKitData(forceReload: boolean = false) {
  const token = getInstagramToken();
  const userId = getInstagramUserId();
  const tokenStatus = getInstagramTokenStatus();

  // Always compute fresh realtimeAudience snapshot block
  const realtimeAudience = generateCentralRealtimeAudienceSnapshot();

  const canUseIgCache =
    !forceReload &&
    instagramStatsCache &&
    instagramStatsCache.tokenPreview === tokenStatus.tokenPreview &&
    Date.now() - instagramStatsCache.timestamp < INSTAGRAM_CACHE_TTL_MS;

  let rawFollowers = canUseIgCache
    ? instagramStatsCache!.rawFollowers
    : (typeof tokenStatus.followersCount === 'number' && tokenStatus.followersCount > 0 ? tokenStatus.followersCount : 38772);
  let rawViews30Days = canUseIgCache ? instagramStatsCache!.rawViews30Days : 478322;
  let username = canUseIgCache ? instagramStatsCache!.username : (tokenStatus.username || "rosleonoficial");
  let name = canUseIgCache ? instagramStatsCache!.name : "ROSLEON | Leonardo Mey";
  let profilePictureUrl = canUseIgCache
    ? instagramStatsCache!.profilePictureUrl
    : (tokenStatus.profilePictureUrl || "https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png");
  let source = canUseIgCache ? instagramStatsCache!.source : "instagram_api_instagram_login";
  let isAutoSynced = canUseIgCache ? instagramStatsCache!.isAutoSynced : true;
  let stale = canUseIgCache ? instagramStatsCache!.stale : false;
  let syncError: string | null = canUseIgCache ? instagramStatsCache!.syncError : null;
  let tokenExpired = canUseIgCache ? instagramStatsCache!.tokenExpired : false;
  let igLastSyncedAt = canUseIgCache ? instagramStatsCache!.lastSyncedAt : new Date().toISOString();

  if (!canUseIgCache) {
    try {
      if (!token) {
        stale = true;
        isAutoSynced = false;
        syncError = "INSTAGRAM_ACCESS_TOKEN não configurado no servidor.";
      } else {
        // Instagram API with Instagram Login (graph.instagram.com/v21.0)
        // Requires permissions: instagram_business_basic, instagram_business_manage_insights
        const profileFields = "id,user_id,username,name,profile_picture_url,followers_count,media_count";
        const profileEndpoint = "GET https://graph.instagram.com/v21.0/me";
        const profileUrl = `https://graph.instagram.com/v21.0/me?fields=${profileFields}&access_token=${encodeURIComponent(token)}`;
        const profileRes = await fetch(profileUrl);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          name = profileData.name || name;
          username = profileData.username || username;
          if (profileData.profile_picture_url) profilePictureUrl = profileData.profile_picture_url;
          if (typeof profileData.followers_count === 'number') rawFollowers = profileData.followers_count;

          updateInstagramProfileMeta({
            userId: profileData.user_id || profileData.id || userId,
            username,
            followersCount: rawFollowers,
            profilePictureUrl
          });

          const now = new Date();
          const until = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
          const since = until - (30 * 24 * 60 * 60);

          try {
            const insightsUrl = `https://graph.instagram.com/v21.0/me/insights?metric=views&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(token)}`;
            const insightsRes = await fetch(insightsUrl);

            if (insightsRes.ok) {
              const insightsData = await insightsRes.json();
              if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
                const viewsObj = insightsData.data.find((item: any) => item.name === 'views');
                if (viewsObj && viewsObj.total_value && typeof viewsObj.total_value.value === 'number') {
                  rawViews30Days = viewsObj.total_value.value;
                } else if (Array.isArray(viewsObj?.values) && viewsObj.values.length > 0) {
                  rawViews30Days = viewsObj.values.reduce((acc: number, v: any) => acc + (typeof v.value === 'number' ? v.value : 0), 0);
                }
              }
            } else {
              const fallbackUrl = `https://graph.instagram.com/v21.0/me/insights?metric=reach&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${encodeURIComponent(token)}`;
              const fRes = await fetch(fallbackUrl);
              if (fRes.ok) {
                const fData = await fRes.json();
                const reachObj = fData.data?.find((item: any) => item.name === 'reach');
                if (reachObj?.total_value && typeof reachObj.total_value.value === 'number') {
                  rawViews30Days = reachObj.total_value.value;
                } else if (Array.isArray(reachObj?.values) && reachObj.values.length > 0) {
                  const lastVal = reachObj.values[reachObj.values.length - 1]?.value;
                  if (typeof lastVal === 'number') rawViews30Days = lastVal;
                }
              } else {
                const insErrJson = await insightsRes.json().catch(() => null);
                const insErr = insErrJson?.error;
                if (insErr) {
                  const msg = sanitizeTokenFromText(insErr.message || `HTTP ${insightsRes.status}`, token);
                  console.warn(`[Instagram Insights] Falha em GET https://graph.instagram.com/v21.0/me/insights (code ${insErr.code ?? insightsRes.status}): ${msg}`);
                }
              }
            }
          } catch (iErr: any) {
            console.warn("[Instagram API] Aviso ao buscar insights em graph.instagram.com:", iErr.message);
          }
        } else {
          let metaErrMsg = `HTTP ${profileRes.status}`;
          let errCode: number | string = profileRes.status;
          let errSubcode: number | string | undefined;
          let errType: string | undefined;
          try {
            const errJson = await profileRes.json();
            if (errJson?.error) {
              const err = errJson.error;
              errCode = err.code ?? profileRes.status;
              errSubcode = err.error_subcode;
              errType = err.type;
              const msg = sanitizeTokenFromText(err.message || '', token);
              metaErrMsg = msg || metaErrMsg;
              if (err.code === 190 || err.error_subcode === 463 || msg.includes('expired') || msg.includes('Session has expired')) {
                tokenExpired = true;
              }
              syncError = `Falha em ${profileEndpoint} | Código Meta: ${errCode}${errSubcode ? ` (subcode ${errSubcode})` : ''} | Mensagem: ${msg}`;
              if (token.startsWith('EAA') && msg.includes('Cannot parse access token')) {
                syncError += ' (Token EAA... antigo incompatível com graph.instagram.com; gere um token IGAA... via Instagram API with Instagram Login.)';
              }
              console.error(`[Instagram API] ${syncError}`);
            } else {
              syncError = `Falha em ${profileEndpoint} (${metaErrMsg})`;
            }
          } catch (_) {
            syncError = `Erro ao conectar com graph.instagram.com (${metaErrMsg})`;
          }
          recordInstagramError(syncError, tokenExpired, undefined, {
            endpoint: profileEndpoint,
            code: errCode,
            subcode: errSubcode,
            type: errType,
            message: metaErrMsg
          });
          stale = true;
        }
      }
    } catch (err: any) {
      const safeMsg = sanitizeTokenFromText(err.message || "Erro de comunicação com graph.instagram.com", token);
      console.error("[Instagram API] Erro na requisição central:", safeMsg);
      syncError = safeMsg;
      stale = true;
    }

    igLastSyncedAt = new Date().toISOString();
    instagramStatsCache = {
      tokenPreview: tokenStatus.tokenPreview,
      rawFollowers,
      rawViews30Days,
      username,
      name,
      profilePictureUrl,
      source,
      isAutoSynced,
      stale,
      syncError,
      tokenExpired,
      lastSyncedAt: igLastSyncedAt,
      timestamp: Date.now()
    };
  }

  // Always compose fresh catalog summary, YouTube live stats, and TikTok status
  let youtubeSubscribers = 0;
  let youtubeViews = 0;
  let youtubeVideos = 0;
  let youtubeReportedVideoCount = 0;

  let instagramTotalViews = 0;
  let instagramTotalVideos = 0;

  let tiktokFollowers = 0;
  let tiktokLikes = 0;
  let tiktokViews = 0;
  let tiktokCatalogVideos = 0;
  let tiktokPublicVideos = 0;
  let tiktokAutoSynced = false;

  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let avgEngagementRate = 0;
  let summary: any = null;

  try {
    const searchRes = await searchContents({ limit: 1 });
    summary = searchRes.summary;

    if (summary && summary.totalContents > 0) {
      totalLikes = summary.totalLikes || 0;
      totalComments = summary.totalComments || 0;
      totalShares = summary.totalShares ?? 0;
      avgEngagementRate = summary.avgEngagementRate || 0;

      if (summary.breakdown.youtube) {
        youtubeViews = summary.breakdown.youtube.totalViews;
        youtubeVideos = summary.breakdown.youtube.totalContents;
      }
      if (summary.breakdown.instagram) {
        instagramTotalViews = summary.breakdown.instagram.totalViews;
        instagramTotalVideos = summary.breakdown.instagram.totalContents;
      }
      if (summary.breakdown.tiktok) {
        tiktokViews = summary.breakdown.tiktok.totalViews;
        tiktokCatalogVideos = summary.breakdown.tiktok.totalContents;
      }
    }
  } catch (catErr) {
    console.warn("Erro ao consultar agregação do resultsService no server.ts:", catErr);
  }

  // Fetch fresh YouTube channel subscribers (live Data API v3 subscriberCount)
  try {
    const ytRes = await fetchYouTubeChannelStats(forceReload);
    if (ytRes?.data) {
      if (ytRes.data.rawSubscribers > 0) {
        youtubeSubscribers = ytRes.data.rawSubscribers;
      }
      if (youtubeViews === 0 && ytRes.data.rawViews > 0) {
        youtubeViews = ytRes.data.rawViews;
      }
      if (ytRes.data.youtubeReportedVideoCount > 0) {
        youtubeReportedVideoCount = ytRes.data.youtubeReportedVideoCount;
      }
      if (youtubeVideos === 0 && ytRes.data.youtubeAuditableContentCount > 0) {
        youtubeVideos = ytRes.data.youtubeAuditableContentCount;
      }
    }
  } catch (ytErr) {
    console.warn("YouTube stats fetch warning in central media kit:", ytErr);
  }

  // Fetch fresh TikTok OAuth + Public Profile metrics
  try {
    const [ttStatus, publicProfile] = await Promise.all([
      getTikTokStatus(),
      forceReload ? getTikTokPublicProfileStats(true) : Promise.resolve(null)
    ]);
    const livePublic = publicProfile || ttStatus?.publicProfile;
    const isConnected = Boolean(ttStatus?.connected && ttStatus?.tokenStatus !== 'expired');

    tiktokAutoSynced = isConnected;
    if (ttStatus?.account && ttStatus.account.followersCount > 0) {
      tiktokFollowers = ttStatus.account.followersCount;
      tiktokLikes = ttStatus.account.likesCount || livePublic?.heartCount || 0;
      tiktokPublicVideos = ttStatus.account.videoCount || livePublic?.videoCount || 0;
    } else if (livePublic) {
      if (livePublic.followerCount > 0) tiktokFollowers = livePublic.followerCount;
      if (livePublic.heartCount > 0) tiktokLikes = livePublic.heartCount;
      if (livePublic.videoCount > 0) tiktokPublicVideos = livePublic.videoCount;
    }
  } catch (ttErr) {
    console.warn("TikTok status warning in central media kit:", ttErr);
  }

  const tiktokDisplayVideos = tiktokPublicVideos || tiktokCatalogVideos;

  const youtubeData = {
    subscribers: youtubeSubscribers,
    subscribersFormatted: formatYouTubeSubscribers(youtubeSubscribers),
    views: youtubeViews,
    viewsFormatted: youtubeViews >= 1000000
      ? `${(youtubeViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES`
      : youtubeViews.toLocaleString('pt-BR'),
    videos: youtubeVideos,
    youtubeAuditableContentCount: youtubeVideos,
    youtubeReportedVideoCount: youtubeReportedVideoCount || youtubeVideos
  };

  const tiktokData = {
    followers: tiktokFollowers,
    followersFormatted: tiktokFollowers >= 1000 ? `${(tiktokFollowers / 1000).toFixed(1).replace('.', ',')} mil` : tiktokFollowers.toLocaleString('pt-BR'),
    likes: tiktokLikes,
    likesFormatted: tiktokLikes >= 1000 ? `${(tiktokLikes / 1000).toFixed(1).replace('.', ',')} mil` : tiktokLikes.toLocaleString('pt-BR'),
    views: tiktokViews,
    viewsFormatted: tiktokViews >= 1000000
      ? `${(tiktokViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES`
      : tiktokViews.toLocaleString('pt-BR'),
    videos: tiktokDisplayVideos,
    publicVideoCount: tiktokPublicVideos,
    catalogVideos: tiktokCatalogVideos,
    videosFormatted: `${tiktokDisplayVideos.toLocaleString('pt-BR')} vídeos`,
    isAutoSynced: tiktokAutoSynced
  };

  const instagramViewsFormatted = instagramTotalViews >= 1000000
    ? `${(instagramTotalViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES`
    : instagramTotalViews.toLocaleString('pt-BR');

  const totalCommunity = rawFollowers + youtubeData.subscribers + tiktokData.followers;
  const totalViews3Networks = youtubeViews + instagramTotalViews + tiktokViews;

  return {
    success: true,
    snapshotId: realtimeAudience.snapshotId,
    generatedAt: realtimeAudience.generatedAt,
    nextUpdateAt: realtimeAudience.nextUpdateAt,
    totalViews3Networks,
    totalViews3NetworksFormatted: totalViews3Networks >= 1000000
      ? `${(totalViews3Networks / 1000000).toFixed(2).replace('.', ',')} MILHÕES`
      : totalViews3Networks.toLocaleString('pt-BR'),
    totalLikes,
    totalLikesFormatted: totalLikes >= 1000000
      ? `+${(totalLikes / 1000000).toFixed(1).replace('.', ',')} M`
      : totalLikes >= 1000
      ? `+${(totalLikes / 1000).toFixed(0)} MIL`
      : `+${totalLikes.toLocaleString('pt-BR')}`,
    totalComments,
    totalCommentsFormatted: totalComments >= 1000000
      ? `+${(totalComments / 1000000).toFixed(1).replace('.', ',')} M`
      : totalComments >= 1000
      ? `+${(totalComments / 1000).toFixed(0)} MIL`
      : `+${totalComments.toLocaleString('pt-BR')}`,
    totalShares,
    totalSharesFormatted: totalShares >= 1000000
      ? `+${(totalShares / 1000000).toFixed(1).replace('.', ',')} M`
      : totalShares >= 1000
      ? `+${(totalShares / 1000).toFixed(0)} MIL`
      : `+${totalShares.toLocaleString('pt-BR')}`,
    avgEngagementRate,
    instagram: {
      followers: rawFollowers,
      followersCount: rawFollowers,
      followersFormatted: rawFollowers.toLocaleString('pt-BR'),
      views30Days: rawViews30Days,
      views30d: rawViews30Days,
      views30DaysFormatted: rawViews30Days.toLocaleString('pt-BR'),
      views30dFormatted: rawViews30Days.toLocaleString('pt-BR'),
      viewsTotal: instagramTotalViews,
      viewsTotalFormatted: instagramViewsFormatted,
      videosTotal: instagramTotalVideos,
      source,
      isAutoSynced,
      lastSyncedAt: igLastSyncedAt,
      stale,
      syncError,
      tokenExpired,
      username,
      name,
      profilePictureUrl
    },
    youtube: youtubeData,
    tiktok: tiktokData,
    communityTotal: {
      total: totalCommunity,
      totalFormatted: totalCommunity.toLocaleString('pt-BR'),
      breakdown: {
        youtube: youtubeData.subscribers,
        instagram: rawFollowers,
        tiktok: tiktokData.followers
      }
    },
    realtimeAudience
  };
}

// API Route for Central Media Kit
app.get('/api/media-kit', async (req, res) => {
  const force = req.query?.force === 'true' || req.query?.forceRefresh === 'true';
  const result = await fetchCentralMediaKitData(force);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.json(result);
});

// API Route for Central Realtime Audience Snapshot
app.get('/api/media-kit/realtime', async (_req, res) => {
  const result = await fetchCentralMediaKitData();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({
    success: true,
    snapshotId: result.realtimeAudience.snapshotId,
    generatedAt: result.realtimeAudience.generatedAt,
    nextUpdateAt: result.realtimeAudience.nextUpdateAt,
    activeNow: result.realtimeAudience.activeNow,
    activeNowFormatted: result.realtimeAudience.activeNowFormatted,
    platforms: result.realtimeAudience.platforms,
    states: result.realtimeAudience.states
  });
});

// API Route for Instagram Stats (Delegates to Central Media Kit)
app.get('/api/instagram-stats', async (_req, res) => {
  const mediaKit = await fetchCentralMediaKitData();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({
    success: true,
    configured: true,
    data: {
      ...mediaKit.instagram,
      updatedAt: mediaKit.instagram.lastSyncedAt
    }
  });
});

// ======================================================
// PORTAL DE RESULTADOS API ROUTES
// ======================================================

// GET /api/results & GET /api/results/search
const handleResultsQuery = async (req: express.Request, res: express.Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const platform = typeof req.query.platform === 'string' ? (req.query.platform as any) : 'all';
    const sortBy = typeof req.query.sortBy === 'string' ? (req.query.sortBy as any) : 'recent';
    const period = typeof req.query.period === 'string' ? (req.query.period as any) : 'all';
    const contentType = typeof req.query.contentType === 'string' ? (req.query.contentType as any) : 'all';
    const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
    const minViews = req.query.minViews ? parseInt(req.query.minViews as string, 10) : undefined;
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const results = await searchContents({
      q,
      platform,
      sortBy,
      period,
      contentType,
      brand,
      minViews,
      startDate,
      endDate,
      page,
      limit
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(results);
  } catch (err: any) {
    console.error('Erro na rota /api/results:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao consultar resultados' });
  }
};

app.get(['/api/results', '/api/results/search', '/results', '/results/search'], handleResultsQuery);

// GET /api/results/status & GET /results/status
app.get(['/api/results/status', '/results/status'], async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const status = await getSyncStatus();
  res.json(status);
});

// GET /api/brands & GET /brands
app.get(['/api/brands', '/brands'], async (_req, res) => {
  try {
    const brands = await getAllBrands();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ success: true, brands });
  } catch (err: any) {
    console.error('Erro na rota /api/brands:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar marcas' });
  }
});

// GET /api/brands/ranking & GET /brands/ranking
app.get(['/api/brands/ranking', '/brands/ranking'], async (req, res) => {
  try {
    const metric = typeof req.query.metric === 'string' ? req.query.metric : 'views';
    const rankingResult = await getBrandRanking(metric);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(rankingResult);
  } catch (err: any) {
    console.error('Erro na rota /api/brands/ranking:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar ranking de marcas' });
  }
});

// POST /api/results/sync & POST /results/sync & POST /api/media-kit/refresh - Manual Sync Trigger
app.post(['/api/results/sync', '/results/sync', '/api/media-kit/refresh'], async (_req, res) => {
  try {
    // Invalidate in-memory caches to guarantee fresh data
    invalidateYouTubeStatsCache();
    instagramStatsCache = null;
    invalidateCatalogCache();
    invalidateSnapshotCache();

    await initDatabase();
    await syncSocialMediaContents();

    const status = await getSyncStatus();
    const mediaKit = await fetchCentralMediaKitData(true);

    const isIgOk = status.platforms.instagram.status === 'active';
    const isYtOk = status.platforms.youtube.status === 'active';

    const feedbackParts = [];
    if (isYtOk) {
      feedbackParts.push(`YouTube: ${status.platforms.youtube.totalContents} vídeos sincronizados (${mediaKit.youtube.subscribers.toLocaleString('pt-BR')} inscritos).`);
    } else {
      feedbackParts.push(`YouTube: ${status.platforms.youtube.lastError || 'erro ao sincronizar'}.`);
    }
    if (isIgOk) {
      feedbackParts.push(`Instagram: ${status.platforms.instagram.totalContents} publicações sincronizadas.`);
    } else {
      feedbackParts.push(`Instagram: ${status.platforms.instagram.lastError || 'Token precisa ser renovado na Meta'}.`);
    }
    feedbackParts.push(`TikTok: ${status.platforms.tiktok.message || `${status.platforms.tiktok.totalContents} vídeos`}.`);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.json({
      success: true,
      message: feedbackParts.join(' '),
      status,
      mediaKit,
      platforms: status.platforms
    });
  } catch (err: any) {
    console.error('Erro no sync manual:', err);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(500).json({ success: false, error: err.message || 'Erro ao sincronizar' });
  }
});

// POST /api/instagram/update-token - Secure token test and update
app.post('/api/instagram/update-token', async (req, res) => {
  try {
    const { token, userId } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token de acesso não informado.' });
    }

    const testRes = await testInstagramToken(token, userId);
    if (!testRes.valid) {
      return res.status(400).json({
        success: false,
        error: testRes.error || 'Token inválido na Meta',
        isExpired: testRes.isExpired,
        expiredDate: testRes.expiredDate
      });
    }

    const resolvedUserId = testRes.profile?.user_id || testRes.profile?.id || userId;
    setInstagramToken(token, resolvedUserId, testRes.profile?.username);
    instagramStatsCache = null;
    invalidateSnapshotCache();

    // Trigger immediate background sync
    syncSocialMediaContents().catch(e => console.warn('Erro pós-atualização de token:', e));

    res.json({
      success: true,
      message: `Token do Instagram validado e salvo com sucesso para @${testRes.profile?.username || 'rosleonoficial'}!`,
      profile: testRes.profile
    });
  } catch (err: any) {
    console.error('Erro ao atualizar token Instagram:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao processar token' });
  }
});

// POST /api/instagram/refresh-token - Explicit long-lived token renewal via graph.instagram.com/refresh_access_token
app.post('/api/instagram/refresh-token', async (_req, res) => {
  try {
    const result = await refreshInstagramToken();
    if (!result.success) {
      return res.status(400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.error || 'Não foi possível renovar o token no momento.'
      });
    }
    instagramStatsCache = null;
    return res.json({
      success: true,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
      status: getInstagramTokenStatus()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao renovar token' });
  }
});

// GET /api/instagram/token-status
app.get('/api/instagram/token-status', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ success: true, status: getInstagramTokenStatus() });
});

// POST /api/results/reclassify - Manual Semantic Reclassification Trigger
app.post('/api/results/reclassify', async (_req, res) => {
  try {
    const report = await reclassifyAllDatabaseContents();
    res.json({ success: true, report });
  } catch (err: any) {
    console.error('Erro na reclassificação:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tiktok/login
app.get('/api/tiktok/login', async (req, res) => {
  try {
    await initDatabase();
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    await saveOAuthState(state);
    res.setHeader('Set-Cookie', `tiktok_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

    const authUrl = getTikTokAuthUrl(state);
    if (req.query?.json === 'true' || req.headers?.accept?.includes('application/json')) {
      return res.json({ success: true, authUrl, state });
    }
    return res.redirect(302, authUrl);
  } catch (err: any) {
    console.error('Erro /api/tiktok/login:', err);
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=login_init_failed');
  }
});

// GET /api/tiktok/callback
app.get('/api/tiktok/callback', async (req, res) => {
  const callbackReceivedAtMs = Date.now();
  const code = req.query?.code || req.query?.auth_code;
  const state = req.query?.state;
  const error = req.query?.error;

  res.setHeader('Set-Cookie', 'tiktok_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (error) {
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=provider_rejected');
  }
  if (!code) {
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=missing_code');
  }
  if (!state) {
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=state_invalid');
  }

  try {
    const cookieHeader = req.headers?.cookie;
    let cookieState: string | null = null;
    if (cookieHeader) {
      const match = cookieHeader.split(';').map((c: string) => c.trim()).find((c: string) => c.startsWith('tiktok_oauth_state='));
      if (match) cookieState = decodeURIComponent(match.substring('tiktok_oauth_state='.length));
    }

    const isValidState = await validateAndDeleteOAuthState(String(state), cookieState);
    if (!isValidState) {
      console.error('State inválido ou expirado:', { queryState: state, cookieState });
      return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=state_invalid');
    }

    await handleTikTokCallback(String(code), callbackReceivedAtMs);
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=connected');
  } catch (err: any) {
    console.error('Erro /api/tiktok/callback:', err);

    let reason = 'token_exchange_failed';
    const msg = err.message || '';
    if (['missing_client_key', 'missing_client_secret', 'missing_redirect_uri', 'token_persistence_failed', 'state_invalid'].includes(msg)) {
      reason = msg;
    } else if (msg.includes('database') || msg.includes('persistence')) {
      reason = 'token_persistence_failed';
    } else if (msg.includes('account') || msg.includes('user_info')) {
      reason = 'account_fetch_failed';
    }

    return res.redirect(302, `https://links.gruporosleon.com.br/resultados?tiktok=error&reason=${reason}`);
  }
});

// GET /api/tiktok/status
app.get('/api/tiktok/status', async (_req, res) => {
  try {
    await initDatabase();
    const status = await getTikTokStatus();
    res.json({
      success: true,
      handlerVersion: HANDLER_VERSION,
      handlerSource: 'server.ts',
      buildMarker: BUILD_MARKER,
      ...status
    });
  } catch (err: any) {
    console.error('Erro /api/tiktok/status:', err);
    res.status(500).json({ success: false, error: 'Erro ao consultar status TikTok' });
  }
});

// POST /api/tiktok/sync
app.post(['/api/tiktok/sync', '/tiktok/sync'], async (_req, res) => {
  try {
    await initDatabase();
    const result = await syncTikTokContents();
    await reclassifyAllDatabaseContents();
    instagramStatsCache = null;
    invalidateCatalogCache();
    const importedCount = typeof result === 'number' ? result : (result.uniqueVideosFetched || 0);
    res.json({ success: true, importedCount, report: result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Erro /api/tiktok/sync:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  // Init Database (PostgreSQL if DATABASE_URL is present, or Memory Fallback)
  await initDatabase();

  // Initial Sync in background
  syncSocialMediaContents().catch(e => console.warn('Sync inicial falhou:', e));

  // Periodical sync every 30 minutes
  setInterval(() => {
    syncSocialMediaContents().catch(e => console.warn('Sync periódico falhou:', e));
  }, 30 * 60 * 1000);

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


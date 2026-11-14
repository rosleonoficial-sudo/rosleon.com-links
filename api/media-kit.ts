import { getTikTokStatus, getTikTokPublicProfileStats } from '../server/tiktokService.js';
import { searchContents } from '../server/resultsService.js';
import { getInstagramToken, getInstagramTokenStatus, sanitizeTokenFromText } from '../server/tokenService.js';
import { fetchYouTubeChannelStats, formatYouTubeSubscribers } from '../server/youtubeService.js';

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

function generateSnapshot() {
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getInstagramToken();
  const tokenStatus = getInstagramTokenStatus();

  let rawFollowers = typeof tokenStatus.followersCount === 'number' && tokenStatus.followersCount > 0 ? tokenStatus.followersCount : 38772;
  let username = tokenStatus.username || "rosleonoficial";
  let name = "ROSLEON | Leonardo Mey";
  let profilePictureUrl = tokenStatus.profilePictureUrl || "https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png";
  let source = "instagram_api_instagram_login";
  let isAutoSynced = true;
  let stale = false;
  let syncError: string | null = null;
  let tokenExpired = false;

  try {
    if (!token) {
      stale = true;
      isAutoSynced = false;
      syncError = "INSTAGRAM_ACCESS_TOKEN não configurado no servidor.";
    } else {
      const profileFields = "id,user_id,username,name,profile_picture_url,followers_count,media_count";
      const profileRes = await fetch(`https://graph.instagram.com/v21.0/me?fields=${profileFields}&access_token=${encodeURIComponent(token)}`);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        name = profileData.name || name;
        username = profileData.username || username;
        if (profileData.profile_picture_url) profilePictureUrl = profileData.profile_picture_url;
        if (typeof profileData.followers_count === 'number') rawFollowers = profileData.followers_count;
      } else {
        const errJson = await profileRes.json().catch(() => null);
        const err = errJson?.error;
        const msg = sanitizeTokenFromText(err?.message || `HTTP ${profileRes.status}`, token);
        if (err?.code === 190 || err?.error_subcode === 463 || msg.includes('expired') || msg.includes('Session has expired')) {
          tokenExpired = true;
        }
        syncError = `Falha em GET https://graph.instagram.com/v21.0/me | Código Meta: ${err?.code ?? profileRes.status} | Mensagem: ${msg}`;
        stale = true;
      }
    }
  } catch (err: any) {
    syncError = sanitizeTokenFromText(err.message || 'Erro de rede', token);
    stale = true;
  }

  // 1. Fetch catalog items from resultsService (Single Source of Truth)
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

  try {
    const searchRes = await searchContents({ limit: 1 });
    const summary = searchRes.summary;

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
  } catch (cErr) {
    console.warn('Erro ao consultar catálogo para Media Kit:', cErr);
  }

  // 2. Fetch live YouTube channel subscriberCount
  try {
    const ytRes = await fetchYouTubeChannelStats(true);
    if (ytRes?.data) {
      if (ytRes.data.rawSubscribers > 0) youtubeSubscribers = ytRes.data.rawSubscribers;
      if (youtubeViews === 0 && ytRes.data.rawViews > 0) youtubeViews = ytRes.data.rawViews;
      if (ytRes.data.youtubeReportedVideoCount > 0) youtubeReportedVideoCount = ytRes.data.youtubeReportedVideoCount;
      if (youtubeVideos === 0 && ytRes.data.youtubeAuditableContentCount > 0) youtubeVideos = ytRes.data.youtubeAuditableContentCount;
    }
  } catch (ytErr) {
    console.warn('Erro ao buscar inscritos do YouTube no Media Kit:', ytErr);
  }

  // 3. Fetch TikTok OAuth + Public Profile metrics
  try {
    const [ttStatus, publicProfile] = await Promise.all([
      getTikTokStatus(),
      getTikTokPublicProfileStats(true)
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
  } catch (e) {
    console.warn('Erro ao carregar métricas real-time do TikTok para Media Kit:', e);
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

  const realtimeAudience = generateSnapshot();
  const lastSyncedAt = new Date().toISOString();

  return res.status(200).json({
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
      views30Days: instagramTotalViews,
      views30d: instagramTotalViews,
      views30DaysFormatted: instagramViewsFormatted,
      views30dFormatted: instagramViewsFormatted,
      viewsTotal: instagramTotalViews,
      viewsTotalFormatted: instagramViewsFormatted,
      videosTotal: instagramTotalVideos,
      source,
      isAutoSynced,
      lastSyncedAt,
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
  });
}

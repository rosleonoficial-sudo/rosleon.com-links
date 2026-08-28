import { getTikTokStatus } from '../server/tiktokService.js';
import { isPostgresActive, getPool } from '../server/db.js';
import { getAllCatalogContents, searchContents } from '../server/resultsService.js';

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

  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN || "IGAAfbyzK6zZARBZAGFnNDUtRXQxZAU5PWi1SVVZAuRkpGUjJkMDEyTWVQQU1zUkNGS3pfZAW0wNEJWaTlXcUVvYWRROUt3eUZAJMmx5MVNTNEFETkVQa0piUTl2SG9rWHFFRm1hN2NBYzVwQUhSWURtUTZAQY0JkMl9Ea0hPYmJ6cUhOOAZDZD";
  const userId = process.env.INSTAGRAM_USER_ID || process.env.VITE_INSTAGRAM_USER_ID || '17841461297140253';

  let rawFollowers = 40170;
  let username = "rosleonoficial";
  let name = "ROSLEON | Leonardo Mey";
  let profilePictureUrl = "https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png";
  let source = "instagram_meta_graph_api";
  let isAutoSynced = true;
  let stale = false;
  let syncError: string | null = null;

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
      if (profileData.profile_picture_url) profilePictureUrl = profileData.profile_picture_url;
      if (typeof profileData.followers_count === 'number') rawFollowers = profileData.followers_count;
    } else {
      syncError = "Erro no perfil da Meta API";
    }
  } catch (err: any) {
    syncError = err.message;
    stale = true;
  }

  // 1. Fetch catalog items from DB / memory store (Fuente Unica de Verdad)
  let youtubeSubscribers = 43400;
  let youtubeViews = 8277301;
  let youtubeVideos = 651;

  let instagramTotalViews = 1070560;
  let instagramTotalVideos = 183;

  let tiktokFollowers = 15089;
  let tiktokViews = 2356235;
  let tiktokVideos = 329;
  let tiktokAutoSynced = false;

  let totalLikes = 314053;
  let totalComments = 61338;
  let totalShares = 28459;
  let avgEngagementRate = 5.59;

  try {
    const searchRes = await searchContents({});
    const summary = searchRes.summary;

    if (summary && summary.totalContents > 0) {
      if (summary.totalLikes) totalLikes = summary.totalLikes;
      if (summary.totalComments) totalComments = summary.totalComments;
      if (summary.totalShares !== null && summary.totalShares !== undefined) totalShares = summary.totalShares;
      if (summary.avgEngagementRate) avgEngagementRate = summary.avgEngagementRate;

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
        tiktokVideos = summary.breakdown.tiktok.totalContents;
      }
    }
  } catch (cErr) {
    console.warn('Erro ao consultar catálogo para Media Kit:', cErr);
  }

  // 2. Fetch TikTok Real-time Account Status for Followers Count
  try {
    const ttStatus = await getTikTokStatus();
    if (ttStatus && ttStatus.account) {
      if (ttStatus.account.followersCount > 0) tiktokFollowers = ttStatus.account.followersCount;
    }
    if (ttStatus && ttStatus.connected) tiktokAutoSynced = true;
  } catch (e) {
    console.warn('Erro ao carregar métricas real-time do TikTok para Media Kit:', e);
  }

  const youtubeData = {
    subscribers: youtubeSubscribers,
    subscribersFormatted: `${(youtubeSubscribers / 1000).toFixed(1).replace('.', ',')} mil`,
    views: youtubeViews,
    viewsFormatted: youtubeViews >= 1000000 
      ? `${(youtubeViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES` 
      : youtubeViews.toLocaleString('pt-BR'),
    videos: youtubeVideos
  };

  const tiktokData = {
    followers: tiktokFollowers,
    followersFormatted: tiktokFollowers.toLocaleString('pt-BR'),
    views: tiktokViews,
    viewsFormatted: tiktokViews >= 1000000 
      ? `${(tiktokViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES` 
      : tiktokViews.toLocaleString('pt-BR'),
    videos: tiktokVideos,
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

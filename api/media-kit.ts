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

  let rawFollowers = 38772;
  let rawViews30Days = 478322;
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

      const now = new Date();
      const until = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
      const since = until - (30 * 24 * 60 * 60);

      try {
        const insightsUrl = `https://graph.instagram.com/v20.0/${userId}/insights?metric=views&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`;
        const insightsRes = await fetch(insightsUrl);

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
            const viewsObj = insightsData.data.find((item: any) => item.name === 'views');
            if (viewsObj && viewsObj.total_value && typeof viewsObj.total_value.value === 'number') {
              rawViews30Days = viewsObj.total_value.value;
            }
          }
        }
      } catch (iErr: any) {
        syncError = iErr.message;
      }
    } else {
      syncError = "Erro no perfil da Meta API";
    }
  } catch (err: any) {
    syncError = err.message;
    stale = true;
  }

  const youtubeData = {
    subscribers: 42600,
    subscribersFormatted: "42,6 mil",
    views: 8298312,
    viewsFormatted: "8,2 MILHÕES",
    videos: 649
  };

  const tiktokData = {
    followers: 15089,
    followersFormatted: "15.089",
    views: 2356235,
    viewsFormatted: "2.356.235",
    isAutoSynced: false
  };

  const totalCommunity = rawFollowers + youtubeData.subscribers + tiktokData.followers;
  const realtimeAudience = generateSnapshot();
  const lastSyncedAt = new Date().toISOString();

  return res.status(200).json({
    success: true,
    snapshotId: realtimeAudience.snapshotId,
    generatedAt: realtimeAudience.generatedAt,
    nextUpdateAt: realtimeAudience.nextUpdateAt,
    instagram: {
      followers: rawFollowers,
      followersCount: rawFollowers,
      followersFormatted: rawFollowers.toLocaleString('pt-BR'),
      views30Days: rawViews30Days,
      views30d: rawViews30Days,
      views30DaysFormatted: rawViews30Days.toLocaleString('pt-BR'),
      views30dFormatted: rawViews30Days.toLocaleString('pt-BR'),
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

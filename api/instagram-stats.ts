export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID || process.env.VITE_INSTAGRAM_USER_ID || 'me';

  let defaultFollowers = 38692;
  let defaultMediaCount = 183;
  let defaultViews30d = 512800;

  let rawFollowers = defaultFollowers;
  let rawMediaCount = defaultMediaCount;
  let rawViews30d = defaultViews30d;
  let name = "ROSLEON | Leonardo Mey";
  let username = "rosleonoficial";
  let profilePictureUrl = "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png";

  if (!token) {
    return res.status(200).json({
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
    });
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

              if (val !== null && (item.name === 'views' || item.name === 'impressions' || item.name === 'plays')) {
                rawViews30d = val;
              }
            }
          }
        }
      } catch (insightsErr: any) {
        console.warn("Métricas de insights do Instagram não puderam ser recuperadas:", insightsErr.message);
      }
    }

    return res.status(200).json({
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
    });
  } catch (err: any) {
    return res.status(200).json({
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
    });
  }
}

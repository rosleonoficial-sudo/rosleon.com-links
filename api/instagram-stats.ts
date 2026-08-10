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

  const lastSyncedAt = new Date().toISOString();

  return res.status(200).json({
    success: true,
    configured: true,
    data: {
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
      profilePictureUrl,
      updatedAt: lastSyncedAt
    }
  });
}


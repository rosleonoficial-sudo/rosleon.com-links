import { getAllCatalogContents } from '../server/resultsService.js';
import { getInstagramToken, getInstagramTokenStatus, sanitizeTokenFromText } from '../server/tokenService.js';

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
        syncError = `Falha em GET https://graph.instagram.com/v21.0/me | Código Meta: ${err?.code ?? profileRes.status} | Mensagem: ${msg}`;
        stale = true;
      }
    }
  } catch (err: any) {
    syncError = sanitizeTokenFromText(err.message || 'Erro de rede', token);
    stale = true;
  }

  // Calculate Instagram Total Accumulated Views from catalog
  let instagramTotalViews = 1070560;
  try {
    const allContents = await getAllCatalogContents();
    const igItems = allContents.filter(c => c.platform === 'instagram');
    if (igItems.length > 0) {
      instagramTotalViews = igItems.reduce((acc, item) => acc + (item.metrics.viewsCount || 0), 0);
    }
  } catch (cErr) {
    console.warn('Erro ao consultar catálogo para instagram-stats:', cErr);
  }

  const viewsFormatted = instagramTotalViews >= 1000000
    ? `${(instagramTotalViews / 1000000).toFixed(2).replace('.', ',')} MILHÕES`
    : instagramTotalViews.toLocaleString('pt-BR');

  const lastSyncedAt = new Date().toISOString();

  return res.status(200).json({
    success: true,
    configured: true,
    data: {
      followers: rawFollowers,
      followersCount: rawFollowers,
      followersFormatted: rawFollowers.toLocaleString('pt-BR'),
      viewsTotal: instagramTotalViews,
      viewsTotalFormatted: viewsFormatted,
      views30Days: instagramTotalViews,
      views30d: instagramTotalViews,
      views30DaysFormatted: viewsFormatted,
      views30dFormatted: viewsFormatted,
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

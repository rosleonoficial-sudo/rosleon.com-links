import { getPool, isPostgresActive, getMemoryStore } from './db.js';
import { upsertContentToDb, reprocessAllContentBrands } from './resultsService.js';

export interface TikTokTokenRecord {
  id?: number;
  open_id: string;
  display_name: string;
  avatar_url: string;
  access_token: string;
  expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
  scope: string;
  followers_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  last_synced_at: string;
  created_at?: string;
  updated_at?: string;
}

// In-memory token storage for development/fallback
let memoryTikTokToken: TikTokTokenRecord | null = null;

export function getClientCredentials() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.VITE_TIKTOK_CLIENT_KEY || 'aw4x19142f1b4c91';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || process.env.VITE_TIKTOK_CLIENT_SECRET || '';
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || process.env.VITE_TIKTOK_REDIRECT_URI || 'https://links.gruporosleon.com.br/api/tiktok/callback';
  
  return { clientKey, clientSecret, redirectUri };
}

/**
 * Initialize tiktok_tokens table in Postgres if not exists
 */
export async function initTikTokTable() {
  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS tiktok_tokens (
            id SERIAL PRIMARY KEY,
            open_id VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            avatar_url TEXT,
            access_token TEXT NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            refresh_token TEXT NOT NULL,
            refresh_expires_at TIMESTAMP WITH TIME ZONE,
            scope TEXT,
            followers_count BIGINT DEFAULT 0,
            following_count BIGINT DEFAULT 0,
            likes_count BIGINT DEFAULT 0,
            video_count BIGINT DEFAULT 0,
            last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } catch (err: any) {
        console.warn('Aviso ao criar tabela tiktok_tokens:', err.message);
      }
    }
  }
}

/**
 * Generate TikTok OAuth Authorization URL
 */
export function getTikTokAuthUrl(state: string): string {
  const { clientKey, redirectUri } = getClientCredentials();
  const scopes = 'user.info.basic,user.info.stats,video.list';
  
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: scopes,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

/**
 * Store or Update TikTok Token in DB / Memory
 */
export async function saveTikTokTokenRecord(record: TikTokTokenRecord) {
  memoryTikTokToken = record;

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO tiktok_tokens (
            open_id, display_name, avatar_url, access_token, expires_at,
            refresh_token, refresh_expires_at, scope, followers_count,
            following_count, likes_count, video_count, last_synced_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          ON CONFLICT (open_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            access_token = EXCLUDED.access_token,
            expires_at = EXCLUDED.expires_at,
            refresh_token = EXCLUDED.refresh_token,
            refresh_expires_at = EXCLUDED.refresh_expires_at,
            scope = EXCLUDED.scope,
            followers_count = EXCLUDED.followers_count,
            following_count = EXCLUDED.following_count,
            likes_count = EXCLUDED.likes_count,
            video_count = EXCLUDED.video_count,
            last_synced_at = NOW(),
            updated_at = NOW();
        `, [
          record.open_id,
          record.display_name,
          record.avatar_url,
          record.access_token,
          record.expires_at,
          record.refresh_token,
          record.refresh_expires_at,
          record.scope,
          record.followers_count,
          record.following_count,
          record.likes_count,
          record.video_count
        ]);
      } catch (err: any) {
        console.warn('Erro ao salvar token do TikTok no Postgres:', err.message);
      }
    }
  }
}

/**
 * Get active TikTok token record
 */
export async function getTikTokTokenRecord(): Promise<TikTokTokenRecord | null> {
  await initTikTokTable();

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(`SELECT * FROM tiktok_tokens ORDER BY updated_at DESC LIMIT 1`);
        if (res.rows[0]) {
          const r = res.rows[0];
          return {
            id: r.id,
            open_id: r.open_id,
            display_name: r.display_name || 'ROSLEON TikTok',
            avatar_url: r.avatar_url || '',
            access_token: r.access_token,
            expires_at: new Date(r.expires_at).toISOString(),
            refresh_token: r.refresh_token,
            refresh_expires_at: r.refresh_expires_at ? new Date(r.refresh_expires_at).toISOString() : new Date().toISOString(),
            scope: r.scope || '',
            followers_count: Number(r.followers_count || 0),
            following_count: Number(r.following_count || 0),
            likes_count: Number(r.likes_count || 0),
            video_count: Number(r.video_count || 0),
            last_synced_at: r.last_synced_at ? new Date(r.last_synced_at).toISOString() : new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn('Erro ao buscar token do TikTok do Postgres:', err.message);
      }
    }
  }

  return memoryTikTokToken;
}

/**
 * Ensure valid TikTok token with automatic refresh_token renewal
 */
export async function getValidTikTokToken(): Promise<{ accessToken: string; openId: string } | null> {
  const record = await getTikTokTokenRecord();
  if (!record || !record.access_token) return null;

  const now = Date.now();
  const expiresAtMs = new Date(record.expires_at).getTime();

  // If token is still valid (with 5 min safety buffer)
  if (expiresAtMs > now + 5 * 60 * 1000) {
    return { accessToken: record.access_token, openId: record.open_id };
  }

  // Token expired, attempt refresh using refresh_token
  if (record.refresh_token) {
    const { clientKey, clientSecret } = getClientCredentials();
    try {
      console.log('Renovando access_token do TikTok via refresh_token...');
      const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: record.refresh_token
      });

      const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data && data.access_token) {
          const newExpiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString();
          const newRefreshExpiresAt = data.refresh_expires_in
            ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString()
            : record.refresh_expires_at;

          record.access_token = data.access_token;
          record.expires_at = newExpiresAt;
          if (data.refresh_token) record.refresh_token = data.refresh_token;
          record.refresh_expires_at = newRefreshExpiresAt;

          await saveTikTokTokenRecord(record);
          return { accessToken: record.access_token, openId: record.open_id };
        }
      } else {
        const errText = await res.text();
        console.warn('Erro ao renovar token TikTok:', res.status, errText);
      }
    } catch (err: any) {
      console.warn('Falha na renovação de token TikTok:', err.message);
    }
  }

  // Fallback to existing token if refresh failed but token exists
  return { accessToken: record.access_token, openId: record.open_id };
}

/**
 * Handle OAuth Callback: code exchange -> token -> user info -> store -> initial sync
 */
export async function handleTikTokCallback(code: string) {
  const { clientKey, clientSecret, redirectUri } = getClientCredentials();

  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  console.log('Trocando code do TikTok por access_token...');
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Erro na troca de código do TikTok (${tokenRes.status}): ${errText}`);
  }

  const tokenJson = await tokenRes.json();
  const data = tokenJson.data || tokenJson;

  if (!data || !data.access_token) {
    throw new Error(`Resposta do TikTok não continha access_token: ${JSON.stringify(tokenJson)}`);
  }

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token || '';
  const openId = data.open_id || 'unknown';
  const scope = data.scope || '';
  const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString();
  const refreshExpiresAt = new Date(Date.now() + (data.refresh_expires_in || 31536000) * 1000).toISOString();

  // Fetch User Info
  let displayName = 'ROSLEON TikTok';
  let avatarUrl = '';
  let followersCount = 0;
  let followingCount = 0;
  let likesCount = 0;
  let videoCount = 0;

  try {
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userRes.ok) {
      const userJson = await userRes.json();
      const uData = userJson.data?.user || userJson.data || {};
      displayName = uData.display_name || displayName;
      avatarUrl = uData.avatar_url || avatarUrl;
      followersCount = uData.follower_count || followersCount;
      followingCount = uData.following_count || followingCount;
      likesCount = uData.likes_count || likesCount;
      videoCount = uData.video_count || videoCount;
    }
  } catch (uErr: any) {
    console.warn('Erro ao buscar perfil do usuário do TikTok:', uErr.message);
  }

  const tokenRecord: TikTokTokenRecord = {
    open_id: openId,
    display_name: displayName,
    avatar_url: avatarUrl,
    access_token: accessToken,
    expires_at: expiresAt,
    refresh_token: refreshToken,
    refresh_expires_at: refreshExpiresAt,
    scope: scope,
    followers_count: followersCount,
    following_count: followingCount,
    likes_count: likesCount,
    video_count: videoCount,
    last_synced_at: new Date().toISOString()
  };

  await saveTikTokTokenRecord(tokenRecord);

  // Trigger TikTok Videos Sync
  await syncTikTokContents();

  return tokenRecord;
}

/**
 * Get Secure Status for GET /api/tiktok/status
 * CRITICAL: NEVER EXPOSE access_token, refresh_token or client_secret
 */
export async function getTikTokStatus() {
  const record = await getTikTokTokenRecord();
  
  // Count imported TikTok videos from DB
  let videosCount = 0;
  let dbLastSync: string | null = null;

  if (isPostgresActive()) {
    const pool = getPool();
    if (pool) {
      try {
        const countRes = await pool.query(`
          SELECT COUNT(*)::int as count, MAX(cm.last_synced_at) as last_sync
          FROM contents c
          LEFT JOIN content_metrics cm ON c.id = cm.content_id
          WHERE c.platform = 'tiktok'
        `);
        videosCount = countRes.rows[0]?.count || 0;
        if (countRes.rows[0]?.last_sync) {
          dbLastSync = new Date(countRes.rows[0].last_sync).toISOString();
        }
      } catch (e) {}
    }
  }

  if (!record) {
    return {
      connected: false,
      account: null,
      lastSync: dbLastSync,
      videosCount: videosCount,
      tokenStatus: 'not_connected'
    };
  }

  const now = Date.now();
  const expiresAtMs = new Date(record.expires_at).getTime();
  const tokenStatus = expiresAtMs > now ? 'active' : 'expired';

  return {
    connected: true,
    account: {
      displayName: record.display_name,
      avatarUrl: record.avatar_url,
      openId: record.open_id,
      followersCount: record.followers_count,
      followingCount: record.following_count,
      likesCount: record.likes_count,
      videoCount: record.video_count || videosCount
    },
    lastSync: record.last_synced_at || dbLastSync,
    videosCount: Math.max(record.video_count, videosCount),
    tokenStatus: tokenStatus
  };
}

/**
 * Sync TikTok User Profile and Public Videos
 */
export async function syncTikTokContents(): Promise<number> {
  const tokenInfo = await getValidTikTokToken();
  if (!tokenInfo) {
    console.log('Nenhum token ativo do TikTok encontrado para sincronização.');
    return 0;
  }

  const { accessToken } = tokenInfo;
  let importedCount = 0;

  // 1. Update user info if possible
  try {
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userRes.ok) {
      const userJson = await userRes.json();
      const uData = userJson.data?.user || userJson.data || {};
      const record = await getTikTokTokenRecord();
      if (record) {
        if (uData.display_name) record.display_name = uData.display_name;
        if (uData.avatar_url) record.avatar_url = uData.avatar_url;
        if (typeof uData.follower_count === 'number') record.followers_count = uData.follower_count;
        if (typeof uData.following_count === 'number') record.following_count = uData.following_count;
        if (typeof uData.likes_count === 'number') record.likes_count = uData.likes_count;
        if (typeof uData.video_count === 'number') record.video_count = uData.video_count;
        record.last_synced_at = new Date().toISOString();
        await saveTikTokTokenRecord(record);
      }
    }
  } catch (uErr: any) {
    console.warn('Aviso ao atualizar perfil do TikTok:', uErr.message);
  }

  // 2. Fetch public videos with pagination
  try {
    let hasMore = true;
    let cursor = 0;
    let pageCount = 0;

    while (hasMore && pageCount < 10) { // Safety max 10 pages x 20 = 200 videos
      pageCount++;
      const videoListUrl = 'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,cover_image_url,share_url,video_description,duration,like_count,comment_count,share_count,view_count';

      const listRes = await fetch(videoListUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          max_count: 20,
          cursor: cursor
        })
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        console.warn(`Erro na API do TikTok video/list (status ${listRes.status}):`, errText);
        break;
      }

      const listJson = await listRes.json();
      const listData = listJson.data || {};
      const videos = listData.videos || [];

      for (const item of videos) {
        if (!item.id) continue;

        const caption = (item.title || item.video_description || 'Vídeo TikTok').trim();
        const description = item.video_description || item.title || '';
        const url = item.share_url || `https://www.tiktok.com/@rosleonoficial/video/${item.id}`;
        const thumbnail = item.cover_image_url || '';
        const publishedAt = item.create_time ? new Date(item.create_time * 1000).toISOString() : new Date().toISOString();

        const views = Number(item.view_count || 0);
        const likes = Number(item.like_count || 0);
        const comments = Number(item.comment_count || 0);
        const shares = item.share_count !== undefined && item.share_count !== null ? Number(item.share_count) : null;
        const engagementRate = views > 0 ? parseFloat((((likes + comments + (shares || 0)) / views) * 100).toFixed(2)) : 0;

        await upsertContentToDb({
          platform: 'tiktok',
          external_id: item.id,
          title: caption,
          description: description,
          url: url,
          thumbnail_url: thumbnail,
          content_type: 'video',
          published_at: publishedAt,
          views_count: views,
          likes_count: likes,
          comments_count: comments,
          shares_count: shares,
          engagement_rate: engagementRate
        });

        importedCount++;
      }

      hasMore = Boolean(listData.has_more);
      cursor = listData.cursor || 0;
      if (!hasMore || !cursor) break;
    }

    console.log(`Sincronização TikTok concluída. ${importedCount} vídeos importados/atualizados.`);
  } catch (vErr: any) {
    console.warn('Erro durante a busca de vídeos do TikTok:', vErr.message);
  }

  return importedCount;
}

import { getPool, isPostgresActive, getMemoryStore, getDatabaseInfoSafe } from './db.js';
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
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TikTokDiagnosticError {
  stage: string;
  httpStatus: number;
  code: string;
  message: string;
  logId?: string;
  callbackReceivedAt?: string;
  tokenExchangeStartedAt?: string;
  tokenExchangeFinishedAt?: string;
  tokenExchangeDurationMs?: number;
  timeBeforeTokenExchangeMs?: number;
}

export const BUILD_MARKER = 'build-20260827-v4-persistence-commit';
export const HANDLER_VERSION = 'tiktok-persistence-v4';

let lastOAuthDiagnostic: TikTokDiagnosticError | null = null;

export async function saveOAuthDiagnosticToDb(diag: TikTokDiagnosticError) {
  lastOAuthDiagnostic = diag;
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(`
      INSERT INTO tiktok_oauth_diagnostics (stage, safe_code, message, http_status, log_id, build_marker, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      diag.stage,
      diag.code,
      diag.message,
      diag.httpStatus || 0,
      diag.logId || null,
      BUILD_MARKER
    ]);
  } catch (e: any) {
    console.warn('Aviso ao salvar diagnóstico OAuth no banco:', e.message);
  }
}

export function getClientCredentials() {
  const clientKey = (process.env.TIKTOK_CLIENT_KEY || process.env.VITE_TIKTOK_CLIENT_KEY || '').trim();
  const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || process.env.VITE_TIKTOK_CLIENT_SECRET || '').trim();
  const redirectUri = (process.env.TIKTOK_REDIRECT_URI || process.env.VITE_TIKTOK_REDIRECT_URI || 'https://links.gruporosleon.com.br/api/tiktok/callback').trim();
  
  return { clientKey, clientSecret, redirectUri };
}

/**
 * Initialize tiktok_tokens, tiktok_oauth_states and tiktok_oauth_diagnostics tables in Postgres if not exists
 */
export async function initTikTokTable() {
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
          last_error TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE tiktok_tokens ADD COLUMN IF NOT EXISTS last_error TEXT;

        CREATE TABLE IF NOT EXISTS tiktok_oauth_states (
          state VARCHAR(255) PRIMARY KEY,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tiktok_oauth_diagnostics (
          id SERIAL PRIMARY KEY,
          stage VARCHAR(100) NOT NULL,
          safe_code VARCHAR(100),
          message TEXT,
          http_status INT DEFAULT 0,
          log_id VARCHAR(255),
          build_marker VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err: any) {
      console.warn('Aviso ao criar tabelas do TikTok no Postgres:', err.message);
    }
  }
}

/**
 * Save temporary OAuth state in DB (for serverless persistence across instances)
 */
export async function saveOAuthState(state: string) {
  await initTikTokTable();
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tiktok_oauth_states (state, expires_at)
        VALUES ($1, NOW() + INTERVAL '10 minutes')
        ON CONFLICT (state) DO UPDATE SET expires_at = NOW() + INTERVAL '10 minutes'
      `, [state]);
    } catch (err: any) {
      console.warn('Aviso ao salvar OAuth state no Postgres:', err.message);
    }
  }
}

/**
 * Validate state against cookie or Postgres table, then consume (delete) it
 */
export async function validateAndDeleteOAuthState(queryState: string, cookieState?: string | null): Promise<boolean> {
  let isValid = false;

  // 1. Fast Cookie match validation (<1ms)
  if (cookieState && cookieState === queryState) {
    isValid = true;
  }

  // 2. Database persistence validation without table creation blocking
  if (!isValid) {
    const pool = getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT state FROM tiktok_oauth_states WHERE state = $1 AND expires_at > NOW()`,
          [queryState]
        );
        if (res.rows.length > 0) {
          isValid = true;
        }
      } catch (err: any) {
        console.warn('Aviso ao validar OAuth state no Postgres:', err.message);
      }
    }
  }

  // Clean up state from DB asynchronously if Postgres active
  const pool = getPool();
  if (pool) {
    pool.query(
      `DELETE FROM tiktok_oauth_states WHERE state = $1 OR expires_at < NOW()`,
      [queryState]
    ).catch(() => {});
  }

  return isValid;
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
 * Store or Update TikTok Token in PostgreSQL with IMMEDIATE read-back verification
 */
export async function saveTikTokTokenRecord(record: TikTokTokenRecord): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    console.error('ERRO CRÍTICO: PostgreSQL não disponível para persistir token do TikTok');
    throw new Error('database_not_configured');
  }

  await initTikTokTable();

  // 1. Transaction ON CONNECTION A with EXPLICIT COMMIT
  const clientA = await pool.connect();
  try {
    await clientA.query('BEGIN');

    const upsertRes = await clientA.query(`
      INSERT INTO tiktok_tokens (
        open_id, display_name, avatar_url, access_token, expires_at,
        refresh_token, refresh_expires_at, scope, followers_count,
        following_count, likes_count, video_count, last_error, last_synced_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
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
        last_error = EXCLUDED.last_error,
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
      record.video_count,
      record.last_error || null
    ]);

    await clientA.query('COMMIT');
    clientA.release();

    if ((upsertRes.rowCount ?? 0) === 0) {
      console.warn('[TikTok Persistence] Avisos: rowCount de UPSERT retornou 0');
    }

    // 2. MANDATORY READ-BACK CONFIRMATION FROM SEPARATE CONNECTION B
    const clientB = await pool.connect();
    try {
      const checkRes = await clientB.query(
        `SELECT open_id, access_token, updated_at FROM tiktok_tokens WHERE open_id = $1`,
        [record.open_id]
      );

      if (checkRes.rows.length === 0 || !checkRes.rows[0].access_token) {
        console.error('FALHA DE PERSISTÊNCIA: Registro do TikTok não encontrado no PostgreSQL após COMMIT!');
        throw new Error('token_persistence_verification_failed');
      }

      console.log(`[TikTok Persistence] Token CONFIRMADO e VERIFICADO em NOVA CONEXÃO para open_id=${record.open_id}`);
      return true;
    } finally {
      clientB.release();
    }
  } catch (err: any) {
    try {
      await clientA.query('ROLLBACK');
    } catch (e) {}
    clientA.release();
    console.error('Erro de banco ao salvar token TikTok no Postgres:', err.message);
    throw new Error(`database_error: ${err.message}`);
  }
}

/**
 * Update error status for TikTok sync
 */
export async function updateTikTokSyncError(openId: string, errorMsg: string | null) {
  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE tiktok_tokens SET last_error = $1, updated_at = NOW() WHERE open_id = $2`,
        [errorMsg, openId]
      );
    } catch (e) {}
  }
}

/**
 * Get active TikTok token record DIRECTLY from PostgreSQL (NO IN-MEMORY FALLBACK)
 */
export async function getTikTokTokenRecord(): Promise<TikTokTokenRecord | null> {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  await initTikTokTable();

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
        last_synced_at: r.last_synced_at ? new Date(r.last_synced_at).toISOString() : new Date().toISOString(),
        last_error: r.last_error || null
      };
    }
  } catch (err: any) {
    console.warn('Erro ao buscar token do TikTok do Postgres:', err.message);
  }

  return null;
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
          record.last_error = null;

          await saveTikTokTokenRecord(record);
          return { accessToken: record.access_token, openId: record.open_id };
        }
      } else {
        const errText = await res.text();
        console.warn('Erro ao renovar token TikTok:', res.status, errText);
        await updateTikTokSyncError(record.open_id, `token_refresh_failed: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.warn('Falha na renovação de token TikTok:', err.message);
      await updateTikTokSyncError(record.open_id, `token_refresh_failed: ${err.message}`);
    }
  }

  // Fallback to existing token if refresh failed but token exists
  return { accessToken: record.access_token, openId: record.open_id };
}

/**
 * Handle OAuth Callback: code exchange -> token -> user info -> store -> initial sync
 */
export async function handleTikTokCallback(code: string, callbackReceivedAtMs?: number) {
  const receivedAt = callbackReceivedAtMs || Date.now();
  const tokenExchangeStartedAtMs = Date.now();
  const timeBeforeTokenExchangeMs = tokenExchangeStartedAtMs - receivedAt;
  const callbackReceivedAtStr = new Date(receivedAt).toISOString();
  const tokenExchangeStartedAtStr = new Date(tokenExchangeStartedAtMs).toISOString();

  const { clientKey, clientSecret, redirectUri } = getClientCredentials();

  if (!clientKey) {
    lastOAuthDiagnostic = {
      stage: 'token_exchange',
      httpStatus: 0,
      code: 'missing_client_key',
      message: 'TIKTOK_CLIENT_KEY não configurado',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: new Date().toISOString(),
      tokenExchangeDurationMs: 0,
      timeBeforeTokenExchangeMs
    };
    throw new Error('missing_client_key');
  }
  if (!clientSecret) {
    lastOAuthDiagnostic = {
      stage: 'token_exchange',
      httpStatus: 0,
      code: 'missing_client_secret',
      message: 'TIKTOK_CLIENT_SECRET não configurado',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: new Date().toISOString(),
      tokenExchangeDurationMs: 0,
      timeBeforeTokenExchangeMs
    };
    throw new Error('missing_client_secret');
  }
  if (!redirectUri) {
    lastOAuthDiagnostic = {
      stage: 'token_exchange',
      httpStatus: 0,
      code: 'missing_redirect_uri',
      message: 'TIKTOK_REDIRECT_URI não configurado',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: new Date().toISOString(),
      tokenExchangeDurationMs: 0,
      timeBeforeTokenExchangeMs
    };
    throw new Error('missing_redirect_uri');
  }

  const params = new URLSearchParams();
  params.set('client_key', clientKey);
  params.set('client_secret', clientSecret);
  params.set('code', code);
  params.set('grant_type', 'authorization_code');
  params.set('redirect_uri', redirectUri);

  console.log(`[OAuth TikTok] Troca de token iniciada IMEDIATAMENTE. timeBeforeTokenExchangeMs=${timeBeforeTokenExchangeMs}ms`);

  // 1. IMMEDIATE TOKEN EXCHANGE
  let tokenRes: Response;
  try {
    tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
  } catch (netErr: any) {
    const tokenExchangeFinishedAtMs = Date.now();
    lastOAuthDiagnostic = {
      stage: 'token_exchange',
      httpStatus: 0,
      code: 'network_error',
      message: netErr.message || 'Erro de rede na troca de código',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: new Date(tokenExchangeFinishedAtMs).toISOString(),
      tokenExchangeDurationMs: tokenExchangeFinishedAtMs - tokenExchangeStartedAtMs,
      timeBeforeTokenExchangeMs
    };
    throw new Error('token_exchange_failed');
  }

  const tokenExchangeFinishedAtMs = Date.now();
  const tokenExchangeDurationMs = tokenExchangeFinishedAtMs - tokenExchangeStartedAtMs;
  const tokenExchangeFinishedAtStr = new Date(tokenExchangeFinishedAtMs).toISOString();

  const httpStatus = tokenRes.status;
  let tokenJson: any = {};
  try {
    tokenJson = await tokenRes.json();
  } catch (parseErr: any) {
    const rawText = await tokenRes.text().catch(() => '');
    lastOAuthDiagnostic = {
      stage: 'token_exchange',
      httpStatus,
      code: 'non_json_response',
      message: rawText ? rawText.substring(0, 200) : 'Resposta não-JSON do TikTok',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: tokenExchangeFinishedAtStr,
      tokenExchangeDurationMs,
      timeBeforeTokenExchangeMs
    };
    throw new Error('token_exchange_failed');
  }

  const data = tokenJson.data || tokenJson;

  const isError = !tokenRes.ok || Boolean(tokenJson.error) || Boolean(tokenJson.error_code) || Boolean(data?.error) || Boolean(data?.error_code) || !data?.access_token;

  if (isError) {
    let rawCode = tokenJson.error?.code || tokenJson.error || tokenJson.error_code || data?.error_code || data?.error || 'token_exchange_failed';
    if (typeof rawCode === 'object') rawCode = rawCode.code || JSON.stringify(rawCode);

    let rawMessage = tokenJson.error?.message || tokenJson.error_description || tokenJson.message || data?.description || data?.message || 'Falha ao trocar código por access_token';
    if (typeof rawMessage === 'object') rawMessage = rawMessage.message || JSON.stringify(rawMessage);

    const logId = tokenJson.log_id || data?.log_id || tokenJson.error?.log_id || undefined;

    const diag = {
      stage: 'token_exchange',
      httpStatus,
      code: String(rawCode),
      message: String(rawMessage),
      ...(logId ? { logId: String(logId) } : {}),
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: tokenExchangeFinishedAtStr,
      tokenExchangeDurationMs,
      timeBeforeTokenExchangeMs
    };

    await saveOAuthDiagnosticToDb(diag);
    console.error('[OAuth TikTok] Erro no token exchange:', diag);
    throw new Error('token_exchange_failed');
  }

  // Record success diagnostic timing
  await saveOAuthDiagnosticToDb({
    stage: 'token_exchange_success',
    httpStatus,
    code: 'success',
    message: 'Token trocado com sucesso',
    callbackReceivedAt: callbackReceivedAtStr,
    tokenExchangeStartedAt: tokenExchangeStartedAtStr,
    tokenExchangeFinishedAt: tokenExchangeFinishedAtStr,
    tokenExchangeDurationMs,
    timeBeforeTokenExchangeMs
  });

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token || '';
  const openId = data.open_id || 'unknown';
  const scope = data.scope || '';
  const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000).toISOString();
  const refreshExpiresAt = new Date(Date.now() + (data.refresh_expires_in || 31536000) * 1000).toISOString();

  // 2. PERSIST TOKEN IMMEDIATELY AFTER EXCHANGE
  const tokenRecord: TikTokTokenRecord = {
    open_id: openId,
    display_name: 'ROSLEON TikTok',
    avatar_url: '',
    access_token: accessToken,
    expires_at: expiresAt,
    refresh_token: refreshToken,
    refresh_expires_at: refreshExpiresAt,
    scope: scope,
    followers_count: 0,
    following_count: 0,
    likes_count: 0,
    video_count: 0,
    last_synced_at: new Date().toISOString(),
    last_error: null
  };

  // Ensure DB tables exist now (after successful token exchange)
  await initTikTokTable();
  try {
    await saveTikTokTokenRecord(tokenRecord);
  } catch (persistErr: any) {
    console.error('Falha de persistência no PostgreSQL ao salvar token TikTok:', persistErr.message);
    lastOAuthDiagnostic = {
      stage: 'token_persistence',
      httpStatus: 0,
      code: 'token_persistence_failed',
      message: persistErr.message || 'Falha de persistência no PostgreSQL',
      callbackReceivedAt: callbackReceivedAtStr,
      tokenExchangeStartedAt: tokenExchangeStartedAtStr,
      tokenExchangeFinishedAt: tokenExchangeFinishedAtStr,
      tokenExchangeDurationMs,
      timeBeforeTokenExchangeMs
    };
    throw new Error('token_persistence_failed');
  }

  // 3. FETCH USER PROFILE INFO (AFTER TOKEN SAVED)
  try {
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userRes.ok) {
      const userJson = await userRes.json();
      const uData = userJson.data?.user || userJson.data || {};
      tokenRecord.display_name = uData.display_name || tokenRecord.display_name;
      tokenRecord.avatar_url = uData.avatar_url || tokenRecord.avatar_url;
      tokenRecord.followers_count = uData.follower_count || 0;
      tokenRecord.following_count = uData.following_count || 0;
      tokenRecord.likes_count = uData.likes_count || 0;
      tokenRecord.video_count = uData.video_count || 0;
      tokenRecord.last_synced_at = new Date().toISOString();

      await saveTikTokTokenRecord(tokenRecord);
    }
  } catch (uErr: any) {
    console.warn('Aviso ao consultar perfil do TikTok:', uErr.message);
  }

  // 4. INITIAL CONTENT SYNC
  try {
    await syncTikTokContents();
  } catch (syncErr: any) {
    console.error('Falha na sincronização inicial de vídeos TikTok (conexão OAuth mantida):', syncErr.message);
    await updateTikTokSyncError(openId, `sync_failed: ${syncErr.message}`);
  }

  return tokenRecord;
}

/**
 * Get Secure Status for GET /api/tiktok/status
 * CRITICAL: NEVER EXPOSE access_token, refresh_token or client_secret
 */
export async function getTikTokStatus() {
  await initTikTokTable();
  const dbInfo = getDatabaseInfoSafe();

  // Count imported TikTok videos from DB
  let videosCount = 0;
  let dbLastSync: string | null = null;

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

  const record = await getTikTokTokenRecord();

  if (!record) {
    let persistentDiagnostic: any = lastOAuthDiagnostic;
    if (!persistentDiagnostic && pool) {
      try {
        const diagRes = await pool.query(
          `SELECT stage, safe_code as code, message, http_status as "httpStatus", log_id as "logId", build_marker as "buildMarker", created_at as "timestamp"
           FROM tiktok_oauth_diagnostics ORDER BY created_at DESC LIMIT 1`
        );
        if (diagRes.rows[0]) {
          persistentDiagnostic = diagRes.rows[0];
        }
      } catch (e) {}
    }

    return {
      success: true,
      connected: false,
      account: null,
      lastSync: dbLastSync,
      videosCount: videosCount,
      tokenStatus: 'not_connected',
      dbInfo,
      lastError: persistentDiagnostic
    };
  }

  const now = Date.now();
  const expiresAtMs = new Date(record.expires_at).getTime();
  const refreshExpiresAtMs = record.refresh_expires_at ? new Date(record.refresh_expires_at).getTime() : expiresAtMs;

  let tokenStatus: 'active' | 'expired' | 'refresh_required' | 'not_connected' = 'active';

  if (expiresAtMs > now) {
    tokenStatus = 'active';
  } else if (refreshExpiresAtMs > now) {
    tokenStatus = 'refresh_required';
  } else {
    tokenStatus = 'expired';
  }

  return {
    success: true,
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
    videosCount: Math.max(record.video_count || 0, videosCount),
    tokenStatus: tokenStatus,
    dbInfo,
    lastError: lastOAuthDiagnostic || (record.last_error ? { stage: 'sync', httpStatus: 0, code: 'sync_error', message: record.last_error } : null)
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

    while (hasMore && pageCount < 50) { // Max 50 pages x 20 = 1000 videos max
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


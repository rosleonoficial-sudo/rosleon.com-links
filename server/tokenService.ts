import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TOKENS_CONFIG_PATH = path.join(process.cwd(), 'server', 'data', 'tokens_config.json');

export interface TokensConfig {
  instagramAccessToken?: string;
  sourceEnvTokenHash?: string;
  instagramUserId?: string;
  instagramTokenExpiredAt?: string | null;
  instagramTokenExpiresAt?: string | null;
  instagramLastCheckedAt?: string;
  instagramLastRefreshedAt?: string;
  instagramLastError?: string | null;
  instagramLastErrorDetails?: {
    endpoint?: string;
    code?: number | string;
    subcode?: number | string;
    type?: string;
    message?: string;
  } | null;
  instagramUsername?: string;
  instagramFollowersCount?: number | null;
  instagramProfilePictureUrl?: string;
  tokenType?: 'instagram_login' | 'meta_graph' | 'unknown';
}

function hashToken(token: string): string {
  return token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 16) : '';
}

function detectTokenType(token: string): 'instagram_login' | 'meta_graph' | 'unknown' {
  const clean = token.trim();
  if (!clean) return 'unknown';
  if (clean.startsWith('IG')) return 'instagram_login';
  if (clean.startsWith('EAA')) return 'meta_graph';
  return 'unknown';
}

export function sanitizeTokenFromText(text: string, token?: string): string {
  let out = String(text || '');
  if (token && token.length > 6) {
    out = out.split(token).join('***');
  }
  out = out.replace(/IG[A-Za-z0-9_-]{15,}/g, 'IG***');
  out = out.replace(/EAA[A-Za-z0-9_-]{15,}/g, 'EAA***');
  return out;
}

function getEnvInstagramTokenDetails(): { varName: string | null; token: string } {
  const candidates: Array<[string, string | undefined]> = [
    ['INSTAGRAM_ACCESS_TOKEN', process.env.INSTAGRAM_ACCESS_TOKEN],
    ['META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN],
    ['IG_ACCESS_TOKEN', process.env.IG_ACCESS_TOKEN],
    ['INSTAGRAM_TOKEN', process.env.INSTAGRAM_TOKEN]
  ];
  for (const [varName, raw] of candidates) {
    const clean = (raw || '').trim();
    if (clean) {
      return { varName, token: clean };
    }
  }
  return { varName: null, token: '' };
}

function getEnvInstagramToken(): string {
  return getEnvInstagramTokenDetails().token;
}

function getEnvInstagramUserId(): string {
  return (
    process.env.INSTAGRAM_USER_ID ||
    process.env.META_USER_ID ||
    process.env.IG_USER_ID ||
    '17841461297140253'
  ).trim();
}

let inMemoryTokens: TokensConfig = {
  instagramAccessToken: getEnvInstagramToken(),
  sourceEnvTokenHash: hashToken(getEnvInstagramToken()),
  instagramUserId: getEnvInstagramUserId(),
  instagramLastError: null,
  instagramLastErrorDetails: null,
  tokenType: detectTokenType(getEnvInstagramToken())
};

// Load saved config on boot with smart conflict resolution
function loadTokensFromDisk() {
  try {
    const envToken = getEnvInstagramToken();
    const envHash = hashToken(envToken);
    if (fs.existsSync(TOKENS_CONFIG_PATH)) {
      const raw = fs.readFileSync(TOKENS_CONFIG_PATH, 'utf-8');
      const parsed: TokensConfig = JSON.parse(raw);
      if (parsed) {
        const envChanged = Boolean(
          envToken &&
          (
            (parsed.sourceEnvTokenHash && parsed.sourceEnvTokenHash !== envHash) ||
            (!parsed.sourceEnvTokenHash && parsed.instagramAccessToken !== envToken)
          )
        );

        if (envChanged) {
          console.log('[TokenService] Novo INSTAGRAM_ACCESS_TOKEN detectado nos Secrets. Priorizando Secret.');
          inMemoryTokens.instagramAccessToken = envToken;
          inMemoryTokens.sourceEnvTokenHash = envHash;
          inMemoryTokens.tokenType = detectTokenType(envToken);
          inMemoryTokens.instagramLastError = null;
          inMemoryTokens.instagramLastErrorDetails = null;
          inMemoryTokens.instagramTokenExpiredAt = null;
          inMemoryTokens.instagramTokenExpiresAt = null;
          inMemoryTokens.instagramLastRefreshedAt = undefined;
          saveTokensToDisk();
        } else if (parsed.instagramAccessToken && !parsed.instagramTokenExpiredAt) {
          inMemoryTokens.instagramAccessToken = parsed.instagramAccessToken;
          inMemoryTokens.sourceEnvTokenHash = parsed.sourceEnvTokenHash || envHash;
          inMemoryTokens.tokenType = detectTokenType(parsed.instagramAccessToken);
        } else if (envToken) {
          inMemoryTokens.instagramAccessToken = envToken;
          inMemoryTokens.sourceEnvTokenHash = envHash;
          inMemoryTokens.tokenType = detectTokenType(envToken);
        } else if (parsed.instagramAccessToken) {
          inMemoryTokens.instagramAccessToken = parsed.instagramAccessToken;
          inMemoryTokens.tokenType = detectTokenType(parsed.instagramAccessToken);
        }

        if (parsed.instagramUserId) {
          inMemoryTokens.instagramUserId = parsed.instagramUserId;
        }
        if (!envChanged && parsed.instagramLastError && inMemoryTokens.instagramAccessToken === parsed.instagramAccessToken) {
          inMemoryTokens.instagramLastError = parsed.instagramLastError;
          inMemoryTokens.instagramLastErrorDetails = parsed.instagramLastErrorDetails || null;
        }
        if (!envChanged && parsed.instagramTokenExpiredAt && inMemoryTokens.instagramAccessToken === parsed.instagramAccessToken) {
          inMemoryTokens.instagramTokenExpiredAt = parsed.instagramTokenExpiredAt;
        }
        if (!envChanged && parsed.instagramTokenExpiresAt) {
          inMemoryTokens.instagramTokenExpiresAt = parsed.instagramTokenExpiresAt;
        }
        if (!envChanged && parsed.instagramLastRefreshedAt) {
          inMemoryTokens.instagramLastRefreshedAt = parsed.instagramLastRefreshedAt;
        }
        if (parsed.instagramUsername) {
          inMemoryTokens.instagramUsername = parsed.instagramUsername;
        }
        if (typeof parsed.instagramFollowersCount === 'number') {
          inMemoryTokens.instagramFollowersCount = parsed.instagramFollowersCount;
        }
        if (parsed.instagramProfilePictureUrl) {
          inMemoryTokens.instagramProfilePictureUrl = parsed.instagramProfilePictureUrl;
        }
      }
    }
  } catch (err: any) {
    console.warn('[TokenService] Aviso ao carregar tokens_config.json:', err.message);
  }
}

loadTokensFromDisk();

function saveTokensToDisk() {
  try {
    const dir = path.dirname(TOKENS_CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKENS_CONFIG_PATH, JSON.stringify(inMemoryTokens, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[TokenService] Erro ao salvar tokens_config.json:', err.message);
  }
}

export function getInstagramToken(): string {
  const envToken = getEnvInstagramToken();
  const envHash = hashToken(envToken);
  if (envToken && inMemoryTokens.sourceEnvTokenHash !== envHash) {
    inMemoryTokens.instagramAccessToken = envToken;
    inMemoryTokens.sourceEnvTokenHash = envHash;
    inMemoryTokens.tokenType = detectTokenType(envToken);
    inMemoryTokens.instagramLastError = null;
    inMemoryTokens.instagramLastErrorDetails = null;
    inMemoryTokens.instagramTokenExpiredAt = null;
  }
  return inMemoryTokens.instagramAccessToken || envToken || '';
}

export function getInstagramUserId(): string {
  return inMemoryTokens.instagramUserId || getEnvInstagramUserId();
}

export function setInstagramToken(token: string, userId?: string, username?: string, expiresAt?: string) {
  const clean = token.trim();
  inMemoryTokens.instagramAccessToken = clean;
  inMemoryTokens.sourceEnvTokenHash = hashToken(getEnvInstagramToken());
  if (userId) inMemoryTokens.instagramUserId = userId.trim();
  if (username) inMemoryTokens.instagramUsername = username.trim();
  if (expiresAt) inMemoryTokens.instagramTokenExpiresAt = expiresAt;
  inMemoryTokens.tokenType = detectTokenType(clean);
  inMemoryTokens.instagramLastError = null;
  inMemoryTokens.instagramLastErrorDetails = null;
  inMemoryTokens.instagramTokenExpiredAt = null;
  inMemoryTokens.instagramLastCheckedAt = new Date().toISOString();
  saveTokensToDisk();
}

export function updateInstagramProfileMeta(meta: {
  userId?: string;
  username?: string;
  followersCount?: number;
  profilePictureUrl?: string;
}) {
  if (meta.userId) inMemoryTokens.instagramUserId = String(meta.userId).trim();
  if (meta.username) inMemoryTokens.instagramUsername = String(meta.username).trim();
  if (typeof meta.followersCount === 'number') inMemoryTokens.instagramFollowersCount = meta.followersCount;
  if (meta.profilePictureUrl) inMemoryTokens.instagramProfilePictureUrl = meta.profilePictureUrl;
  inMemoryTokens.instagramLastError = null;
  inMemoryTokens.instagramLastErrorDetails = null;
  inMemoryTokens.instagramTokenExpiredAt = null;
  inMemoryTokens.instagramLastCheckedAt = new Date().toISOString();
  saveTokensToDisk();
}

export function recordInstagramError(
  errorMsg: string,
  isExpired: boolean = false,
  expiredDate?: string,
  details?: {
    endpoint?: string;
    code?: number | string;
    subcode?: number | string;
    type?: string;
    message?: string;
  }
) {
  const token = getInstagramToken();
  inMemoryTokens.instagramLastError = sanitizeTokenFromText(errorMsg, token);
  inMemoryTokens.instagramLastErrorDetails = details
    ? {
        ...details,
        message: details.message ? sanitizeTokenFromText(details.message, token) : undefined
      }
    : null;
  inMemoryTokens.instagramLastCheckedAt = new Date().toISOString();
  if (isExpired) {
    inMemoryTokens.instagramTokenExpiredAt = expiredDate || new Date().toISOString();
  }
  saveTokensToDisk();
}

/**
 * Test Instagram token strictly against Instagram API with Instagram Login (graph.instagram.com)
 * Permissions: instagram_business_basic, instagram_business_manage_insights
 */
export async function testInstagramToken(token: string, _userId?: string): Promise<{
  valid: boolean;
  error?: string;
  errorCode?: number | string;
  errorSubcode?: number | string;
  isExpired?: boolean;
  expiredDate?: string;
  profile?: any;
  tokenType?: 'instagram_login' | 'meta_graph' | 'unknown';
}> {
  const targetToken = token.trim();
  if (!targetToken) {
    return { valid: false, error: 'Token não pode estar vazio.' };
  }

  const detectedType = detectTokenType(targetToken);

  try {
    const igLoginUrl = `https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,account_type,profile_picture_url,followers_count,media_count&access_token=${encodeURIComponent(targetToken)}`;
    const igRes = await fetch(igLoginUrl);

    if (igRes.ok) {
      const igData = await igRes.json();
      return {
        valid: true,
        profile: igData,
        tokenType: 'instagram_login'
      };
    }

    const errJson = await igRes.json().catch(() => null);
    const err = errJson?.error;

    // If a specific optional field caused code 100, retry with minimal fields on graph.instagram.com
    if (err?.code === 100) {
      const minimalUrl = `https://graph.instagram.com/v21.0/me?fields=id,username,account_type,followers_count,media_count&access_token=${encodeURIComponent(targetToken)}`;
      const minimalRes = await fetch(minimalUrl);
      if (minimalRes.ok) {
        const minData = await minimalRes.json();
        return {
          valid: true,
          profile: minData,
          tokenType: 'instagram_login'
        };
      }
    }

    const rawMsg = err?.message || `HTTP ${igRes.status}`;
    const errMsg = sanitizeTokenFromText(rawMsg, targetToken);

    if (detectedType === 'meta_graph') {
      return {
        valid: false,
        errorCode: err?.code ?? 190,
        errorSubcode: err?.error_subcode,
        error: `Meta (${err?.code ?? 190}): ${errMsg}. O token configurado inicia com 'EAA...' (fluxo antigo via Página do Facebook/Usuário do Sistema) e não é aceito por graph.instagram.com. Gere um token na 'Instagram API with Instagram Login' (iniciado por 'IGAA...') com as permissões instagram_business_basic e instagram_business_manage_insights.`,
        tokenType: 'meta_graph'
      };
    }

    const isExpired = err?.code === 190 || err?.error_subcode === 463 || errMsg.includes('Session has expired') || errMsg.includes('expired');
    let expiredDate = undefined;
    if (errMsg.includes('Session has expired on')) {
      const match = errMsg.match(/Session has expired on ([^.]+)/);
      if (match) expiredDate = match[1].trim();
    }

    return {
      valid: false,
      errorCode: err?.code,
      errorSubcode: err?.error_subcode,
      error: errMsg,
      isExpired,
      expiredDate,
      tokenType: detectedType
    };
  } catch (netErr: any) {
    return {
      valid: false,
      error: `Erro de rede ao conectar com graph.instagram.com: ${netErr.message}`
    };
  }
}

/**
 * Renews an Instagram Long-Lived Token (valid for 60 days) via graph.instagram.com/refresh_access_token.
 * Requirement: Token must be long-lived Instagram Login token, valid, at least 24h old, and not yet expired.
 */
export async function refreshInstagramToken(tokenToRefresh?: string): Promise<{
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  expiresAt?: string;
  errorCode?: number | string;
  error?: string;
}> {
  const currentToken = (tokenToRefresh || getInstagramToken()).trim();
  if (!currentToken) {
    return { success: false, error: 'Nenhum token disponível para renovação.' };
  }

  if (currentToken.startsWith('EAA')) {
    return {
      success: false,
      errorCode: 190,
      error: "Token do tipo 'EAA...' não suporta /refresh_access_token em graph.instagram.com."
    };
  }

  try {
    const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;
    const res = await fetch(refreshUrl);

    if (res.ok) {
      const json = await res.json();
      if (json && json.access_token) {
        const expiresInSec = typeof json.expires_in === 'number' ? json.expires_in : 5184000; // ~60 days
        const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

        console.log(`[Instagram API] Token renovado com sucesso via graph.instagram.com/refresh_access_token! Válido por mais ${Math.round(expiresInSec / 86400)} dias (até ${expiresAt}).`);

        inMemoryTokens.instagramAccessToken = json.access_token;
        inMemoryTokens.tokenType = detectTokenType(json.access_token);
        inMemoryTokens.instagramTokenExpiresAt = expiresAt;
        inMemoryTokens.instagramLastRefreshedAt = new Date().toISOString();
        inMemoryTokens.instagramLastError = null;
        inMemoryTokens.instagramLastErrorDetails = null;
        inMemoryTokens.instagramTokenExpiredAt = null;
        saveTokensToDisk();

        return {
          success: true,
          accessToken: json.access_token,
          expiresIn: expiresInSec,
          expiresAt
        };
      }
    }

    const errJson = await res.json().catch(() => null);
    const err = errJson?.error;
    const rawErr = err?.message || `HTTP ${res.status}`;
    const sanitizedErr = sanitizeTokenFromText(rawErr, currentToken);

    console.warn(`[Instagram API] Renovação do token não aplicada (code ${err?.code ?? res.status}): ${sanitizedErr}`);
    return {
      success: false,
      errorCode: err?.code ?? res.status,
      error: sanitizedErr
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro de rede ao renovar token: ${err.message}`
    };
  }
}

/**
 * Automatically refresh long-lived token if eligible (>12h since last refresh)
 */
export async function refreshInstagramTokenIfEligible(): Promise<string | null> {
  const currentToken = getInstagramToken();
  if (!currentToken || currentToken.startsWith('EAA')) {
    return null;
  }

  if (inMemoryTokens.instagramLastRefreshedAt) {
    const lastMs = new Date(inMemoryTokens.instagramLastRefreshedAt).getTime();
    if (!isNaN(lastMs) && Date.now() - lastMs < 12 * 60 * 60 * 1000) {
      return null;
    }
  }

  const result = await refreshInstagramToken(currentToken);
  return result.success && result.accessToken ? result.accessToken : null;
}

export function getInstagramTokenStatus() {
  const token = getInstagramToken();
  const tokenPreview = token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : '';
  const tokenType = detectTokenType(token);

  const envDetails = getEnvInstagramTokenDetails();
  const envToken = envDetails.token;
  const envTokenPreview = envToken.length > 10 ? `${envToken.slice(0, 6)}...${envToken.slice(-4)}` : '';
  const envMatchesActiveToken = Boolean(envToken && token && envToken === token);
  const tokenSource = !token
    ? 'none'
    : envMatchesActiveToken
    ? 'env_secret'
    : 'modal_or_disk';

  return {
    hasToken: Boolean(token),
    tokenPreview,
    tokenType,
    tokenSource,
    envSecretConfigured: Boolean(envToken),
    envSecretVarName: envDetails.varName,
    envSecretType: envToken ? detectTokenType(envToken) : 'none',
    envSecretPreview: envTokenPreview || null,
    envMatchesActiveToken,
    userId: getInstagramUserId(),
    username: inMemoryTokens.instagramUsername || 'rosleonoficial',
    followersCount: inMemoryTokens.instagramFollowersCount ?? null,
    profilePictureUrl: inMemoryTokens.instagramProfilePictureUrl || null,
    isExpired: Boolean(inMemoryTokens.instagramTokenExpiredAt),
    expiredDate: inMemoryTokens.instagramTokenExpiredAt,
    expiresAt: inMemoryTokens.instagramTokenExpiresAt,
    lastRefreshedAt: inMemoryTokens.instagramLastRefreshedAt,
    lastCheckedAt: inMemoryTokens.instagramLastCheckedAt,
    lastError: inMemoryTokens.instagramLastError,
    lastErrorDetails: inMemoryTokens.instagramLastErrorDetails || null
  };
}

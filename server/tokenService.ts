import fs from 'fs';
import path from 'path';

const TOKENS_CONFIG_PATH = path.join(process.cwd(), 'server', 'data', 'tokens_config.json');

export interface TokensConfig {
  instagramAccessToken?: string;
  instagramUserId?: string;
  instagramTokenExpiredAt?: string | null;
  instagramLastCheckedAt?: string;
  instagramLastError?: string | null;
  instagramUsername?: string;
}

function getEnvInstagramToken(): string {
  return (
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.INSTAGRAM_TOKEN ||
    ''
  ).trim();
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
  instagramUserId: getEnvInstagramUserId(),
  instagramLastError: null
};

// Load saved config on boot with smart conflict resolution
function loadTokensFromDisk() {
  try {
    const envToken = getEnvInstagramToken();
    if (fs.existsSync(TOKENS_CONFIG_PATH)) {
      const raw = fs.readFileSync(TOKENS_CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        // If an env token is set and differs from the disk token, env secret ALWAYS takes precedence!
        if (envToken && parsed.instagramAccessToken !== envToken) {
          console.log('[TokenService] Novo token detectado nas variáveis de ambiente. Priorizando Secret.');
          inMemoryTokens.instagramAccessToken = envToken;
          inMemoryTokens.instagramLastError = null;
          inMemoryTokens.instagramTokenExpiredAt = null;
        } else if (parsed.instagramAccessToken) {
          inMemoryTokens.instagramAccessToken = parsed.instagramAccessToken;
        }

        if (parsed.instagramUserId) {
          inMemoryTokens.instagramUserId = parsed.instagramUserId;
        }
        if (parsed.instagramLastError && inMemoryTokens.instagramAccessToken === parsed.instagramAccessToken) {
          inMemoryTokens.instagramLastError = parsed.instagramLastError;
        }
        if (parsed.instagramTokenExpiredAt && inMemoryTokens.instagramAccessToken === parsed.instagramAccessToken) {
          inMemoryTokens.instagramTokenExpiredAt = parsed.instagramTokenExpiredAt;
        }
        if (parsed.instagramUsername) {
          inMemoryTokens.instagramUsername = parsed.instagramUsername;
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
  return inMemoryTokens.instagramAccessToken || process.env.INSTAGRAM_ACCESS_TOKEN || '';
}

export function getInstagramUserId(): string {
  return inMemoryTokens.instagramUserId || process.env.INSTAGRAM_USER_ID || '17841461297140253';
}

export function setInstagramToken(token: string, userId?: string, username?: string) {
  inMemoryTokens.instagramAccessToken = token.trim();
  if (userId) inMemoryTokens.instagramUserId = userId.trim();
  if (username) inMemoryTokens.instagramUsername = username.trim();
  inMemoryTokens.instagramLastError = null;
  inMemoryTokens.instagramTokenExpiredAt = null;
  inMemoryTokens.instagramLastCheckedAt = new Date().toISOString();
  saveTokensToDisk();
}

export function recordInstagramError(errorMsg: string, isExpired: boolean = false, expiredDate?: string) {
  inMemoryTokens.instagramLastError = errorMsg;
  inMemoryTokens.instagramLastCheckedAt = new Date().toISOString();
  if (isExpired) {
    inMemoryTokens.instagramTokenExpiredAt = expiredDate || new Date().toISOString();
  }
  saveTokensToDisk();
}

/**
 * Test Instagram token against Meta Graph API
 */
export async function testInstagramToken(token: string, userId?: string): Promise<{
  valid: boolean;
  error?: string;
  isExpired?: boolean;
  expiredDate?: string;
  profile?: any;
  tokenType?: 'instagram_basic' | 'meta_graph';
}> {
  const targetToken = token.trim();
  if (!targetToken) {
    return { valid: false, error: 'Token não pode estar vazio.' };
  }

  const isMetaGraphToken = targetToken.startsWith('EAA');
  const targetUserId = userId?.trim() || getInstagramUserId();

  try {
    // 1. If Meta Graph API Token (EAA...)
    if (isMetaGraphToken) {
      // Try /v21.0/{targetUserId} or /v21.0/me
      const fbUrl = targetUserId
        ? `https://graph.facebook.com/v21.0/${targetUserId}?fields=id,username,name,followers_count,media_count&access_token=${targetToken}`
        : `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${targetToken}`;
      
      const fbRes = await fetch(fbUrl);
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        return {
          valid: true,
          profile: fbData,
          tokenType: 'meta_graph'
        };
      }

      const errJson = await fbRes.json().catch(() => null);
      const err = errJson?.error;
      const errMsg = (err?.message || `HTTP ${fbRes.status}`).replace(targetToken, '***');
      const isExpired = err?.code === 190 || err?.error_subcode === 463 || errMsg.includes('Session has expired') || errMsg.includes('expired');

      return {
        valid: false,
        error: errMsg,
        isExpired,
        tokenType: 'meta_graph'
      };
    }

    // 2. Instagram User / Basic Display Token (IGA...)
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${targetToken}`);
    if (meRes.ok) {
      const meData = await meRes.json();
      return {
        valid: true,
        profile: meData,
        tokenType: 'instagram_basic'
      };
    }

    const errJson = await meRes.json().catch(() => null);
    const err = errJson?.error;
    const errMsg = (err?.message || `HTTP ${meRes.status}`).replace(targetToken, '***');
    const isExpired = err?.code === 190 || err?.error_subcode === 463 || errMsg.includes('Session has expired') || errMsg.includes('expired');

    let expiredDate = undefined;
    if (errMsg.includes('Session has expired on')) {
      const match = errMsg.match(/Session has expired on ([^.]+)/);
      if (match) expiredDate = match[1].trim();
    }

    return {
      valid: false,
      error: errMsg,
      isExpired,
      expiredDate,
      tokenType: 'instagram_basic'
    };
  } catch (netErr: any) {
    return {
      valid: false,
      error: `Erro de rede ao conectar com a Meta: ${netErr.message}`
    };
  }
}

/**
 * Automatically refresh long-lived token if it is still valid and eligible (>24h old and <60 days old)
 */
export async function refreshInstagramTokenIfEligible(): Promise<string | null> {
  const currentToken = getInstagramToken();
  if (!currentToken) return null;

  try {
    const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;
    const res = await fetch(refreshUrl);
    if (res.ok) {
      const json = await res.json();
      if (json && json.access_token) {
        console.log('[Instagram API] Token renovado com sucesso pela Meta!');
        setInstagramToken(json.access_token);
        return json.access_token;
      }
    }
  } catch (err: any) {
    console.warn('[Instagram API] Tentativa de renovação do token:', err.message);
  }
  return null;
}

export function getInstagramTokenStatus() {
  return {
    hasToken: Boolean(inMemoryTokens.instagramAccessToken),
    userId: getInstagramUserId(),
    username: inMemoryTokens.instagramUsername || 'rosleonoficial',
    isExpired: Boolean(inMemoryTokens.instagramTokenExpiredAt),
    expiredDate: inMemoryTokens.instagramTokenExpiredAt,
    lastCheckedAt: inMemoryTokens.instagramLastCheckedAt,
    lastError: inMemoryTokens.instagramLastError
  };
}

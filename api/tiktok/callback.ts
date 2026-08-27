import { handleTikTokCallback, validateAndDeleteOAuthState } from '../../server/tiktokService.js';

function parseCookie(cookieHeader?: string, name?: string): string | null {
  if (!cookieHeader || !name) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) {
      return decodeURIComponent(c.substring(name.length + 1));
    }
  }
  return null;
}

export default async function handler(req: any, res: any) {
  const callbackReceivedAtMs = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = req.query?.code || req.query?.auth_code;
  const state = req.query?.state;
  const error = req.query?.error;
  const errorDescription = req.query?.error_description;

  // Clear state cookie on callback
  res.setHeader('Set-Cookie', 'tiktok_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (error) {
    console.error('Erro retornado pelo TikTok OAuth:', error, errorDescription);
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=provider_rejected');
  }

  if (!code) {
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=missing_code');
  }

  if (!state) {
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=state_invalid');
  }

  try {
    // Read state from cookie or request header
    const cookieState = req.cookies?.tiktok_oauth_state || parseCookie(req.headers?.cookie, 'tiktok_oauth_state');

    // FAST state validation: cookie check first (<1ms), fast DB query fallback
    const isValidState = await validateAndDeleteOAuthState(String(state), cookieState);
    if (!isValidState) {
      console.error('State de OAuth inválido ou expirado:', { queryState: state, cookieState });
      return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=state_invalid');
    }

    // Process IMMEDIATE code exchange
    await handleTikTokCallback(String(code), callbackReceivedAtMs);

    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=connected');
  } catch (err: any) {
    console.error('Erro na rota /api/tiktok/callback:', err);
    
    let reason = 'token_exchange_failed';
    const msg = err.message || '';
    if (['missing_client_key', 'missing_client_secret', 'missing_redirect_uri', 'token_persistence_failed', 'state_invalid'].includes(msg)) {
      reason = msg;
    } else if (msg.includes('database') || msg.includes('persistence')) {
      reason = 'token_persistence_failed';
    } else if (msg.includes('account') || msg.includes('user_info')) {
      reason = 'account_fetch_failed';
    }

    return res.redirect(302, `https://links.gruporosleon.com.br/resultados?tiktok=error&reason=${reason}`);
  }
}


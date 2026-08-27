import { getTikTokAuthUrl, saveOAuthState } from '../../server/tiktokService.js';
import { initDatabase } from '../../server/db.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Save state to PostgreSQL table (persists across serverless instances)
    await saveOAuthState(state);

    // Save state in HttpOnly, Secure, SameSite=Lax cookie (max-age 10 minutes)
    res.setHeader('Set-Cookie', `tiktok_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

    const authUrl = getTikTokAuthUrl(state);

    if (req.query?.json === 'true' || req.headers?.accept?.includes('application/json')) {
      return res.status(200).json({ success: true, authUrl, state });
    }

    return res.redirect(302, authUrl);
  } catch (err: any) {
    console.error('Erro na rota /api/tiktok/login:', err);
    return res.redirect(302, 'https://links.gruporosleon.com.br/resultados?tiktok=error&reason=login_init_failed');
  }
}


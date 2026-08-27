import { getTikTokAuthUrl } from '../../server/tiktokService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const authUrl = getTikTokAuthUrl(state);

    if (req.query?.json === 'true' || req.headers?.accept?.includes('application/json')) {
      return res.status(200).json({ success: true, authUrl });
    }

    return res.redirect(302, authUrl);
  } catch (err: any) {
    console.error('Erro na rota /api/tiktok/login:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro ao iniciar login TikTok' });
  }
}

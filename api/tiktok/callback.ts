import { initDatabase } from '../../server/db.js';
import { handleTikTokCallback } from '../../server/tiktokService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = req.query?.code || req.query?.auth_code;
  const error = req.query?.error;
  const errorDescription = req.query?.error_description;

  if (error) {
    console.error('Erro retornado pelo TikTok OAuth:', error, errorDescription);
    return res.redirect(302, '/resultados?tiktok=error&msg=' + encodeURIComponent(errorDescription || error));
  }

  if (!code) {
    return res.status(400).json({ success: false, error: 'Parâmetro code é obrigatório' });
  }

  try {
    await initDatabase();
    await handleTikTokCallback(String(code));

    return res.redirect(302, '/resultados?tiktok=connected');
  } catch (err: any) {
    console.error('Erro na rota /api/tiktok/callback:', err);
    return res.redirect(302, '/resultados?tiktok=error&msg=' + encodeURIComponent(err.message || 'Erro ao processar callback'));
  }
}

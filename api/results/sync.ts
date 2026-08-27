import { initDatabase } from '../../server/db.js';
import { syncSocialMediaContents, getSyncStatus } from '../../server/resultsService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    if (req.method === 'POST' || req.method === 'GET') {
      await syncSocialMediaContents();
      const status = await getSyncStatus();
      return res.status(200).json({
        success: true,
        message: 'Sincronização concluída com sucesso',
        status,
        youtube: status.platforms.youtube,
        instagram: status.platforms.instagram
      });
    }

    return res.status(405).json({ success: false, error: 'Método não permitido' });
  } catch (err: any) {
    console.error('Erro na serverless /api/results/sync:', err);
    return res.status(500).json({ success: false, error: 'Erro ao executar sincronização' });
  }
}

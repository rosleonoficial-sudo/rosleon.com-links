import { initDatabase } from '../../server/db.js';
import { syncTikTokContents } from '../../server/tiktokService.js';
import { reprocessAllContentBrands } from '../../server/resultsService.js';

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
    const result = await syncTikTokContents();
    await reprocessAllContentBrands();

    const importedCount = typeof result === 'number' ? result : (result.uniqueVideosFetched || 0);

    return res.status(200).json({
      success: true,
      message: 'Sincronização do TikTok concluída com sucesso.',
      importedCount,
      report: result,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro na rota /api/tiktok/sync:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro ao sincronizar TikTok' });
  }
}

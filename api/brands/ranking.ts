import { initDatabase } from '../../server/db.js';
import { getBrandRanking, syncSocialMediaContents } from '../../server/resultsService.js';

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
    await syncSocialMediaContents();
    const metric = typeof req.query?.metric === 'string' ? req.query.metric : 'views';
    const rankingResult = await getBrandRanking(metric);
    return res.status(200).json(rankingResult);
  } catch (err: any) {
    console.error('Erro na serverless /api/brands/ranking:', err);
    return res.status(500).json({ success: false, error: 'Erro ao buscar ranking de marcas' });
  }
}

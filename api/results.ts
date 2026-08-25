import { searchContents, getSyncStatus } from '../server/resultsService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle status route if routed here
  if (req.url?.includes('/status')) {
    return res.status(200).json(getSyncStatus());
  }

  try {
    const q = typeof req.query?.q === 'string' ? req.query.q : '';
    const platform = typeof req.query?.platform === 'string' ? req.query.platform : 'all';
    const sortBy = typeof req.query?.sortBy === 'string' ? req.query.sortBy : 'recent';
    const period = typeof req.query?.period === 'string' ? req.query.period : 'all';
    const contentType = typeof req.query?.contentType === 'string' ? req.query.contentType : 'all';
    const brand = typeof req.query?.brand === 'string' ? req.query.brand : undefined;
    const minViews = req.query?.minViews ? parseInt(req.query.minViews, 10) : undefined;
    const startDate = typeof req.query?.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query?.endDate === 'string' ? req.query.endDate : undefined;
    const page = req.query?.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query?.limit ? parseInt(req.query.limit, 10) : 20;

    const results = await searchContents({
      q,
      platform,
      sortBy,
      period,
      contentType,
      brand,
      minViews,
      startDate,
      endDate,
      page,
      limit
    });

    return res.status(200).json(results);
  } catch (err: any) {
    console.error('Erro na serverless /api/results:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao consultar resultados' });
  }
}

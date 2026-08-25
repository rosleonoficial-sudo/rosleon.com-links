import { initDatabase } from '../server/db.js';
import { getAllBrands } from '../server/resultsService.js';

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
    const brands = await getAllBrands();
    return res.status(200).json(brands);
  } catch (err: any) {
    console.error('Erro na serverless /api/brands:', err);
    return res.status(500).json({ success: false, error: 'Erro ao buscar marcas' });
  }
}

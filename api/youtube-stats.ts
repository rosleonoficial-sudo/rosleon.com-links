import { fetchYouTubeChannelStats } from '../server/youtubeService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const force = req.query?.force === 'true' || req.query?.forceRefresh === 'true';
  const result = await fetchYouTubeChannelStats(force);
  return res.status(200).json(result);
}

import { useState, useEffect } from 'react';
import { CreatorStats } from '../types';

export function useYouTubeStats(initialStats: CreatorStats) {
  const [stats, setStats] = useState<CreatorStats>(initialStats);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const response = await fetch('/api/youtube-stats');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();

        if (json.data && isMounted) {
          const rawSubscribers = typeof json.data.rawSubscribers === 'number' ? json.data.rawSubscribers : 41200;
          const rawViews = typeof json.data.rawViews === 'number' ? json.data.rawViews : 8542190;
          const rawVideos = typeof json.data.rawVideos === 'number' ? json.data.rawVideos : 651;

          const exactSubscribers = json.data.subscribersExact || json.data.subscribersFull || json.data.subscribers || rawSubscribers.toLocaleString('pt-BR');
          const exactViews = json.data.viewsFull || json.data.views || rawViews.toLocaleString('pt-BR');
          const exactVideos = json.data.videosFull || (json.data.videos ? String(json.data.videos).replace(' vídeos', '') : rawVideos.toLocaleString('pt-BR'));

          setStats((prev) => ({
            ...prev,
            subscribers: exactSubscribers,
            views: exactViews,
            videos: exactVideos,
            subscribersFull: exactSubscribers,
            viewsFull: exactViews,
            videosFull: exactVideos,
            rawViews: rawViews,
            rawSubscribers: rawSubscribers,
            lastUpdated: json.data.updatedAt,
            isLiveApiData: json.apiKeyConfigured && json.success
          }));
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        console.warn('Erro ao carregar estatísticas em tempo real do YouTube:', err.message);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Poll every 60 seconds
    const intervalId = setInterval(fetchStats, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { stats, loading, error };
}

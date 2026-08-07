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
          setStats((prev) => ({
            ...prev,
            subscribers: json.data.subscribers || prev.subscribers,
            views: json.data.views || prev.views,
            videos: json.data.videos || prev.videos || "649 vídeos",
            subscribersFull: json.data.subscribersExact || json.data.subscribersFull,
            viewsFull: json.data.viewsFull,
            videosFull: json.data.videosFull,
            rawViews: typeof json.data.rawViews === 'number' ? json.data.rawViews : 8500000,
            rawSubscribers: typeof json.data.rawSubscribers === 'number' ? json.data.rawSubscribers : 40000,
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

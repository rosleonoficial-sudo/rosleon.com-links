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
        let json: any = null;

        // Try backend / API endpoint first
        try {
          const response = await fetch('/api/youtube-stats');
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              json = await response.json();
            }
          }
        } catch (serverErr) {
          console.warn('Backend API /api/youtube-stats indisponível, tentando fallback...', serverErr);
        }

        // Direct client fallback if client API key is configured or fallback key exists
        const clientApiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY || "AIzaSyC2iaAWsA_rE_7-asbQiI0Aso6Cu3OBXn0";
        if ((!json || !json.data) && clientApiKey) {
          try {
            const handle = "rosleonoficial";
            const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=%40${handle}&key=${clientApiKey}`;
            const res = await fetch(url);
            if (res.ok) {
              const ytJson = await res.json();
              if (ytJson.items && ytJson.items.length > 0) {
                const item = ytJson.items[0];
                const s = item.statistics;
                const subs = parseInt(s.subscriberCount, 10);
                const views = parseInt(s.viewCount, 10);
                const vids = parseInt(s.videoCount, 10);
                json = {
                  success: true,
                  apiKeyConfigured: true,
                  data: {
                    rawSubscribers: subs,
                    rawViews: views,
                    rawVideos: vids,
                    subscribersExact: subs.toLocaleString('pt-BR'),
                    viewsFull: views.toLocaleString('pt-BR'),
                    videosFull: vids.toLocaleString('pt-BR'),
                    updatedAt: new Date().toISOString()
                  }
                };
              }
            }
          } catch (clientErr) {
            console.warn('Client-side direct YouTube API fetch error:', clientErr);
          }
        }

        if (json && json.data && isMounted) {
          const rawSubscribers = typeof json.data.rawSubscribers === 'number' ? json.data.rawSubscribers : 42600;
          const rawViews = typeof json.data.rawViews === 'number' ? json.data.rawViews : 8298312;
          const rawVideos = typeof json.data.rawVideos === 'number' ? json.data.rawVideos : 649;

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
        console.warn('Erro ao carregar estatísticas do YouTube:', err.message);
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

import { useState, useEffect } from 'react';
import { InstagramStats } from '../types';

export function useInstagramStats() {
  const [data, setData] = useState<InstagramStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        let igData: any = null;

        // Try /api/media-kit first
        try {
          const mkRes = await fetch('/api/media-kit');
          if (mkRes.ok) {
            const mkJson = await mkRes.json();
            if (mkJson && mkJson.instagram) {
              igData = mkJson.instagram;
            }
          }
        } catch (mkErr) {
          console.warn('/api/media-kit endpoint error:', mkErr);
        }

        // Fallback to /api/instagram-stats
        if (!igData) {
          try {
            const response = await fetch('/api/instagram-stats');
            if (response.ok) {
              const json = await response.json();
              if (json && json.data) {
                igData = json.data;
              }
            }
          } catch (serverErr) {
            console.warn('/api/instagram-stats endpoint error:', serverErr);
          }
        }

        if (isMounted) {
          if (igData) {
            setConfigured(true);
            const followers = igData.followers ?? igData.followersCount ?? 0;
            const views30Days = igData.views30Days ?? igData.views30d ?? 0;

            setData({
              name: igData.name || "ROSLEON | Leonardo Mey",
              username: igData.username || "rosleonoficial",
              profilePictureUrl: igData.profilePictureUrl || "https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png",
              followers,
              followersCount: followers,
              followersFormatted: igData.followersFormatted || followers.toLocaleString('pt-BR'),
              views30Days,
              views30d: views30Days,
              views30DaysFormatted: igData.views30DaysFormatted || igData.views30dFormatted || views30Days.toLocaleString('pt-BR'),
              views30dFormatted: igData.views30dFormatted || igData.views30DaysFormatted || views30Days.toLocaleString('pt-BR'),
              source: igData.source || "instagram_meta_graph_api",
              isAutoSynced: igData.isAutoSynced ?? true,
              lastSyncedAt: igData.lastSyncedAt || new Date().toISOString(),
              stale: igData.stale ?? false,
              syncError: igData.syncError ?? null,
              updatedAt: igData.lastSyncedAt || new Date().toISOString()
            });
            setError(null);
          } else {
            setError("Não foi possível carregar os dados do Media Kit Central.");
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('Erro ao carregar estatísticas do Instagram:', err.message);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Refresh every 15 minutes
    const intervalId = setInterval(fetchStats, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { data, loading, error, configured };
}


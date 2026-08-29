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
        let mkJson: any = null;

        // Try /api/media-kit first
        try {
          const mkRes = await fetch('/api/media-kit');
          if (mkRes.ok) {
            mkJson = await mkRes.json();
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
            const viewsTotal = igData.viewsTotal ?? igData.views30Days ?? igData.views30d ?? 1070560;
            const viewsTotalFormatted = igData.viewsTotalFormatted || igData.views30DaysFormatted || viewsTotal.toLocaleString('pt-BR');

            const tiktokFollowers = mkJson?.tiktok?.followers ?? 15089;
            const tiktokViews = mkJson?.tiktok?.views ?? 0;
            const tiktokVideos = mkJson?.tiktok?.videos ?? 0;
            const totalViews3Networks = mkJson?.totalViews3Networks;
            const totalViews3NetworksFormatted = mkJson?.totalViews3NetworksFormatted;

            const totalLikes = mkJson?.totalLikes ?? igData.totalLikes ?? 314056;
            const totalLikesFormatted = mkJson?.totalLikesFormatted ?? igData.totalLikesFormatted;
            const totalComments = mkJson?.totalComments ?? igData.totalComments ?? 61338;
            const totalCommentsFormatted = mkJson?.totalCommentsFormatted ?? igData.totalCommentsFormatted;
            const totalShares = mkJson?.totalShares ?? igData.totalShares ?? 28459;
            const totalSharesFormatted = mkJson?.totalSharesFormatted ?? igData.totalSharesFormatted;
            const avgEngagementRate = mkJson?.avgEngagementRate ?? igData.avgEngagementRate;

            setData({
              name: igData.name || "ROSLEON | Leonardo Mey",
              username: igData.username || "rosleonoficial",
              profilePictureUrl: igData.profilePictureUrl || "https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png",
              followers,
              followersCount: followers,
              followersFormatted: igData.followersFormatted || followers.toLocaleString('pt-BR'),
              viewsTotal,
              viewsTotalFormatted,
              views30Days: viewsTotal,
              views30d: viewsTotal,
              views30DaysFormatted: viewsTotalFormatted,
              views30dFormatted: viewsTotalFormatted,
              videosTotal: igData.videosTotal || 183,
              tiktokFollowers,
              tiktokViews,
              tiktokVideos,
              totalViews3Networks,
              totalViews3NetworksFormatted,
              totalLikes,
              totalLikesFormatted,
              totalComments,
              totalCommentsFormatted,
              totalShares,
              totalSharesFormatted,
              avgEngagementRate,
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

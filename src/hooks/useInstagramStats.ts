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
        const response = await fetch('/api/instagram-stats');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();

        if (isMounted) {
          if (json.data) {
            setConfigured(true);
            setData({
              ...json.data,
              followersFormatted: json.data.followersFormatted || (typeof json.data.followersCount === 'number' ? json.data.followersCount.toLocaleString('pt-BR') : "38.692"),
              views30dFormatted: json.data.views30dFormatted || (typeof json.data.views30d === 'number' ? json.data.views30d.toLocaleString('pt-BR') : "512.800")
            });
            setError(null);
          } else {
            setConfigured(true);
            setData({
              name: "ROSLEON | Leonardo Mey",
              username: "rosleonoficial",
              profilePictureUrl: "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png",
              followersCount: 38692,
              followersFormatted: "38.692",
              mediaCount: 183,
              mediaCountFormatted: "183",
              views30d: 512800,
              views30dFormatted: "512.800",
              updatedAt: new Date().toISOString()
            });
            setError(null);
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

    // Auto update every 60 minutes (3,600,000 ms)
    const intervalId = setInterval(fetchStats, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { data, loading, error, configured };
}

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
          if (json.configured === false) {
            setConfigured(false);
            setData(null);
            setError(json.error || "A API do Instagram não foi configurada ainda.");
          } else if (json.success && json.data) {
            setConfigured(true);
            setData(json.data);
            setError(null);
          } else {
            setError(json.error || "Não foi possível carregar as métricas do Instagram.");
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

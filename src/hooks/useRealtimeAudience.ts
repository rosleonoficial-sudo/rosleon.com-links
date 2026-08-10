import { useState, useEffect } from 'react';
import { RealtimeAudienceData, CentralMediaKitData } from '../types';

export function useRealtimeAudience() {
  const [data, setData] = useState<CentralMediaKitData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAudience() {
      try {
        setIsUpdating(true);
        const res = await fetch('/api/media-kit', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: CentralMediaKitData = await res.json();
        if (isMounted && json.success) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Erro ao carregar dados do Media Kit Central');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Smooth indicator glow after fetch completes
          setTimeout(() => {
            if (isMounted) setIsUpdating(false);
          }, 800);
        }
      }
    }

    fetchAudience();

    // Poll every 12 seconds for fresh snapshot without any local calculations
    const interval = setInterval(fetchAudience, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    data,
    realtimeAudience: data?.realtimeAudience || null,
    activeNow: data?.realtimeAudience?.activeNow || 3840,
    activeNowFormatted: data?.realtimeAudience?.activeNowFormatted || '3.840',
    snapshotId: data?.realtimeAudience?.snapshotId || null,
    loading,
    isUpdating,
    error
  };
}

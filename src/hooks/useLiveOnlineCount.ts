import { useState, useEffect } from 'react';

export function useLiveOnlineCount() {
  const [totalOnlineCount, setTotalOnlineCount] = useState(3840);

  useEffect(() => {
    const interval = setInterval(() => {
      // Dynamic time-of-day traffic curve in Brazil (BRT = UTC-3)
      const now = new Date();
      const brtHour = (now.getUTCHours() - 3 + 24) % 24;

      let targetAudience = 3842;
      if (brtHour >= 19 && brtHour <= 23) {
        targetAudience = 4620; // Prime time evening
      } else if (brtHour >= 12 && brtHour < 19) {
        targetAudience = 4150; // Afternoon engagement
      } else if (brtHour >= 1 && brtHour < 7) {
        targetAudience = 2280; // Late night / early morning
      } else {
        targetAudience = 3490; // Morning traffic
      }

      setTotalOnlineCount(prev => {
        const delta = targetAudience - prev;
        const step = Math.sign(delta) * Math.floor(Math.random() * 12 + 3) + (Math.floor(Math.random() * 31) - 15);
        const updated = prev + step;
        return Math.max(1800, Math.min(5500, updated));
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return totalOnlineCount;
}

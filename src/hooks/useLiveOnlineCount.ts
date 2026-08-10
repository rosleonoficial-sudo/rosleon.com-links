import { useRealtimeAudience } from './useRealtimeAudience';

export function useLiveOnlineCount() {
  const { activeNow } = useRealtimeAudience();
  return activeNow;
}

import { useCallback, useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useOnline() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      const next = !!state.isConnected && !!state.isInternetReachable;
      setOnline(next);
    });
    return () => unsub();
  }, []);

  const check = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    return !!state.isConnected && !!state.isInternetReachable;
  }, []);

  return { online, check };
}

// Friendly text shown around the app when offline.
export const OFFLINE_TEXT = "You're currently offline.";
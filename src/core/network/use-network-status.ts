import { useNetInfo } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOnline: boolean;
}

/** `null` reachability means "not determined yet", which is treated as online. */
export function useNetworkStatus(): NetworkStatus {
  const { isConnected, isInternetReachable } = useNetInfo();
  return { isOnline: isConnected !== false && isInternetReachable !== false };
}

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export function configureRevenueCat() {
  if (Platform.OS === 'web') return;

  const apiKey =
    Platform.OS === 'ios'
      ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_jEIGNaTQFtYZfRASeEOAiBOVUWu')
      : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '');

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
}

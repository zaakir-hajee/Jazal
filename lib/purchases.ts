import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export function configureRevenueCat() {
  if (Platform.OS === 'web') return;

  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_jEIGNaTQFtYZfRASeEOAiBOVUWu';
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_UhFkxiNUwpocsZLNHzOTUhkdBDE';
  const apiKey = Platform.OS === 'ios' ? iosKey : androidKey;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
}

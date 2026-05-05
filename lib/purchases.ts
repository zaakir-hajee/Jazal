import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export function configureRevenueCat() {
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({ apiKey });
}

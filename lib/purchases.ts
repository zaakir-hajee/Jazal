import { Platform } from 'react-native';
<<<<<<< HEAD
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
=======

const RC_API_KEY = 'appl_jEIGNaTQFtYZfRASeEOAiBOVUWu';
const PRODUCT_ID = 'com.tasbeeh.support1';

let Purchases: any = null;

async function getRC() {
  if (Platform.OS === 'web') return null;
  if (!Purchases) {
    const mod = await import('react-native-purchases');
    Purchases = mod.default;
  }
  return Purchases;
}

export async function initializePurchases(userId?: string) {
  const RC = await getRC();
  if (!RC) return;
  await RC.configure({ apiKey: RC_API_KEY, appUserID: userId ?? null });
}

export async function purchaseSupport(): Promise<{ success: boolean; error?: string }> {
  const RC = await getRC();
  if (!RC) {
    return { success: false, error: 'Purchases not available on web' };
  }
  try {
    const offerings = await RC.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p: any) => p.product?.productIdentifier === PRODUCT_ID
    ) ?? offerings?.current?.availablePackages?.[0];

    if (!pkg) {
      return { success: false, error: 'Product not available' };
    }

    await RC.purchasePackage(pkg);
    return { success: true };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, error: 'cancelled' };
    return { success: false, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; error?: string }> {
  const RC = await getRC();
  if (!RC) return { success: false, error: 'Not available on web' };
  try {
    await RC.restorePurchases();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Restore failed' };
  }
>>>>>>> 62f3a7c220c9c110faf5d0256edebbe3db4a6d93
}

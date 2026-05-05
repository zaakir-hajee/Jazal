import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/lib/auth';
import { LangProvider } from '@/lib/lang';
import { configureRevenueCat } from '@/lib/purchases';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    configureRevenueCat();
  }, []);

  return (
    <LangProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </LangProvider>
  );
}

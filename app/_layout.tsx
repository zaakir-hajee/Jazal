import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/lib/auth';
import { LangProvider } from '@/lib/lang';
<<<<<<< HEAD
import { configureRevenueCat } from '@/lib/purchases';
=======
>>>>>>> 62f3a7c220c9c110faf5d0256edebbe3db4a6d93

export default function RootLayout() {
  useFrameworkReady();

<<<<<<< HEAD
  useEffect(() => {
    configureRevenueCat();
  }, []);

=======
>>>>>>> 62f3a7c220c9c110faf5d0256edebbe3db4a6d93
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

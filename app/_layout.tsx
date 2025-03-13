import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { 
  useFonts, 
  Quicksand_400Regular, 
  Quicksand_700Bold 
} from '@expo-google-fonts/quicksand';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { initializeI18n } from './i18n';
import { I18nextProvider } from 'react-i18next';
import i18next from './i18n';
import { useAuthStore } from './store/useAuthStore';
import { ThemeProvider } from './context/ThemeContext';

export default function RootLayout() {
  useFrameworkReady();
  const initialize = useAuthStore((state) => state.initialize);

  const [fontsLoaded] = useFonts({
    'Quicksand-Regular': Quicksand_400Regular,
    'Quicksand-Bold': Quicksand_700Bold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
  });

  useEffect(() => {
    initializeI18n().catch(console.error);
    initialize().catch(console.error);
  }, [initialize]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18next}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
        </Stack>
        <StatusBar style="auto" />
      </I18nextProvider>
    </ThemeProvider>
  );
}

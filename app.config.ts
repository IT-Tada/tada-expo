import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Tada Story Generator',
  slug: 'tada-story',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'tada',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: "com.tada.tadastory",
    supportsTablet: true
  },
  android: {
    package: "com.tada.tadastory"
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash.png",
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ],
    [
      "expo-speech-recognition",
      {
        "microphonePermission": "Allow $(PRODUCT_NAME) to use the microphone.",
        "speechRecognitionPermission": "Allow $(PRODUCT_NAME) to use speech recognition.",
        "androidSpeechServicePackages": ["com.google.android.googlequicksearchbox"]
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  owner: "tada",
});
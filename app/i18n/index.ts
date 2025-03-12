import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGUAGES = {
  'en-US': {
    name: 'English',
    native: 'English',
    rtl: false,
  },
  'fr-FR': {
    name: 'French',
    native: 'Français',
    rtl: false,
  },
  'es-ES': {
    name: 'Spanish',
    native: 'Español',
    rtl: false,
  },
  'de-DE': {
    name: 'German',
    native: 'Deutsch',
    rtl: false,
  },
  'ar-SA': {
    name: 'Arabic',
    native: 'العربية',
    rtl: true,
  },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const LANGUAGE_STORAGE_KEY = '@app_language';

const resources = {
  'en-US': { translation: en },
  'fr-FR': { translation: fr },
  'es-ES': { translation: es },
  'de-DE': { translation: de },
  'ar-SA': { translation: ar },
};

export const getStoredLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return lang as SupportedLanguage;
  } catch (error) {
    console.error('Error reading stored language:', error);
    return null;
  }
};

export const storeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error storing language:', error);
    throw new Error('Failed to store language preference');
  }
};

export const getInitialLanguage = async (): Promise<SupportedLanguage> => {
  try {
    // Try to get stored language preference
    const storedLang = await getStoredLanguage();
    if (storedLang && storedLang in SUPPORTED_LANGUAGES) {
      return storedLang;
    }

    // Fall back to device locale if supported
    const deviceLocale = Localization.locale.split('-')[0] + '-' + Localization.region;
    if (deviceLocale in SUPPORTED_LANGUAGES) {
      return deviceLocale as SupportedLanguage;
    }

    // Default to English if neither stored nor device locale is supported
    return 'en-US';
  } catch (error) {
    console.error('Error getting initial language:', error);
    return 'en-US';
  }
};

export const initializeI18n = async () => {
  const initialLanguage = await getInitialLanguage();
  const isRTL = SUPPORTED_LANGUAGES[initialLanguage].rtl;
  
  // Configure RTL
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL);

  await i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en-US',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18next;
};

export const changeLanguage = async (language: SupportedLanguage) => {
  try {
    const isRTL = SUPPORTED_LANGUAGES[language].rtl;
    
    // Update RTL setting
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(isRTL);
    
    await storeLanguage(language);
    await i18next.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
    throw new Error('Failed to change language');
  }
};

export default i18next;
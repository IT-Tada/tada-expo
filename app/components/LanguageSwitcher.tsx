import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, type SupportedLanguage } from '../i18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.languageGrid}>
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
        <Pressable
          key={code}
          style={[
            styles.languageButton,
            code === currentLanguage && styles.selectedLanguage,
          ]}
          onPress={() => handleLanguageChange(code as SupportedLanguage)}>
          <Text
            style={[
              styles.languageName,
              code === currentLanguage && styles.selectedText,
            ]}>
            {lang.native}
          </Text>
          <Text
            style={[
              styles.languageCode,
              code === currentLanguage && styles.selectedText,
            ]}>
            {code}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedLanguage: {
    backgroundColor: '#FF6B6B',
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    color: '#666',
  },
  selectedText: {
    color: '#FFF',
  },
});
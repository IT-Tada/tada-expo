import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, type SupportedLanguage } from '../i18n';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeInDown, 
  ZoomIn
} from 'react-native-reanimated';
import { useStoryStore } from '../store/useStoryStore';

// Flag image mapping using CDN URLs
const languageFlags: Record<string, string> = {
  'en-US': 'https://flagcdn.com/w160/us.png',
  'fr-FR': 'https://flagcdn.com/w160/fr.png',
  'es-ES': 'https://flagcdn.com/w160/es.png',
  'de-DE': 'https://flagcdn.com/w160/de.png',
  'ar-SA': 'https://flagcdn.com/w160/sa.png',
};

// Optional fun animal associations for each language (kids love animals!)
const languageAnimals: Record<string, string> = {
  'en-US': '🦅', // Eagle
  'fr-FR': '🐓', // Rooster (Gallic rooster)
  'es-ES': '🐂', // Bull
  'de-DE': '🦁', // Lion (from coat of arms)
  'ar-SA': '🐪', // Camel
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { userPreferences, setUserPreferences } = useStoryStore();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      setUserPreferences({language: language});
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.languageGrid}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang], index) => {
          const isSelected = code === currentLanguage;
          const scale = useSharedValue(1);
          
          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: scale.value }]
            };
          });
          
          return (
            <Animated.View 
              key={code}
              entering={ZoomIn.delay(index * 150).springify()}
              style={[styles.languageButtonContainer, animatedStyle]}
            >
              <Pressable
                style={[
                  styles.languageButton,
                  isSelected && styles.selectedLanguage,
                ]}
                onPress={() => handleLanguageChange(code as SupportedLanguage)}
                onPressIn={() => {
                  scale.value = withSpring(0.9);
                }}
                onPressOut={() => {
                  scale.value = withSpring(1.05, {}, () => {
                    scale.value = withSpring(1);
                  });
                }}
              >
                <Image 
                  source={{ uri: languageFlags[code] }}
                  style={styles.flagImage}
                  resizeMode="cover"
                />
                <Text
                  style={[
                    styles.languageName,
                    isSelected && styles.selectedText,
                  ]}>
                  {lang.native}
                </Text>
                
                {isSelected && (
                  <Animated.View 
                    entering={FadeInDown.springify()}
                    style={styles.animalContainer}
                  >
                    <Text style={styles.animalEmoji}>
                      {languageAnimals[code]}
                    </Text>
                  </Animated.View>
                )}
                
                {isSelected && (
                  <View style={styles.starBadge}>
                    <Text style={styles.starText}>★</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  languageButtonContainer: {
    width: '30%',
    maxWidth: 160,
    marginBottom: 16,
  },
  languageButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  selectedLanguage: {
    backgroundColor: '#FFE5B4',
    borderColor: '#FFD166',
    borderWidth: 4,
  },
  flagImage: {
    width: 80,
    height: 50,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  languageName: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#333',
    fontSize: 20,
  },
  starBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  animalContainer: {
    position: 'absolute',
    top: -5,
    left: -10,
  },
  animalEmoji: {
    fontSize: 28,
    transform: [{ rotate: '-20deg' }],
  }
});

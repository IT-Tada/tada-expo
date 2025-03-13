import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Check, Globe, User } from 'lucide-react-native';
import { useStoryStore, AgeRange } from '../store/useStoryStore';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import Animated, { 
  FadeInDown, 
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from 'react-native-reanimated';
import { AgeSwitcher } from './AgeSwitcher';


interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PreferencesModal({ visible, onClose }: PreferencesModalProps) {
  const { t } = useTranslation();
  const { userPreferences, setUserPreferences } = useStoryStore();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      console.log(userPreferences);
      setUserPreferences({
        ageRange: userPreferences.ageRange,
        language: userPreferences.language,
      });

      setError(null);
      onClose();
    } catch (err) {
      setError(t('preferences.errors.saveFailed'));
      console.error('Error saving preferences:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <ScrollView style={styles.scrollView}>
          <View style={styles.modalContent}>
            <Animated.Text 
              entering={ZoomIn.springify()}
              style={styles.title}
            >
              {t('preferences.title')}
            </Animated.Text>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={24} color="#FF6B6B" />
                <Text style={styles.sectionTitle}>{t('preferences.age.title')}</Text>
              </View>
              <AgeSwitcher />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={24} color="#FF6B6B" />
                <Text style={styles.sectionTitle}>{t('preferences.language.title')}</Text>
              </View>
              <LanguageSwitcher />
            </View>

            {error && (
              <Animated.Text 
                entering={FadeInDown}
                style={styles.error}
              >
                {error}
              </Animated.Text>
            )}

            <Animated.View 
              entering={FadeInDown.delay(1200)}
              style={styles.buttonContainer}
            >
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollView: {
    width: '100%',
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    margin: 20,
    width: 'auto',
    maxWidth: 500,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#FFD166',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginLeft: 10,
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  ageOption: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 8,
  },
  ageEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  ageOptionText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    textAlign: 'center',
  },
  ageOptionTextSelected: {
    color: '#333',
  },
  starBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  animalContainer: {
    position: 'absolute',
    top: -5,
    left: -5,
  },
  animalEmoji: {
    fontSize: 28,
    transform: [{ rotate: '-20deg' }],
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
});

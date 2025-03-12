import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Check, Globe, User } from 'lucide-react-native';
import { useStoryStore, AgeRange } from '../store/useStoryStore';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: 'under-18', label: 'preferences.age.ranges.under-3' },
  { value: '18-25', label: 'preferences.age.ranges.3-5' },
  { value: '26-35', label: 'preferences.age.ranges.6-9' },
  { value: '36-50', label: 'preferences.age.ranges.10-15' },
  { value: '50-plus', label: 'preferences.age.ranges.16-plus' },
];

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PreferencesModal({ visible, onClose }: PreferencesModalProps) {
  const { t } = useTranslation();
  const { userPreferences, setUserPreferences } = useStoryStore();
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(
    userPreferences.ageRange
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedAge(userPreferences.ageRange);
  }, [userPreferences]);

  const handleSave = () => {
    try {
      if (!selectedAge) {
        setError(t('preferences.errors.selectAge'));
        return;
      }

      setUserPreferences({
        ageRange: selectedAge,
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
            <Text style={styles.title}>{t('preferences.title')}</Text>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={24} color="#333" />
                <Text style={styles.sectionTitle}>{t('preferences.age.title')}</Text>
              </View>
              <View style={styles.ageGrid}>
                {AGE_RANGES.map((range) => (
                  <Pressable
                    key={range.value}
                    style={[
                      styles.ageOption,
                      selectedAge === range.value && styles.ageOptionSelected,
                    ]}
                    onPress={() => setSelectedAge(range.value)}>
                    <Text
                      style={[
                        styles.ageOptionText,
                        selectedAge === range.value && styles.ageOptionTextSelected,
                      ]}>
                      {t(range.label)}
                    </Text>
                    {selectedAge === range.value && (
                      <Check size={16} color="#FFF" style={styles.checkIcon} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={24} color="#333" />
                <Text style={styles.sectionTitle}>{t('preferences.language.title')}</Text>
              </View>
              <LanguageSwitcher />
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttonContainer}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </Pressable>
            </View>
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
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: 'auto',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginLeft: 8,
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ageOptionSelected: {
    backgroundColor: '#FF6B6B',
  },
  ageOptionText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    color: '#666',
  },
  ageOptionTextSelected: {
    color: '#FFF',
    fontFamily: 'Quicksand-Bold',
  },
  checkIcon: {
    marginLeft: 8,
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
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
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
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
});
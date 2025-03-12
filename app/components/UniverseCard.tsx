import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Universe } from '../store/useStoryStore';
import { useTranslation } from 'react-i18next';

interface UniverseCardProps {
  universe: Universe;
  onSelect: (universe: Universe) => void;
  isSelected?: boolean;
}

export function UniverseCard({ universe, onSelect, isSelected }: UniverseCardProps) {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={() => onSelect(universe)}
      activeOpacity={0.8}>
      <Image source={{ uri: universe.image }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}>
        <Text style={styles.name}>{t(universe.nameKey)}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {t(universe.descriptionKey)}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    padding: 10,
    justifyContent: 'flex-end',
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  name: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  description: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    opacity: 0.9,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});
import React, { useEffect } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Dimensions, I18nManager, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Universe } from '../store/useStoryStore';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface UniverseCardProps {
  universe: Universe;
  onSelect: (universe: Universe) => void;
  isSelected?: boolean;
  index: number;
}

export function UniverseCard({ universe, onSelect, isSelected, index }: UniverseCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  // Staggered entrance animation
  useEffect(() => {
    scale.value = withDelay(
      index * 100, 
      withSpring(1.05, { damping: 6 })
    );
    
    // Return to normal size
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 300 + index * 100);
  }, []);
  
  // Animation when selected
  useEffect(() => {
    if (isSelected) {
      rotation.value = withSequence(
        withSpring(-0.05),
        withSpring(0.05),
        withSpring(0)
      );
      scale.value = withSpring(1.05);
    } else {
      scale.value = withSpring(1);
    }
  }, [isSelected]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}rad` }
      ]
    };
  });
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.container, 
          { shadowColor: theme.card.border },
          isSelected && { borderWidth: 4, borderColor: theme.card.border }
        ]}
        onPress={() => onSelect(universe)}
        activeOpacity={0.8}>
        <Image source={{ uri: universe.image }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}>
          <Text style={[styles.name, { fontFamily: 'Nunito-ExtraBold' }]}>
            {t(universe.nameKey)}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {t(universe.descriptionKey)}
          </Text>
        </LinearGradient>
        
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedText}>✨</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width < 500 ? (width - 60) / 2 : (width - 100) / 3;

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardWidth * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    height: '60%',
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
  },
  name: {
    color: '#FFF',
    fontSize: 20,
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    opacity: 0.9,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD166',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeInDown, 
  ZoomIn
} from 'react-native-reanimated';
import { AgeRange, useStoryStore } from '../store/useStoryStore';

// Age-specific icons and illustrations
const ageIcons: Record<string, { icon: string, color: string }> = {
    'under-3': { 
      icon: '👶', 
      color: '#FFB6C1' // Light pink
    },
    '3-5': { 
      icon: '🧒', 
      color: '#FFD700' // Gold
    },
    '6-9': { 
      icon: '👦', 
      color: '#87CEFA' // Light sky blue
    },
    '10-15': { 
      icon: '🧑', 
      color: '#98FB98' // Pale green
    },
    '16-plus': { 
      icon: '🧓', 
      color: '#DDA0DD' // Light purple
    },
  };
  
  // Fun animal companions for each age group
  const ageAnimals: Record<string, string> = {
    'under-3': '🐣', // Baby chick
    '3-5': '🐶', // Puppy
    '6-9': '🐱', // Kitten
    '10-15': '🦊', // Fox
    '16-plus': '🦉', // Owl
  };
  
  const AGE_RANGES: { value: AgeRange; label: string }[] = [
    { value: 'under-3', label: 'preferences.age.ranges.under-3' },
    { value: '3-5', label: 'preferences.age.ranges.3-5' },
    { value: '6-9', label: 'preferences.age.ranges.6-9' },
    { value: '10-15', label: 'preferences.age.ranges.10-15' },
    { value: '16-plus', label: 'preferences.age.ranges.16-plus' },
  ];

export function AgeSwitcher() {
    
  const { t } = useTranslation();
  const { userPreferences, setUserPreferences } = useStoryStore();
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(
    userPreferences.ageRange
  );

  useEffect(() => {
    setSelectedAge(userPreferences.ageRange);
  }, [userPreferences]);

  const handleAgeChange = async (value: AgeRange) => {
    try {
      setSelectedAge(value);
      setUserPreferences({ageRange: value});
    } catch (error) {
      console.error('Error changing age:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ageGrid}>
        {Object.entries(AGE_RANGES).map(([value, range], index) => {
          const isSelected = range.value === selectedAge;
          const ageInfo = ageIcons[range.value];
          const scale = useSharedValue(1);
          
          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: scale.value }]
            };
          });
          
          return (
            <Animated.View 
              key={value}
              entering={ZoomIn.delay(index * 150).springify()}
              style={[styles.ageButtonContainer, animatedStyle]}
            >
              <Pressable
                style={[
                  styles.ageButton,
                  isSelected && styles.selectedAge,
                  { backgroundColor: isSelected ? ageInfo.color : '#F8F8F8' }
                ]}
                onPress={() => handleAgeChange(range.value as AgeRange)}
                onPressIn={() => {
                  scale.value = withSpring(0.9);
                }}
                onPressOut={() => {
                  scale.value = withSpring(1.05, {}, () => {
                    scale.value = withSpring(1);
                  });
                }}
              >
                <Text style={styles.ageEmoji}>{ageInfo.icon}</Text>
                <Text
                  style={[
                    styles.ageName,
                    isSelected && styles.selectedText,
                  ]}>
                  {t(range.label)}
                </Text>
                
                {isSelected && (
                  <Animated.View 
                    entering={FadeInDown.springify()}
                    style={styles.animalContainer}
                  >
                    <Text style={styles.animalEmoji}>
                      {ageAnimals[value]}
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
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  ageButtonContainer: {
    width: '30%',
    maxWidth: 160,
    marginBottom: 16,
  },
  ageButton: {
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
  selectedAge: {
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
  ageName: {
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
  },
  ageEmoji: {
    fontSize: 36,
    marginBottom: 8,
  }
});

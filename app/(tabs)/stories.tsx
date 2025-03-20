import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, useWindowDimensions, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Book, Star, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

// Enhanced mock data with more stories for testing grid layout
const mockStories = [
  {
    id: '1',
    title: 'The Dragon\'s Tea Party',
    preview: 'Once upon a time, there was a very polite dragon who loved hosting tea parties...',
    image: 'https://images.unsplash.com/photo-1585435421671-0c16737373b9?w=800&q=80',
    theme: 'fantasy',
    characters: [
      { name: 'Jasper', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Jasper' },
      { name: 'Luna', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Luna' }
    ]
  },
  {
    id: '2',
    title: 'Space Kitty\'s Adventure',
    preview: 'Captain Whiskers adjusted her helmet as she prepared for her first moon landing...',
    image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800&q=80',
    theme: 'space',
    characters: [
      { name: 'Captain Whiskers', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Whiskers' },
      { name: 'Rover', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Rover' }
    ]
  },
  {
    id: '3',
    title: 'The Mermaid\'s Song',
    preview: 'Deep beneath the waves, a young mermaid discovered a magical pearl that could sing...',
    image: 'https://images.unsplash.com/photo-1582457601528-849198e2d01d?w=800&q=80',
    theme: 'ocean',
    characters: [
      { name: 'Pearl', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Pearl' },
      { name: 'Coral', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Coral' }
    ]
  },
  {
    id: '4',
    title: 'The Enchanted Forest',
    preview: 'As the fireflies danced through the ancient trees, a magical door appeared...',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    theme: 'fantasy',
    characters: [
      { name: 'Willow', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Willow' },
      { name: 'Fern', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Fern' }
    ]
  }
];

const themes = [
  { id: 'fantasy', name: 'Fantasy', color: '#FFB6C1', icon: '🏰' },
  { id: 'space', name: 'Space', color: '#87CEEB', icon: '🚀' },
  { id: 'ocean', name: 'Ocean', color: '#4682B4', icon: '🌊' },
  { id: 'jungle', name: 'Jungle', color: '#98FB98', icon: '🌴' },
];

export default function StoriesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [gridColumns, setGridColumns] = useState(1);
  
  // Responsive grid calculations
  useEffect(() => {
    if (windowWidth < 640) {
      setGridColumns(1); // Mobile: 1 column
    } else if (windowWidth < 1024) {
      setGridColumns(2); // Tablet: 2 columns
    } else {
      setGridColumns(3); // Desktop: 3 columns
    }
  }, [windowWidth]);

  // Calculate dimensions for grid items
  const getGridItemWidth = () => {
    const padding = 40; // Total horizontal padding
    const gap = 16 * (gridColumns - 1); // Total gap space
    return (windowWidth - padding - gap) / gridColumns;
  };
  
  // Animation values
  const scale = useSharedValue(1);
  
  const playButtonSound = async () => {
    if (!isSoundEnabled || Platform.OS === 'web') return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/click.mp3'),
        { shouldPlay: true }
      );
      await sound.playAsync();
      sound.unloadAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const handleStoryPress = async (storyId: string) => {
    playButtonSound();
    // Navigate to story detail
    console.log('Opening story:', storyId);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleButtonPress = () => {
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('stories.myAdventures')}</Text>
        <Pressable
          style={styles.soundButton}
          onPress={() => setIsSoundEnabled(!isSoundEnabled)}
        >
          {isSoundEnabled ? (
            <Volume2 size={24} color={theme.text.primary} />
          ) : (
            <VolumeX size={24} color={theme.text.secondary} />
          )}
        </Pressable>
      </View>

      {/* Recent Stories Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stories.recentAdventures')}</Text>
        <View style={[
          styles.storiesGrid,
          { 
            gap: 16
          }
        ]}>
          {mockStories.map((story, index) => (
            <Animated.View
              key={story.id}
              entering={FadeInDown.delay(index * 200).springify()}
              style={[
                styles.storyCard,
                animatedStyle,
                Platform.OS !== 'web' && { width: getGridItemWidth() }
              ]}
            >
              <Image 
                source={{ uri: story.image }} 
                style={styles.storyImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.storyContent}
              >
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyPreview} numberOfLines={2}>
                  {story.preview}
                </Text>
                <Pressable
                  style={styles.readMoreButton}
                  onPress={() => handleStoryPress(story.id)}
                >
                  <Book size={20} color="#FFF" />
                  <Text style={styles.readMoreText}>{t('stories.readMore')}</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Character Gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stories.friendsIMet')}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.charactersContainer}
        >
          {mockStories.flatMap(story => story.characters).map((character, index) => (
            <Animated.View
              key={character.name}
              entering={FadeInDown.delay(index * 100)}
              style={styles.characterCard}
            >
              <Image
                source={{ uri: character.avatar }}
                style={styles.characterAvatar}
              />
              <Text style={styles.characterName}>{character.name}</Text>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Theme Collection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stories.storyWorlds')}</Text>
        <View style={[
          styles.themesGrid
        ]}>
          {themes.map((themeItem, index) => (
            <Animated.View
              key={themeItem.id}
              entering={FadeInDown.delay(index * 150)}
              style={[
                styles.themeCard,
                { backgroundColor: themeItem.color }
              ]}
            >
              <Text style={styles.themeIcon}>{themeItem.icon}</Text>
              <Text style={styles.themeName}>{themeItem.name}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Inspiration Message */}
      <View style={styles.inspirationContainer}>
        <Star size={24} color={theme.accent} />
        <Text style={styles.inspirationText}>
          {t('stories.whatNextAdventure')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-ExtraBold',
    color: '#333',
  },
  soundButton: {
    padding: 8,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 16,
  },
  storiesGrid: {
    flexDirection: Platform.OS === 'web' ? undefined : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  storyCard: {
    aspectRatio: 4/3,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  storyContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  storyTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#FFF',
    marginBottom: 8,
  },
  storyPreview: {
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#FFF',
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    marginLeft: 8,
  },
  charactersContainer: {
    paddingVertical: 10,
    gap: 20,
  },
  characterCard: {
    alignItems: 'center',
  },
  characterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#FFD166',
    backgroundColor: '#F0F0F0',
  },
  characterName: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#333',
  },
  themesGrid: {
    flexDirection: Platform.OS === 'web' ? undefined : 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  themeCard: {
    flex: Platform.OS === 'web' ? undefined : 1,
    aspectRatio: 1,
    minWidth: Platform.OS === 'web' ? undefined : '45%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  themeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  themeName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
  },
  inspirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inspirationText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    color: '#333',
    marginLeft: 12,
  },
});
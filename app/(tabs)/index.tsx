import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { UniverseCard } from '../components/UniverseCard';
import { universes } from '../data/universes';
import { useStoryStore } from '../store/useStoryStore';
import { PreferencesModal } from '../components/PreferencesModal';
import { useTranslation } from 'react-i18next';
import { SpeechFlow } from '../components/SpeechFlow';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userPreferences, remainingStories, selectedUniverse, setSelectedUniverse } =
    useStoryStore();
  const [showPreferences, setShowPreferences] = useState(!userPreferences.ageRange);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!userPreferences.ageRange) {
      setShowPreferences(true);
    }
  }, [userPreferences.ageRange]);

  const handleStoryGenerated = (story: { title: string; content: string }) => {
    // Here you would typically save the story or navigate to a story view
    console.log('Story generated:', story);
  };

  const handleError = (error: Error) => {
    setFeedback(error.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <ScrollView style={styles.scroll}>
      <LinearGradient colors={['#FFE5E5', '#FFF5F5']} style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowPreferences(true)}>
            <Settings size={24} color="#666" />
          </Pressable>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.speechFlowContainer}>
            <SpeechFlow
              onStoryGenerated={handleStoryGenerated}
              onError={handleError}
            />
          </View>

          {feedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedback}>{feedback}</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Star size={24} color="#FFD700" />
              <Text style={styles.statValue}>{remainingStories}</Text>
              <Text style={styles.statLabel}>{t('home.remainingStories')}</Text>
            </View>
          </View>

          <View style={styles.universeGrid}>
            <Text style={styles.sectionTitle}>{t('home.magicUniverses')}</Text>
            <View style={styles.grid}>
              {universes.map((universe) => (
                <UniverseCard
                  key={universe.id}
                  universe={universe}
                  onSelect={setSelectedUniverse}
                  isSelected={selectedUniverse?.id === universe.id}
                />
              ))}
            </View>
          </View>
        </View>

        <PreferencesModal
          visible={showPreferences}
          onClose={() => setShowPreferences(false)}
        />
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    flex: 1,
    minHeight: '100%',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  speechFlowContainer: {
    width: '100%',
    marginBottom: 30,
  },
  feedbackContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  feedback: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statValue: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 24,
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#666',
  },
  universeGrid: {
    width: '100%',
    marginTop: 30,
  },
  sectionTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
});
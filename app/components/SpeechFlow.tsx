// app/components/SpeechFlow.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Mic, Volume2, Check, X, Play, RotateCcw } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  withSpring,
  withRepeat,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useTheme } from '../context/ThemeContext';
import { useStoryStore } from '../store/useStoryStore';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

type Step =
  | 'permission-requesting'
  | 'idle'
  | 'listening'
  | 'processing'
  | 'complete'
  | 'error'
  | 'permission-denied';

interface SpeechFlowProps {
  onStoryGenerated?: (story: {
    title: string;
    synopsis: string;
    content: string;
  }) => void;
  onError?: (error: Error) => void;
}

export function SpeechFlow({ onStoryGenerated, onError }: SpeechFlowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { userPreferences } = useStoryStore();

  // State management
  const [step, setStep] = useState<Step>('permission-requesting');
  const [storyInput, setStoryInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [speechFailed, setSpeechFailed] = useState(false);

  // Animation values
  const waveformAnimation = useSharedValue(1);
  const progressValue = useSharedValue(0);

  // Wave animation values for visualizer
  const waveValues = Array(8)
    .fill(0)
    .map(() => useSharedValue(10));

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log('checkPermissions', result)
      setHasPermission(result.granted);
      setStep('idle');
    } catch (err) {
      console.error('Error checking permissions:', err);
      setHasPermission(false);
    }
  };

  // Setup speech recognition events
  useSpeechRecognitionEvent('start', () => {
    setStep('listening');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startWaveAnimation();
  });

  useSpeechRecognitionEvent('end', () => {
    if (step === 'listening') {
      if (transcript) {
        console.log('Speech recognition result:', transcript);
        setStoryInput(transcript);
        handleTranscript();
      } else {
        setStep('idle');
      }
    }

    // Reset transcript
    setTranscript('');
    stopWaveAnimation();
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      setTranscript(event.results[0].transcript);

      // Animate the waveform
      waveformAnimation.value = withSequence(withSpring(1.2), withSpring(1));
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error, event.message);
    setError(t(`speech.errors.${event.error}`) || event.message);
    setStep('error');
    if (onError) {
      onError(new Error(event.message));
    }
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    if (event.value !== undefined) {
      // Normalize the volume value (usually between -2 and 10)
      const normalizedVolume = Math.max(0, (event.value + 2) / 12);
      setAudioLevel(normalizedVolume);
      waveformAnimation.value = withSpring(1 + normalizedVolume * 0.5);
    }
  });

  // Enhanced voice guidance function with fallback system
  const provideVoiceGuidance = async (text: string) => {
    try {
      // Always make sure to stop any current speech first
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }

      // For iOS, use the Audio library to ensure speech works in silent mode
      if (Platform.OS === 'ios') {
        // Set up audio session to play in silent mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
          // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        });
      }

      // Remove any HTML-like content from the text
      const cleanText = text.replace(/<[^>]*>/g, '');

      // Safer speech options with fallback
      Speech.speak(cleanText, {
        language: userPreferences.language || 'en-US', // Fallback to English
        pitch: 1.0, // More standard pitch to avoid issues
        rate: 0.9, // Slightly slower but not too extreme
        onError: (error) => {
          console.error('Speech synthesis error:', error);
          setSpeechFailed(true);
          // Try again with more basic settings if it fails
          try {
            Speech.speak(cleanText, {
              language: 'en-US',
              pitch: 1.0,
              rate: 1.0,
            });
          } catch (e) {
            console.error('Fallback speech failed:', e);
            // Keep speechFailed true for visual fallback
            setTimeout(() => setSpeechFailed(false), 5000);
          }
        },
      });
    } catch (error) {
      console.error('Voice guidance error:', error);
      setSpeechFailed(true);
      // Reset after some time
      setTimeout(() => setSpeechFailed(false), 5000);
    }
  };

  // Voice guidance on step change
  useEffect(() => {
    if (step === 'idle') {
      provideVoiceGuidance(t('speech.start'));
    } else if (step === 'listening') {
      provideVoiceGuidance(t('speech.listening'));
    } else if (step === 'complete') {
      provideVoiceGuidance(t('speech.complete'));
    }
  }, [step, t]);

  const startRecognition = async () => {
    try {
      // Request permissions if needed
      if (!hasPermission) {
        const result =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) {
          setStep('permission-denied');
          setError(t('speech.errors.not-allowed'));
          return;
        }
        setHasPermission(true);
      }

      // Start speech recognition with appropriate language
      await ExpoSpeechRecognitionModule.start({
        lang: userPreferences.language,
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 300,
        },
      });

      if (Platform.OS !== 'web') {
        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error('Recognition start error:', err);
      setError(t('speech.errors.recognition'));
      setStep('error');
    }
  };

  const stopRecognition = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  };

  const startWaveAnimation = () => {
    waveValues.forEach((wave, index) => {
      wave.value = withRepeat(
        withSequence(
          withSpring(10 + Math.random() * 40 * (audioLevel + 0.5)),
          withSpring(10)
        ),
        -1,
        true
      );
    });
  };

  const stopWaveAnimation = () => {
    waveValues.forEach((wave) => {
      wave.value = withSpring(10);
    });
  };

  const handleTranscript = async () => {
    setStep('processing');
    progressValue.value = withSequence(
      withSpring(0.3),
      withSpring(0.6),
      withSpring(1)
    );

    try {
      // Play confirmation sound
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Simulate API call or use actual API to generate story
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Example story data - replace with actual API call
      const mockStory = {
        title: 'The Great Adventure',
        content: 'Once upon a time...',
        synopsis: 'super'
      };

      if (onStoryGenerated) {
        onStoryGenerated(mockStory);
      }

      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('error');
      if (onError) {
        onError(
          err instanceof Error ? err : new Error('Story generation failed')
        );
      }
    }
  };

  const handleReset = () => {
    setStoryInput('');
    setTranscript('');
    setStep('idle');
    setError(null);
    setSpeechFailed(false);
    stopWaveAnimation();
  };

  // Animated styles
  const waveformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveformAnimation.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      {speechFailed && (
        <Animated.View entering={FadeIn} style={styles.speechFallbackContainer}>
          <Text style={styles.speechFallbackText}>
            {step === 'listening' ? t('speech.listening') : t('speech.fallback')}
          </Text>
        </Animated.View>
      )}

      <AnimatedBlurView
        intensity={20}
        style={[styles.content, step === 'processing' && styles.processing]}
      >
        {step === 'processing' ? (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.processingContent}
          >
            <ActivityIndicator size="large" color={theme.primary} />
            <Animated.View style={[styles.progressBar, progressStyle]} />
            <Text style={styles.processingText}>{t('speech.processing')}</Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={styles.mainContent}
          >
            {step === 'idle' && (
              <View style={styles.idleContainer}>
                <Pressable
                  style={[styles.micButton, styles.shadow]}
                  onPress={startRecognition}
                >
                  <Animated.View style={waveformStyle}>
                    <View
                      style={[
                        styles.micButtonInner,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      {/* <Image
                        source={require('@/assets/images/friendly-microphone.png')}
                        style={styles.micImage}
                        fallback={<Mic size={48} color="#FFF" />}
                      /> */}
                      <Mic size={48} color="#FFF" />
                    </View>
                  </Animated.View>
                  <Text style={styles.micText}>{t('speech.start')}</Text>
                </Pressable>
              </View>
            )}

            {step === 'listening' && (
              <View style={styles.listeningContainer}>
                <Pressable onPress={stopRecognition}>
                  <Animated.View
                    style={[styles.waveformContainer, waveformStyle]}
                  >
                    {/* <Image
                      source={require('@/assets/images/character-listening.png')}
                      style={styles.characterImage}
                      fallback={<Volume2 size={48} color={theme.primary} />}
                    /> */}
                    <Volume2 size={48} color={theme.primary} />
                  </Animated.View>
                </Pressable>

                <Text style={styles.promptText}>{t('speech.listening')}</Text>

                <Animated.View
                  entering={FadeInDown}
                  style={styles.transcriptContainer}
                >
                  <Text style={styles.listeningText}>
                    {transcript || t('speech.listening')}
                  </Text>
                </Animated.View>

                <Text style={styles.stopHint}>{t('speech.tapToStop')}</Text>

                <View style={styles.wavesContainer}>
                  {waveValues.map((wave, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.wave,
                        {
                          height: wave,
                          backgroundColor: theme.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 'permission-denied' && (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  {t('speech.errors.noPermission')}
                </Text>
                <Text style={styles.permissionText}>
                  {t('speech.permissions.instructions')}
                </Text>
                <Pressable
                  style={[
                    styles.button,
                    styles.retryButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={checkPermissions}
                >
                  <RotateCcw size={24} color="#FFF" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
              </View>
            )}

            {step === 'complete' && (
              <View style={styles.completeContainer}>
                {/* <Image
                  source={require('@/assets/images/character-happy.png')}
                  style={styles.successImage}
                  fallback={
                    <View
                      style={[
                        styles.successIcon,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Check size={48} color="#FFF" />
                    </View>
                  }
                /> */}
                <View
                  style={[
                    styles.successIcon,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Check size={48} color="#FFF" />
                </View>
                <Text style={styles.completeTitle}>{t('speech.complete')}</Text>
                <Pressable
                  style={[
                    styles.button,
                    styles.resetButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleReset}
                >
                  <Play size={24} color="#FFF" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {t('common.continue')}
                  </Text>
                </Pressable>
              </View>
            )}

            {step === 'error' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={[
                    styles.button,
                    styles.retryButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleReset}
                >
                  <RotateCcw size={24} color="#FFF" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </AnimatedBlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
  },
  processing: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  processingContent: {
    padding: 40,
    alignItems: 'center',
    gap: 20,
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    marginTop: 16,
  },
  processingText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  mainContent: {
    padding: 20,
    alignItems: 'center',
  },
  idleContainer: {
    alignItems: 'center',
  },
  micButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  micButtonInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  micImage: {
    width: 80,
    height: 80,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  micText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  listeningContainer: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  waveformContainer: {
    padding: 20,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  characterImage: {
    width: 120,
    height: 120,
  },
  promptText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  transcriptContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 10,
    minHeight: 50,
  },
  listeningText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stopHint: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  wavesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: '100%',
    marginTop: 20,
  },
  wave: {
    width: 8,
    marginHorizontal: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  permissionContainer: {
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  permissionTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmationContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  confirmTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  inputPreview: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  previewText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  previewLabel: {
    fontFamily: 'Quicksand-Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#666',
  },
  confirmButtonText: {
    color: '#FFF',
  },
  completeContainer: {
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  successImage: {
    width: 150,
    height: 150,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 24,
    color: '#333',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  errorText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  speechFallbackContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    zIndex: 10,
  },
  speechFallbackText: {
    color: '#FFFFFF',
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

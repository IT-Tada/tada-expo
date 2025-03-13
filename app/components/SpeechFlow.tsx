import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { Mic, Volume2, Check, X, Play, Pause, RotateCcw } from 'lucide-react-native';
import AnimatedReanimated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  withSpring,
  withRepeat,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = AnimatedReanimated.createAnimatedComponent(BlurView);

// Audio feedback URLs
const START_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const STOP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3';
const STORY_START_URL = 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3';

export type StoryInput = {
  theme?: string;
  characters?: string;
  setting?: string;
  conflict?: string;
};

type Step = 'idle' | 'listening' | 'confirming' | 'processing' | 'complete' | 'error';

interface SpeechFlowProps {
  onStoryGenerated?: (story: { title: string; content: string }) => void;
  onError?: (error: Error) => void;
}

export function SpeechFlow({ onStoryGenerated, onError }: SpeechFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('idle');
  const [storyInput, setStoryInput] = useState<StoryInput>({});
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Animation values
  const waveformAnimation = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const prompts = {
    theme: t('speech.prompts.theme'),
    characters: t('speech.prompts.characters'),
    setting: t('speech.prompts.setting'),
    conflict: t('speech.prompts.conflict'),
  };

  const pulseAnimation = useSharedValue(1);
const rotateAnimation = useSharedValue(0);

useEffect(() => {
  // Start continuous pulse animation
  pulseAnimation.value = withRepeat(
    withSequence(
      withTiming(1.1, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    ),
    -1, // Infinite repeat
    true // Reverse
  );
}, []);

  // Initialize Web Audio API and request permissions
  useEffect(() => {
    if (Platform.OS === 'web') {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          setHasPermission(true);

          audioContext.current = new AudioContext();
          analyser.current = audioContext.current.createAnalyser();
          analyser.current.fftSize = 256;
          
          const source = audioContext.current.createMediaStreamSource(stream);
          source.connect(analyser.current);
          
          dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
        } catch (err) {
          setHasPermission(false);
          setError(t('speech.errors.noPermission'));
        }
      };

      initAudio();
    }

    return () => {
      stopListening();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Animated waveform style
  const waveformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveformAnimation.value }],
  }));

  // Listening state UI
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnimation.value}deg` }],
  }));

  // Audio visualization
  const startVisualization = useCallback(() => {
    if (!analyser.current || !dataArray.current) return;

    const animate = () => {
      analyser.current!.getByteFrequencyData(dataArray.current!);
      const average = dataArray.current!.reduce((a, b) => a + b) / dataArray.current!.length;
      waveformAnimation.value = withSpring(1 + (average / 256) * 0.5);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const stopVisualization = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      waveformAnimation.value = withSpring(1);
    }
  }, []);

  // Play audio feedback
  const playAudioFeedback = async (url: string) => {
    if (Platform.OS === 'web') {
      const audio = new Audio(url);
      await audio.play();
    }
  };

  const getCurrentField = useCallback(() => {
    if (!storyInput.theme) return 'theme';
    if (!storyInput.characters) return 'characters';
    if (!storyInput.setting) return 'setting';
    if (!storyInput.conflict) return 'conflict';
    return null;
  }, [storyInput]);

  const stopListening = useCallback(async () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Stop visualization
    stopVisualization();

    // Play stop sound
    await playAudioFeedback(STOP_SOUND_URL);

    // Reset UI state
    setStep('idle');
  }, []);

  const handleStart = useCallback(async () => {
    if (!hasPermission) {
      setError(t('speech.errors.noPermission'));
      return;
    }

    const field = getCurrentField();
    if (!field) {
      setStep('confirming');
      return;
    }

    await playAudioFeedback(START_SOUND_URL);
    setStep('listening');
    setCurrentPrompt(prompts[field]);
    startVisualization();

    if (Platform.OS === 'web') {
      try {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setStoryInput(prev => ({ ...prev, [field]: transcript }));
          stopListening();
        };

        recognition.onerror = (event) => {
          setError(t('speech.errors.recognition'));
          stopListening();
          setStep('error');
        };

        recognition.start();
      } catch (err) {
        setError(t('speech.errors.recognition'));
        stopListening();
        setStep('error');
      }
    }
  }, [getCurrentField, prompts, hasPermission, stopListening]);

  const handleConfirm = async () => {
    setStep('processing');
    progressValue.value = withSequence(
      withSpring(0.3),
      withSpring(0.6),
      withSpring(1)
    );

    try {
      await playAudioFeedback(STORY_START_URL);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockStory = {
        title: 'The Great Adventure',
        content: 'Once upon a time...',
      };
      onStoryGenerated?.(mockStory);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('error');
      onError?.(err instanceof Error ? err : new Error('Story generation failed'));
    }
  };

  const handleReset = () => {
    setStoryInput({});
    setStep('idle');
    setError(null);
    setIsPlaying(false);
    stopVisualization();
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Implement actual audio playback logic here
  };

  // Progress bar animation style
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <AnimatedBlurView
        intensity={20}
        style={[styles.content, step === 'processing' && styles.processing]}>
        {step === 'processing' ? (
          <AnimatedReanimated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.processingContent}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <AnimatedReanimated.View style={[styles.progressBar, progressStyle]} />
            <Text style={styles.processingText}>{t('speech.processing')}</Text>
          </AnimatedReanimated.View>
        ) : (
          <AnimatedReanimated.View
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={styles.mainContent}>
            {step === 'idle' && (
              <Pressable
                style={[styles.micButton, styles.shadow]}
                onPress={handleStart}>
                <Mic size={48} color="#FF6B6B" />
                <Text style={styles.micText}>{t('speech.start')}</Text>
              </Pressable>
            )}

{step === 'listening' && (
  <View style={styles.listeningContainer}>
    <Pressable onPress={stopListening}>
      <Animated.View style={[styles.outerWaveform, pulseStyle]}>
        <Animated.View style={[styles.waveformContainer, waveformStyle]}>
          <Volume2 size={48} color="#FF6B6B" />
        </Animated.View>
      </Animated.View>
    </Pressable>
    <Animated.Text style={[styles.promptText, { 
      fontFamily: 'Nunito-ExtraBold',
      fontSize: 22,
    }]}>
      {currentPrompt}
    </Animated.Text>
    <Text style={[styles.stopHint, {
      fontFamily: 'Quicksand-Regular',
      fontSize: 16
    }]}>
      {t('speech.tapToStop')}
    </Text>
    
    {/* Add friendly character illustrations */}
    <View style={styles.characterContainer}>
      <Animated.Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4725/4725694.png' }}
        style={[styles.characterImage, rotateStyle]}
      />
    </View>
  </View>
)}

            {step === 'confirming' && (
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmTitle}>{t('speech.confirm')}</Text>
                <View style={styles.inputPreview}>
                  {Object.entries(storyInput).map(([key, value]) => (
                    <Text key={key} style={styles.previewText}>
                      <Text style={styles.previewLabel}>{t(`speech.labels.${key}`)}: </Text>
                      {value}
                    </Text>
                  ))}
                </View>
                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleReset}>
                    <X size={24} color="#FF6B6B" />
                    <Text style={styles.buttonText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleConfirm}>
                    <Check size={24} color="#FFF" />
                    <Text style={[styles.buttonText, styles.confirmButtonText]}>
                      {t('common.confirm')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 'complete' && (
              <View style={styles.completeContainer}>
                <Text style={styles.completeTitle}>{t('speech.complete')}</Text>
                <View style={styles.audioControls}>
                  <Pressable
                    style={styles.audioButton}
                    onPress={togglePlayback}>
                    {isPlaying ? (
                      <Pause size={24} color="#FF6B6B" />
                    ) : (
                      <Play size={24} color="#FF6B6B" />
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.resetButton}
                    onPress={handleReset}>
                    <RotateCcw size={24} color="#666" />
                  </Pressable>
                </View>
              </View>
            )}

            {step === 'error' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={[styles.button, styles.retryButton]}
                  onPress={handleReset}>
                  <RotateCcw size={24} color="#FFF" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
              </View>
            )}
          </AnimatedReanimated.View>
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
  micButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  stopHint: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  confirmationContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  confirmTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#333',
  },
  inputPreview: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  previewText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#333',
  },
  previewLabel: {
    fontFamily: 'Quicksand-Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
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
  },
  completeTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#333',
  },
  audioControls: {
    flexDirection: 'row',
    gap: 12,
  },
  audioButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  resetButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 20,
  },
  errorText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  outerWaveform: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  waveformContainer: {
    padding: 20,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  characterContainer: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    zIndex: -1,
  },
  characterImage: {
    width: 120,
    height: 120,
    opacity: 0.8,
  },
  promptText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
});
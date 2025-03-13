import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { Mic, Volume2, Check, X, Play, Pause, RotateCcw, Settings } from 'lucide-react-native';
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
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const AnimatedBlurView = AnimatedReanimated.createAnimatedComponent(BlurView);

// Audio feedback URLs
const START_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const STOP_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3';
const STORY_START_URL = 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3';

const PREFERRED_DEVICE_KEY = '@speech_flow_preferred_device';

export type StoryInput = {
  theme?: string;
  characters?: string;
  setting?: string;
  conflict?: string;
};

type Step = 'idle' | 'listening' | 'confirming' | 'processing' | 'complete' | 'error' | 'permission-denied';

interface SpeechFlowProps {
  onStoryGenerated?: (story: { title: string; content: string }) => void;
  onError?: (error: Error) => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export function SpeechFlow({ onStoryGenerated, onError }: SpeechFlowProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('idle');
  const [storyInput, setStoryInput] = useState<StoryInput>({});
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Animation values
  const waveformAnimation = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  // Define prompts object using translation keys
  const prompts = {
    theme: t('speech.prompts.theme'),
    characters: t('speech.prompts.characters'),
    setting: t('speech.prompts.setting'),
    conflict: t('speech.prompts.conflict'),
  };

  // Load preferred device from storage
  useEffect(() => {
    loadPreferredDevice();
  }, []);

  const loadPreferredDevice = async () => {
    try {
      const deviceId = await AsyncStorage.getItem(PREFERRED_DEVICE_KEY);
      if (deviceId) {
        setSelectedDevice(deviceId);
      }
    } catch (err) {
      console.error('Error loading preferred device:', err);
    }
  };

  // Initialize Web Audio API and request permissions
  useEffect(() => {
    if (Platform.OS === 'web') {
      initializeAudio();
    }

    return cleanup;
  }, []);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true 
      });
      mediaStreamRef.current = stream;
      setHasPermission(true);

      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);

      // Enumerate available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
          kind: device.kind
        }));
      setAudioDevices(audioInputs);

      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    } catch (err) {
      console.error('Audio initialization error:', err);
      setHasPermission(false);
      setStep('permission-denied');
      setError(t('speech.errors.noPermission'));
    }
  };

  const handleDeviceChange = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices
      .filter(device => device.kind === 'audioinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
        kind: device.kind
      }));
    setAudioDevices(audioInputs);
  };

  const cleanup = () => {
    stopListening();
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (audioContext.current) {
      audioContext.current.close();
    }
    if (Platform.OS === 'web') {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    }
  };

  // Animated waveform style
  const waveformStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveformAnimation.value }],
  }));

  // Audio visualization
  const startVisualization = useCallback(() => {
    if (!analyser.current || !dataArray.current) return;

    const animate = () => {
      analyser.current!.getByteFrequencyData(dataArray.current!);
      const average = dataArray.current!.reduce((a, b) => a + b) / dataArray.current!.length;
      setAudioLevel(average / 256);
      waveformAnimation.value = withSpring(1 + (average / 256) * 0.5);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const stopVisualization = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      waveformAnimation.value = withSpring(1);
      setAudioLevel(0);
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    stopVisualization();
    await playAudioFeedback(STOP_SOUND_URL);
    setStep('idle');
  }, []);

  const handleStart = useCallback(async () => {
    if (!hasPermission) {
      setStep('permission-denied');
      return;
    }

    const field = getCurrentField();
    if (!field) {
      setStep('confirming');
      return;
    }

    retryCount.current = 0;
    await playAudioFeedback(START_SOUND_URL);
    setStep('listening');
    setCurrentPrompt(prompts[field]);
    startVisualization();

    if (Platform.OS === 'web') {
      try {
        const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setStoryInput(prev => ({ ...prev, [field]: transcript }));
          stopListening();
        };

        recognition.onerror = async (event: SpeechRecognitionErrorEvent) => {
          console.error('Recognition error:', event.error);
          if (retryCount.current < MAX_RETRIES) {
            retryCount.current++;
            await handleStart();
          } else {
            setError(t('speech.errors.recognition'));
            stopListening();
            setStep('error');
          }
        };

        recognition.start();
      } catch (err) {
        console.error('Recognition start error:', err);
        setError(t('speech.errors.recognition'));
        stopListening();
        setStep('error');
      }
    } else {
      // Fallback to Custom API for speech recognition (send supabase auth token)
      
    }
  }, [getCurrentField, prompts, hasPermission, stopListening, t]);

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      setSelectedDevice(deviceId);
      await AsyncStorage.setItem(PREFERRED_DEVICE_KEY, deviceId);
      await initializeAudio();
      setShowDeviceModal(false);
    } catch (err) {
      console.error('Error selecting device:', err);
      setError(t('speech.errors.deviceSelection'));
    }
  };

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
              <View style={styles.idleContainer}>
                <Pressable
                  style={[styles.micButton, styles.shadow]}
                  onPress={handleStart}>
                  <Mic size={48} color="#FF6B6B" />
                  <Text style={styles.micText}>{t('speech.start')}</Text>
                </Pressable>
                <Pressable
                  style={styles.settingsButton}
                  onPress={() => setShowDeviceModal(true)}>
                  <Settings size={24} color="#666" />
                </Pressable>
              </View>
            )}

            {step === 'listening' && (
              <View style={styles.listeningContainer}>
                <Pressable onPress={stopListening}>
                  <AnimatedReanimated.View style={[styles.waveformContainer, waveformStyle]}>
                    <Volume2 size={48} color="#FF6B6B" />
                  </AnimatedReanimated.View>
                </Pressable>
                <Text style={styles.promptText}>{currentPrompt}</Text>
                <Text style={styles.stopHint}>{t('speech.tapToStop')}</Text>
                <View style={styles.audioLevelContainer}>
                  <View style={[styles.audioLevelBar, { width: `${audioLevel * 100}%` }]} />
                </View>
              </View>
            )}

            {step === 'permission-denied' && (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>{t('speech.errors.noPermission')}</Text>
                <Text style={styles.permissionText}>
                  {t('speech.permissions.instructions')}
                </Text>
                <Pressable
                  style={[styles.button, styles.retryButton]}
                  onPress={() => initializeAudio()}>
                  <RotateCcw size={24} color="#FFF" />
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
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

      <Modal
        visible={showDeviceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeviceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('speech.deviceSelection.title')}</Text>
            <ScrollView style={styles.deviceList}>
              {audioDevices.map((device) => (
                <Pressable
                  key={device.deviceId}
                  style={[
                    styles.deviceItem,
                    selectedDevice === device.deviceId && styles.selectedDevice,
                  ]}
                  onPress={() => handleDeviceSelect(device.deviceId)}>
                  <Text style={styles.deviceLabel}>{device.label}</Text>
                  {selectedDevice === device.deviceId && (
                    <Check size={20} color="#FF6B6B" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.closeButton}
              onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  idleContainer: {
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
  settingsButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  listeningContainer: {
    alignItems: 'center',
    gap: 20,
  },
  waveformContainer: {
    padding: 20,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  promptText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  stopHint: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  audioLevelContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  audioLevelBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  selectedDevice: {
    backgroundColor: '#FFE5E5',
  },
  deviceLabel: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#FFF',
  },
});
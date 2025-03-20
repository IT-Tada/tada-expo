import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Animated,
  Keyboard,
  TextInput,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LogOut, Mail, Lock, Settings } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { BlurView } from 'expo-blur';
import { AccountOverview } from '../components/account/AccountOverview';
import { PaymentOptions } from '../components/account/PaymentOptions';
import { PaymentFAQ } from '../components/account/PaymentFAQ';
import { useTheme } from '../context/ThemeContext';
import { PreferencesModal } from '../components/PreferencesModal';

export default function AccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { status, profile, login, signup, logout, purchaseCredits } = useAuthStore();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  
  // Form validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Create refs for form fields
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];

  // Animate component on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Auto-focus email input if in guest mode
    if (status === 'guest') {
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 300);
    }
  }, [status]);

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle form validation
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate email
    if (!email.trim()) {
      setEmailError(t('account.errors.emailRequired'));
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('account.errors.invalidEmail'));
      isValid = false;
    } else {
      setEmailError(null);
    }
    
    // Validate password
    if (!password.trim()) {
      setPasswordError(t('account.errors.passwordRequired'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('account.errors.passwordTooShort'));
      isValid = false;
    } else {
      setPasswordError(null);
    }
    
    return isValid;
  };

  const handleAuth = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      handleButtonPress();

      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError(t('account.errors.invalidCredentials'));
      } else if (err.message?.includes('Email not confirmed')) {
        setError(t('account.errors.emailNotConfirmed'));
      } else {
        setError(err.message || t('common.error'));
      }
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Enter key press for form submission
  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      handleAuth();
    }
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      // This would call an actual API to cancel the subscription
      // For now, we'll just simulate it
      Alert.alert(
        t('account.cancelSubscription.success.title'),
        t('account.cancelSubscription.success.message'),
        [{ text: t('common.close') }]
      );
      
      setError(null);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderGuestView = () => (
    <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{t('account.guestMessage')}</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder={t('account.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
            accessibilityLabel={t('account.emailPlaceholder')}
          />
        </View>
        
        {emailError && (
          <Text style={styles.fieldErrorText}>{emailError}</Text>
        )}

        <View style={styles.inputContainer}>
          <Lock size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder={t('account.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(null);
            }}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onKeyPress={handleKeyPress}
            onSubmitEditing={handleAuth}
            accessibilityLabel={t('account.passwordPlaceholder')}
          />
        </View>
        
        {passwordError && (
          <Text style={styles.fieldErrorText}>{passwordError}</Text>
        )}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              isSignup ? t('common.signup') : t('common.login')
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignup ? t('common.signup') : t('common.login')}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => {
            setIsSignup(!isSignup);
            setError(null);
            setEmailError(null);
            setPasswordError(null);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.switchButtonText}>
            {isSignup
              ? t('account.switchToLogin')
              : t('account.switchToSignup')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Handle credit purchase
  const handlePurchase = async (packageId: string, isSubscription: boolean) => {
    try {
      setIsLoading(true);
      
      // Determine credit amount from package ID
        // This would be more robust in a real implementation
      let creditAmount = 0;
      
      if (isSubscription) {
        creditAmount = packageId === 'monthly' ? 20 : 30;
        await purchaseCredits(creditAmount, true);
      } else {
        // One-time purchase
        switch (packageId) {
          case 'small':
            creditAmount = 10;
            break;
          case 'medium':
            creditAmount = 30;
            break;
          case 'large':
            creditAmount = 60;
            break;
          case 'xlarge':
            creditAmount = 100;
            break;
        }
        await purchaseCredits(creditAmount, false);
      }
      
      // Success state handling
      setError(null);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserView = () => (
    <Animated.View style={{ flex: 1 }}>
      {/* Account Overview with subscription details */}
      <AccountOverview 
        credits={profile?.credits || 0}
        plan={profile?.plan || 'free'}
        email={profile?.email || ''}
        onViewHistory={() => setShowHistory(true)}
        lastRenewal="2025-03-01T00:00:00.000Z" // Example date for demo
        nextRenewal="2025-04-01T00:00:00.000Z" // Example date for demo
        onCancelSubscription={profile?.plan === 'premium' ? handleCancelSubscription : undefined}
      />
      
      {/* Preferences Button */}
      <Pressable
        style={styles.preferencesButton}
        onPress={() => setShowPreferences(true)}
      >
        <Settings size={18} color="#666" />
        <Text style={styles.preferencesButtonText}>
          {t('common.preferences')}
        </Text>
      </Pressable>
      
      {/* Payment Options */}
      <PaymentOptions onPurchase={handlePurchase} />
      
      {/* FAQ Section */}
      <PaymentFAQ />
      
      {/* Logout Button */}
      <Pressable
        style={styles.logoutButton}
        onPress={logout}
      >
        <View style={styles.logoutButtonContent}>
          <LogOut size={18} color="#FF6B6B" />
          <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
        </View>
      </Pressable>
      
      {/* Purchase History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('account.billingHistory')}</Text>
            
            <View style={styles.historyList}>
              {/* This would be populated with real data */}
              <Text style={styles.emptyHistoryText}>
                {t('account.noTransactions')}
              </Text>
            </View>
            
            <Pressable 
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
      {/* Preferences Modal */}
      <PreferencesModal
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>{t('common.processing')}</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <ScrollView 
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {status === 'guest' ? renderGuestView() : renderUserView()}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  container: {
    minHeight: '100%',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    color: '#333',
    minHeight: 52,
  },
  fieldErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  switchButton: {
    alignItems: 'center',
    padding: 12,
  },
  switchButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  preferencesButtonText: {
    marginLeft: 8,
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    marginBottom: 20,
  },
  historyList: {
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyHistoryText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#666',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#333',
    marginTop: 12,
  },
});

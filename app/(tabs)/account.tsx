import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, Pressable, 
  ScrollView, ActivityIndicator, Animated, TouchableOpacity 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, Star, Crown, ChevronRight, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { Keyboard, Platform } from 'react-native';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { status, profile, login, signup, logout, upgradeToPremium } = useAuthStore();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];
  
  // Animate component on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
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

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleAuth = async () => {
    Keyboard.dismiss();
    
    // Basic validation
    if (!email || !password) {
      setError(t('account.errors.fieldsRequired'));
      return;
    }
    
    if (!validateEmail(email)) {
      setError(t('account.errors.invalidEmail'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('account.errors.passwordTooShort'));
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

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      setError(null);
      handleButtonPress();
      await upgradeToPremium();
    } catch (err: any) {
      setError(err.message || t('common.error'));
      console.error('Upgrade error:', err);
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
            style={styles.input}
            placeholder={t('account.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel={t('account.emailPlaceholder')}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Lock size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('account.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            accessibilityLabel={t('account.passwordPlaceholder')}
          />
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isSignup ? t('common.signup') : t('common.login')}
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
          }}
          accessibilityRole="button"
        >
          <Text style={styles.switchButtonText}>
            {isSignup ? t('account.switchToLogin') : t('account.switchToSignup')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderUserView = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <Text style={styles.welcomeText}>
        {t('account.welcomeBack')}, <Text style={styles.emailText}>{profile?.email}</Text>
      </Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account.currentPlan')}</Text>
        <View style={styles.planInfo}>
          <View style={styles.planBadge}>
            {profile?.plan === 'premium' ? (
              <Crown size={24} color="#FFD700" />
            ) : (
              <Star size={24} color="#666" />
            )}
            <Text style={[
              styles.planText,
              profile?.plan === 'premium' && styles.premiumPlanText
            ]}>
              {t(`account.${profile?.plan}`)}
            </Text>
          </View>
        </View>
      </View>
      
      {profile?.plan === 'free' && (
        <View style={styles.section}>
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={styles.premiumCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Crown size={40} color="#FFD700" />
            <Text style={styles.premiumTitle}>{t('account.premiumFeatures')}</Text>
            <Text style={styles.premiumDescription}>{t('account.premiumDescription')}</Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
                disabled={isLoading}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('common.upgrade')}
              >
                {isLoading ? (
                  <ActivityIndicator color="#333" size="small" />
                ) : (
                  <View style={styles.upgradeButtonContent}>
                    <Text style={styles.upgradeButtonText}>{t('common.upgrade')}</Text>
                    <ChevronRight size={16} color="#333" />
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('common.logout')}
      >
        <View style={styles.logoutButtonContent}>
          <LogOut size={18} color="#FF6B6B" />
          <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView 
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {status === 'guest' ? renderGuestView() : renderUserView()}
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
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Quicksand-Medium',
    color: '#333',
    marginBottom: 32,
  },
  emailText: {
    fontFamily: 'Quicksand-Bold',
    color: '#FF6B6B',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 12,
  },
  planInfo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planText: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#555',
  },
  premiumPlanText: {
    color: '#333',
  },
  premiumCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  premiumTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
  },
  premiumDescription: {
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
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
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock, Star, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { status, profile, login, signup, logout, upgradeToPremium } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      // Handle specific error cases
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
      await upgradeToPremium();
    } catch (err: any) {
      setError(err.message || t('common.error'));
      console.error('Upgrade error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll}>
      <LinearGradient colors={['#FFE5E5', '#FFF5F5']} style={styles.container}>
        {status === 'guest' ? (
          <View style={styles.section}>
            <Text style={styles.title}>{t('account.guestMessage')}</Text>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder={t('common.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder={t('common.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Pressable
                style={styles.button}
                onPress={handleAuth}
                disabled={isLoading}>
                <Text style={styles.buttonText}>
                  {isLoading 
                    ? t('common.loading')
                    : isSignup 
                      ? t('common.signup')
                      : t('common.login')}
                </Text>
              </Pressable>
              <Pressable
                style={styles.switchButton}
                onPress={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}>
                <Text style={styles.switchButtonText}>
                  {isSignup
                    ? t('account.switchToLogin')
                    : t('account.switchToSignup')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.title}>
                {t('account.welcomeBack')}, {profile?.email}
              </Text>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{t('account.currentPlan')}</Text>
                <View style={styles.planBadge}>
                  {profile?.plan === 'premium' ? (
                    <Crown size={24} color="#FFD700" />
                  ) : (
                    <Star size={24} color="#4A4A4A" />
                  )}
                  <Text style={styles.planText}>
                    {t(`account.${profile?.plan}`)}
                  </Text>
                </View>
              </View>
            </View>

            {profile?.plan === 'free' && (
              <View style={styles.section}>
                <View style={styles.premiumCard}>
                  <Crown size={32} color="#FFD700" />
                  <Text style={styles.premiumTitle}>
                    {t('account.premiumFeatures')}
                  </Text>
                  <Text style={styles.premiumDescription}>
                    {t('account.premiumDescription')}
                  </Text>
                  {error && <Text style={styles.errorText}>{error}</Text>}
                  <Pressable
                    style={styles.upgradeButton}
                    onPress={handleUpgrade}
                    disabled={isLoading}>
                    <Text style={styles.upgradeButtonText}>
                      {isLoading ? t('common.loading') : t('common.upgrade')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>{t('common.logout')}</Text>
            </Pressable>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  switchButton: {
    alignItems: 'center',
    padding: 8,
  },
  switchButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    textAlign: 'center',
  },
  planInfo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planText: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
  },
  premiumCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  premiumTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
  },
  premiumDescription: {
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    color: '#666',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#333',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  storiesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
  },
  storyList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
});
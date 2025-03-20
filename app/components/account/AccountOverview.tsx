import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, Clock, AlertCircle, Calendar, X } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface AccountOverviewProps {
  credits: number;
  plan: string;
  email: string;
  onViewHistory: () => void;
  lastRenewal?: string; // ISO date string
  nextRenewal?: string; // ISO date string
  onCancelSubscription?: () => void;
}

export function AccountOverview({ 
  credits, 
  plan, 
  email, 
  onViewHistory, 
  lastRenewal, 
  nextRenewal,
  onCancelSubscription 
}: AccountOverviewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [formattedLastRenewal, setFormattedLastRenewal] = useState<string>('');
  const [formattedNextRenewal, setFormattedNextRenewal] = useState<string>('');
  
  // Determine credit status for visual indicators
  const getCreditStatus = (): { color: string; status: string } => {
    if (credits > 20) return { color: '#4CAF50', status: 'healthy' };
    if (credits > 5) return { color: '#FFC107', status: 'low' };
    return { color: '#FF5722', status: 'critical' };
  };
  
  const { color, status } = getCreditStatus();
  
  // Format dates and calculate remaining days
  useEffect(() => {
    if (lastRenewal) {
      const date = new Date(lastRenewal);
      setFormattedLastRenewal(
        `${(date.getMonth() + 1).toString().padStart(2, '0')}/${
          date.getDate().toString().padStart(2, '0')
        }/${date.getFullYear()}`
      );
    }
    
    if (nextRenewal) {
      const nextDate = new Date(nextRenewal);
      setFormattedNextRenewal(
        `${(nextDate.getMonth() + 1).toString().padStart(2, '0')}/${
          nextDate.getDate().toString().padStart(2, '0')
        }/${nextDate.getFullYear()}`
      );
      
      // Calculate days remaining
      const now = new Date();
      const diffTime = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRemainingDays(diffDays);
    }
  }, [lastRenewal, nextRenewal]);
  
  const handleCancelSubscription = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Show confirmation dialog
    Alert.alert(
      t('account.cancelSubscription.title'),
      t('account.cancelSubscription.message'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('account.cancelSubscription.confirm'),
          style: 'destructive',
          onPress: () => {
            if (onCancelSubscription) {
              onCancelSubscription();
            }
          },
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {t('account.welcome')}, <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>
      
      {/* Subscription Status Card */}
      {plan === 'premium' && (
        <Animated.View entering={FadeIn.delay(400)} style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{t(`account.${plan}`)}</Text>
            </View>
            <Text style={styles.subscriptionTitle}>{t('account.subscription.status')}</Text>
          </View>
          
          {lastRenewal && (
            <View style={styles.renewalRow}>
              <Calendar size={18} color="#666" />
              <Text style={styles.renewalText}>
                {t('account.lastRenewal')}: {formattedLastRenewal}
              </Text>
            </View>
          )}
          
          {nextRenewal && (
            <View style={styles.renewalRow}>
              <Clock size={18} color="#666" />
              <View>
                <Text style={styles.renewalText}>
                  {t('account.nextRenewal')}: {formattedNextRenewal}
                </Text>
                {remainingDays !== null && (
                  <Text style={[
                    styles.countdownText,
                    remainingDays <= 3 && styles.countdownWarning
                  ]}>
                    {remainingDays === 1 
                      ? t('account.renewalTomorrow')
                      : t('account.daysUntilRenewal', { days: remainingDays })}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {onCancelSubscription && (
            <Pressable 
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <X size={16} color="#FF5252" />
              <Text style={styles.cancelButtonText}>
                {t('account.cancelSubscription.button')}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
      
      {/* Credits Card */}
      <LinearGradient
        colors={[theme.card.background, '#F8F8F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creditCard}
      >
        {/* 
        <View style={styles.creditHeader}>
          <Text style={styles.creditTitle}>{t('account.credits.available')}</Text>
        </View> 
        */}
        
        <View style={styles.creditDisplay}>
          <Text style={[styles.creditAmount, { color }]}>{credits}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: color }]}>
            <Text style={styles.statusText}>
              {t(`account.credits.status.${status}`)}
            </Text>
          </View>
        </View>
        
        {status === 'low' || status === 'critical' ? (
          <View style={styles.warningContainer}>
            <AlertCircle size={16} color="#FF5722" />
            <Text style={styles.warningText}>
              {t('account.credits.lowWarning')}
            </Text>
          </View>
        ) : null}
        
        <Text style={styles.planText}>
          {t('account.plan')}: 
          <Text style={[styles.planHighlight, plan === 'premium' && styles.premiumText]}>
            {' '}{t(`account.${plan}`)}
          </Text>
        </Text>
      </LinearGradient>
      
      <Pressable style={styles.historyButton} onPress={onViewHistory}>
        <Clock size={18} color={theme.text.secondary} />
        <Text style={styles.historyText}>{t('account.viewHistory')}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: 'Quicksand-Medium',
    color: '#333',
  },
  emailText: {
    fontFamily: 'Quicksand-Bold',
    color: '#FF6B6B',
  },
  creditCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  creditTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#555',
  },
  helpButton: {
    padding: 5,
  },
  creditDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditAmount: {
    fontSize: 40,
    fontFamily: 'Nunito-ExtraBold',
    marginRight: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  warningText: {
    marginLeft: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#FF5722',
  },
  planText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 16,
    color: '#666',
  },
  planHighlight: {
    fontFamily: 'Quicksand-Bold',
    color: '#555',
  },
  premiumText: {
    color: '#FFD700',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  historyText: {
    marginLeft: 8,
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#666',
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD166',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planBadge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  planBadgeText: {
    color: '#333',
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
    color: '#333',
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  renewalText: {
    marginLeft: 8,
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#666',
  },
  countdownText: {
    marginLeft: 8,
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#4CAF50',
  },
  countdownWarning: {
    color: '#FFC107',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  cancelButtonText: {
    marginLeft: 6,
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#FF5252',
  },
});

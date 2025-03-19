import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, Clock, HelpCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface AccountOverviewProps {
  credits: number;
  plan: string;
  email: string;
  onViewHistory: () => void;
}

export function AccountOverview({ credits, plan, email, onViewHistory }: AccountOverviewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Determine credit status for visual indicators
  const getCreditStatus = (): { color: string; status: string } => {
    if (credits > 20) return { color: '#4CAF50', status: 'healthy' };
    if (credits > 5) return { color: '#FFC107', status: 'low' };
    return { color: '#FF5722', status: 'critical' };
  };
  
  const { color, status } = getCreditStatus();

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {t('account.welcome')}, <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>
      
      <LinearGradient
        colors={[theme.card.background, '#F8F8F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creditCard}
      >
        
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
});

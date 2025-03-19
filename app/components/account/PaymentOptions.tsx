// app/components/PaymentOptions.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Star, Gift, CreditCard, Calendar } from 'lucide-react-native';
import Animated, {
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Package options for one-time purchases
const CREDIT_PACKAGES = [
  { id: 'small', credits: 10, price: 4.99, popular: false },
  { id: 'medium', credits: 30, price: 12.99, popular: true, savings: 13 },
  { id: 'large', credits: 60, price: 19.99, popular: false, savings: 33 },
  { id: 'xlarge', credits: 100, price: 29.99, popular: false, savings: 40 },
];

// Subscription options
const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'account.subscription.monthly.name',
    credits: 20,
    price: 7.99,
    billingPeriod: 'account.subscription.monthly.period',
    bestValue: false,
  },
  {
    id: 'annual',
    name: 'account.subscription.annual.name',
    credits: 30,
    price: 6.49,
    billingPeriod: 'account.subscription.annual.period',
    bestValue: true,
    savings: 20,
  },
];

interface PaymentOptionsProps {
  onPurchase: (packageId: string, isSubscription: boolean) => void;
}

export function PaymentOptions({ onPurchase }: PaymentOptionsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [toggleWidth, setToggleWidth] = useState<number>(0);
  const [selectedPackage, setSelectedPackage] = useState<string>(
    isSubscription ? 'annual' : 'medium'
  );

  // Animation values
  const togglePosition = useSharedValue(isSubscription ? 1 : 0);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSubscription(!isSubscription);
    togglePosition.value = withSpring(isSubscription ? 0 : 1);

    // Reset selection to default for the current mode
    setSelectedPackage(isSubscription ? 'medium' : 'annual');
  };

  const handleSelectPackage = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPackage(id);
  };

  const handlePurchase = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPurchase(selectedPackage, isSubscription);
  };

  const toggleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: togglePosition.value * (toggleWidth / 2) }],
    };
  });

  return (
    <Animated.View entering={FadeIn.delay(500)} style={styles.container}>
      <Text style={styles.title}>{t('account.getMoreCredits')}</Text>

      {/* Payment Type Toggle */}
      <View
        style={styles.toggleContainer}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setToggleWidth(width);
        }}
      >
        <Animated.View style={[styles.toggleBackground, toggleStyle]} />

        <Pressable
          style={[styles.toggleOption]}
          onPress={() => !isSubscription || handleToggle()}
        >
          <CreditCard size={18} color={!isSubscription ? '#FFF' : '#666'} />
          <Text
            style={[
              styles.toggleText,
              !isSubscription && styles.activeToggleText,
            ]}
          >
            {t('account.oneTimePurchase')}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.toggleOption]}
          onPress={() => isSubscription || handleToggle()}
        >
          <Calendar size={18} color={isSubscription ? '#FFF' : '#666'} />
          <Text
            style={[
              styles.toggleText,
              isSubscription && styles.activeToggleText,
            ]}
          >
            {t('account.subscription.title')}
          </Text>
        </Pressable>
      </View>

      {/* One-time purchase options */}
      {!isSubscription && (
        <Animated.View
          entering={SlideInRight.delay(300)}
          style={styles.packagesContainer}
        >
          {CREDIT_PACKAGES.map((pkg) => (
            <Pressable
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage === pkg.id && styles.selectedPackage,
                pkg.popular && styles.popularPackage,
              ]}
              onPress={() => handleSelectPackage(pkg.id)}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Star size={12} color="#FFF" />
                  <Text style={styles.popularText}>
                    {t('account.mostPopular')}
                  </Text>
                </View>
              )}

              <View style={styles.packageContent}>
                <View style={styles.packageHeader}>
                  <Text style={styles.creditsAmount}>{pkg.credits}</Text>
                  <Text style={styles.creditsLabel}>
                    {t('account.credits.unit')}
                  </Text>
                </View>

                <View style={styles.packagePricing}>
                  <Text style={styles.packagePrice}>
                    ${pkg.price.toFixed(2)}
                  </Text>
                  {pkg.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>
                        {t('account.save')} {pkg.savings}%
                      </Text>
                    </View>
                  )}
                </View>

                {selectedPackage === pkg.id && (
                  <View style={styles.selectedIndicator}>
                    <Check size={16} color="#FFF" />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Subscription options */}
      {isSubscription && (
        <Animated.View
          entering={SlideInRight.delay(300)}
          style={styles.subscriptionContainer}
        >
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.subscriptionCard,
                selectedPackage === plan.id && styles.selectedSubscription,
                plan.bestValue && styles.bestValuePlan,
              ]}
              onPress={() => handleSelectPackage(plan.id)}
            >
              {plan.bestValue && (
                <View style={styles.bestValueBadge}>
                  <Star size={14} color="#FFF" />
                  <Text style={styles.bestValueText}>
                    {t('account.bestValue')}
                  </Text>
                </View>
              )}

              <View style={styles.planDetails}>
                
                <View style={styles.planCredits}>
                  <Text style={styles.planName}>{t(plan.name)}</Text>
                  <Text style={styles.planCreditAmount}>{plan.credits}</Text>
                  <Text style={styles.planCreditPeriod}>
                    {t('account.credits.perMonth')}
                  </Text>
                </View>

                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>${plan.price.toFixed(2)}</Text>
                  <Text style={styles.billingPeriod}>
                    {t(plan.billingPeriod)}
                  </Text>
                </View>
              </View>

              {plan.savings && (
                <View style={styles.planSavings}>
                  <Gift size={16} color="#FF6B6B" />
                  <Text style={styles.planSavingsText}>
                    {t('account.savePercent', { percent: plan.savings })}
                  </Text>
                </View>
              )}

              {selectedPackage === plan.id && (
                <View style={styles.selectedPlanIndicator}>
                  <Check size={16} color="#FFF" />
                </View>
              )}
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Payment action button */}
      <Pressable style={styles.purchaseButton} onPress={handlePurchase}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Text style={styles.purchaseButtonText}>
            {isSubscription
              ? t('account.startSubscription')
              : t('account.buyNow')}
          </Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.secureText}>{t('account.securePayment')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleBackground: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 24,
    zIndex: 1,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeToggle: {
    color: '#FFF',
  },
  activeToggleText: {
    color: '#FFF',
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  packageCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPackage: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF9F9',
  },
  popularPackage: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
  },
  packageContent: {
    alignItems: 'center',
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  creditsAmount: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: '#333',
  },
  creditsLabel: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#666',
  },
  packagePricing: {
    alignItems: 'center',
  },
  packagePrice: {
    fontFamily: 'Nunito-Bold',
    fontSize: 20,
    color: '#333',
  },
  savingsBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  savingsText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#4CAF50',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionContainer: {
    marginBottom: 24,
  },
  subscriptionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSubscription: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF9F9',
  },
  bestValuePlan: {
    borderColor: '#4ECDC4',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestValueText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 12,
    color: '#FFF',
    marginLeft: 4,
  },
  planName: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  planCredits: {
    alignItems: 'center',
  },
  planCreditAmount: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 24,
    color: '#333',
  },
  planCreditPeriod: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#666',
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    color: '#333',
  },
  billingPeriod: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#666',
  },
  planDescriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  planDescription: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  planSavings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planSavingsText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 6,
  },
  selectedPlanIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButton: {
    width: '100%',
    height: 56,
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 18,
    color: '#FFF',
  },
  secureText: {
    textAlign: 'center',
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: '#666',
  },
});

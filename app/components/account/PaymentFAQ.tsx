// app/components/PaymentFAQ.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// FAQ items structure
interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

// Sample FAQ data
const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'credits',
    questionKey: 'account.faq.credits.question',
    answerKey: 'account.faq.credits.answer'
  },
  {
    id: 'subscription',
    questionKey: 'account.faq.subscription.question',
    answerKey: 'account.faq.subscription.answer'
  },
  {
    id: 'cancel',
    questionKey: 'account.faq.cancel.question',
    answerKey: 'account.faq.cancel.answer'
  },
  {
    id: 'refund',
    questionKey: 'account.faq.refund.question',
    answerKey: 'account.faq.refund.answer'
  }
];

export function PaymentFAQ() {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const handleToggle = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedId(expandedId === id ? null : id);
  };
  
  return (
    <Animated.View entering={FadeIn.delay(700)} style={styles.container}>
      <Text style={styles.title}>{t('account.faq.title')}</Text>
      
      {FAQ_ITEMS.map((item) => (
        <FAQItem 
          key={item.id}
          item={item}
          isExpanded={expandedId === item.id}
          onToggle={() => handleToggle(item.id)}
          t={t}
        />
      ))}
    </Animated.View>
  );
}

interface FAQItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

function FAQItem({ item, isExpanded, onToggle, t }: FAQItemProps) {
  const height = useSharedValue(0);
  
  React.useEffect(() => {
    height.value = withTiming(isExpanded ? 100 : 0, { duration: 300 });
  }, [isExpanded]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: isExpanded ? withTiming(1) : withTiming(0),
    };
  });
  
  return (
    <View style={styles.faqItem}>
      <Pressable 
        style={[
          styles.questionContainer,
          isExpanded && styles.questionExpanded
        ]} 
        onPress={onToggle}
      >
        <Text style={styles.question}>{t(item.questionKey)}</Text>
        {isExpanded ? 
          <ChevronUp size={20} color="#666" /> : 
          <ChevronDown size={20} color="#666" />
        }
      </Pressable>
      
      <Animated.View style={[styles.answerContainer, animatedStyle]}>
        <Text style={styles.answer}>{t(item.answerKey)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    backgroundColor: '#F9F9F9',
  },
  question: {
    flex: 1,
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    color: '#333',
  },
  answerContainer: {
    overflow: 'hidden',
  },
  answer: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    padding: 16,
    paddingTop: 0,
  },
});

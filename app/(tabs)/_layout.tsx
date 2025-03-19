import { Tabs } from 'expo-router';
import { Book, User, House, LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, Dimensions, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Tab {
  name: string;
  icon: LucideIcon;
  color: string;
  accessibilityLabel: string;
}

export default function KidsTabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const isLargeScreen = width >= 768;

  // Tab configuration
  const tabs: Tab[] = [
    {
      name: 'index',
      icon: House,
      color: '#FF6B6B', // Red
      accessibilityLabel: t('accessibility.homeTab'),
    },
    {
      name: 'stories',
      icon: Book,
      color: '#4ECDC4', // Teal
      accessibilityLabel: t('accessibility.storiesTab'),
    },
    {
      name: 'account',
      icon: User,
      color: '#FFD166', // Yellow
      accessibilityLabel: t('accessibility.accountTab'),
    },
  ];

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name) || tabs[0];
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: tab.color,
          tabBarInactiveTintColor: theme.text.secondary,
          // Custom tab rendering
          tabBarLabel: ({ focused, color }) => (
            <Text 
              style={[
                styles.tabLabel,
                { color },
                isLargeScreen && styles.largeScreenTabLabel,
                focused && isLargeScreen && styles.largeScreenTabLabelFocused

              ]}
              numberOfLines={1}
            >
              {t(`tabs.${tab.name}`)}
            </Text>
          ),
          tabBarIcon: ({ focused, color }) => (
            <KidFriendlyTabIcon 
              tab={tab} 
              color={color} 
              size={28} 
              focused={focused}
            />
          ),
          // Custom container for proper layout
          tabBarButton: (props) => {
            return (
              <Pressable
                {...props}
                style={({ pressed }) => [
                  styles.tabButton,
                  isLargeScreen && styles.largeScreenTabButton,
                  pressed && { opacity: 0.75 },
                  props.style,
                ]}
                android_ripple={{ 
                  color: `${tab.color}30`, 
                  radius: 30,
                }}
              >
                {props.children}
              </Pressable>
            );
          },
        };
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen 
          key={tab.name}
          name={tab.name}
          options={{
            title: t(`tabs.${tab.name}`),
            tabBarAccessibilityLabel: tab.accessibilityLabel,
          }}
        />
      ))}
    </Tabs>
  );
}

function KidFriendlyTabIcon({
  tab,
  color,
  size,
  focused,
}: {
  tab: Tab;
  color: string;
  size: number;
  focused: boolean;
}) {
  // Animation values
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);
  const wiggle = useSharedValue(0);

  // Fun animations when tab is selected
  if (focused) {
    // Playful bounce and scale effect
    scale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withSpring(1.15, { damping: 6 })
    );
    
    // Little bounce for fun
    bounce.value = withSequence(
      withTiming(0, { duration: 10 }),
      withTiming(-6, { duration: 120 }),
      withTiming(0, { duration: 120 })
    );
    
    // Wiggle animation for playfulness
    wiggle.value = withSequence(
      withTiming(-5, { duration: 150 }),
      withTiming(5, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );
  } else {
    scale.value = withSpring(1);
    bounce.value = withTiming(0, { duration: 100 });
    wiggle.value = withTiming(0, { duration: 150 });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: bounce.value },
      { rotate: `${wiggle.value}deg` }
    ],
  }));

  const IconComponent = tab.icon;

  return (
    <Animated.View 
      style={[
        styles.iconContainer,
        focused && styles.selectedIconContainer,
        { 
          borderColor: focused ? color : 'transparent',
          backgroundColor: focused ? `${color}20` : 'transparent',
        },
        animatedStyle,
      ]}
    >
      <IconComponent size={size} color={color} />
    </Animated.View>
  );
}

// Get appropriate tab bar height based on screen size
const getTabBarHeight = () => {
  const { width } = Dimensions.get('window');
  return width < 375 ? 85 : 100; // Extra tall for children's fingers
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    height: getTabBarHeight(),
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginBottom: 25,
    marginHorizontal: 25,
    paddingVertical: 10,
    // Fun, cloud-like shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 8,
  },
  largeScreenTabButton: {
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  largeScreenTabLabel: {
    textAlign: 'left',
    fontSize: 18, // Larger on big screens
  },
  largeScreenTabLabelFocused: {
    marginLeft: 25,
  },
  iconContainer: {
    width: 62, // Very large touch target for little fingers
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 31,
    borderWidth: 3.5, // Thicker border for visual emphasis
    borderColor: 'transparent',
  },
  selectedIconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

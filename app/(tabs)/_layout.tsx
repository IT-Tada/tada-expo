import { Tabs } from 'expo-router';
import { Book, User, House, LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, Dimensions, Pressable, View, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

interface Tab {
  name: string;
  icon: LucideIcon;
  color: string;
  accessibilityLabel: string;
}

export default function KidsTabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  // Determine screen characteristics for responsive design
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;
  const isWebMobile = Platform.OS === 'web' && width < 500;
  
  // Calculate proper tab bar height based on screen size and safe area
  const tabBarHeight = getTabBarHeight(insets, width);

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

  // Calculate icon size based on screen dimensions
  const getIconSize = () => {
    if (isSmallScreen) return 22;
    if (isMediumScreen) return 24;
    return 28; // Large screen
  };
  
  // Get label text size
  const getTabLabelSize = () => {
    if (width < 360) return 10; // Very small screens
    if (width < 480) return 12; // Small screens
    if (width < 768) return 14; // Medium screens
    return 16; // Large screens
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name) || tabs[0];
        return {
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            },
            Platform.OS !== 'web' && { position: 'absolute' },
            isWebMobile && styles.webMobileTabBar
          ],
          tabBarActiveTintColor: tab.color,
          tabBarInactiveTintColor: theme.text.secondary,
          // Improved tab label with layout animations and responsive text size
          tabBarLabel: ({ focused, color }) => (
            <Animated.Text 
              layout={Layout.springify()}
              style={[
                styles.tabLabel,
                { 
                  color,
                  fontSize: getTabLabelSize(),
                  marginTop: width < 350 ? 2 : 8
                },
                isSmallScreen && styles.smallScreenTabLabel,
                isLargeScreen && styles.largeScreenTabLabel,
                focused && isLargeScreen && styles.largeScreenTabLabelFocused
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t(`tabs.${tab.name}`)}
            </Animated.Text>
          ),
          // Use the KidFriendlyTabIcon for the tab icons
          tabBarIcon: ({ focused, color }) => (
            <KidFriendlyTabIcon 
              tab={tab} 
              color={color} 
              size={getIconSize()} 
              focused={focused}
              width={width}
            />
          ),
          // Improved tab button with minimum size guarantees
          tabBarButton: (props) => {
            return (
              <Pressable
                {...props}
                style={({ pressed }) => [
                  styles.tabButton,
                  isLargeScreen && styles.largeScreenTabButton,
                  isWebMobile && styles.webMobileTabButton,
                  pressed && { opacity: 0.75 },
                  { minWidth: 60 }, // Ensure minimum width
                  props.style,
                ]}
                android_ripple={{ 
                  color: `${tab.color}30`, 
                  radius: 24,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
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
  width,
}: {
  tab: Tab;
  color: string;
  size: number;
  focused: boolean;
  width: number;
}) {
  // Animation values
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);
  const wiggle = useSharedValue(0);

  // Calculate container size for icons based on screen width
  const getContainerSize = () => {
    if (width < 360) return 40; // Very small screens
    if (width < 480) return 48; // Small screens
    if (width < 768) return 54; // Medium screens
    return 62; // Large screens
  };

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
  const containerSize = getContainerSize();

  return (
    <Animated.View 
      style={[
        styles.iconContainer,
        focused && styles.selectedIconContainer,
        { 
          borderColor: focused ? color : 'transparent',
          backgroundColor: focused ? `${color}20` : 'transparent',
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          borderWidth: width < 400 ? 2 : 3.5,
        },
        animatedStyle,
      ]}
      layout={Layout.springify()}
    >
      <IconComponent size={size} color={color} />
    </Animated.View>
  );
}

// Get appropriate tab bar height with safe area consideration
const getTabBarHeight = (insets: { bottom: number }, screenWidth: number) => {
  // Use smaller height for web mobile view
  if (Platform.OS === 'web' && screenWidth < 500) {
    return 56 + (insets.bottom > 0 ? insets.bottom : 5);
  }
  
  // Responsive height based on screen width
  const baseHeight = screenWidth < 375 ? 60 : screenWidth < 768 ? 65 : 70;
  const bottomInset = insets.bottom > 0 ? insets.bottom : 10;
  
  return baseHeight + bottomInset;
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    marginBottom: Platform.OS !== 'web' ? 0 : 25,
    marginHorizontal: 25,
    paddingTop: 10,
    // Fun, cloud-like shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    // For mobile, lock to bottom of screen
    ...(Platform.OS === 'web' ? {} : {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    }),
  },
  webMobileTabBar: {
    borderRadius: 20,
    marginHorizontal: 10,
    paddingTop: 5,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 8,
    minWidth: 60, // Minimum width for touch targets
    minHeight: 44, // Minimum height for touch targets
  },
  webMobileTabButton: {
    minWidth: 50,
    paddingVertical: 4,
  },
  largeScreenTabButton: {
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontFamily: 'Nunito-Bold',
    textAlign: 'center',
    flexShrink: 1,
  },
  smallScreenTabLabel: {
    marginTop: 4,
  },
  largeScreenTabLabel: {
    textAlign: 'left',
    // Larger on big screens - size set dynamically
  },
  largeScreenTabLabelFocused: {
    marginLeft: 25,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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

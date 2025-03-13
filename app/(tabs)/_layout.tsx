import { Tabs } from 'expo-router';
import { Book, Chrome as Home, User, Wand2, CircleUser } from 'lucide-react-native';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function TabIcon({ name, color, size, focused }: { name: string; color: string; size: number; focused: boolean }) {
  const scale = useSharedValue(1);
  
  if (focused) {
    scale.value = withSpring(1.2);
  } else {
    scale.value = withSpring(1);
  }
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const IconComponent = (() => {
    switch (name) {
      case 'home': return <Home size={size} color={color} />;
      case 'stories': return <Book size={size} color={color} />;
      case 'create': return <Wand2 size={size} color={color} />;
      case 'profile': return <User size={size} color={color} />;
      case 'account': return <CircleUser size={size} color={color} />;
      default: return <Home size={size} color={color} />;
    }
  })();
  
  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.iconContainer, focused && { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
        {IconComponent}
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
        ),
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text.secondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const routeName = route.name;
          return <TabIcon name={routeName} color={color} size={size} focused={focused} />;
        },
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: t('tabs.stories'),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tabs.create'),
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.createLabel, { color }]}>
              {focused ? t('tabs.create') : ''}
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.createButtonContainer}>
              <View style={[styles.createButton, { backgroundColor: theme.primary }]}>
                <Wand2 size={24} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  tabLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    marginBottom: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -15,
  },
  createButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    marginTop: 10,
  },
});

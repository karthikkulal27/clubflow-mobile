import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MemberDashboardScreen } from '../features/dashboard/screens/MemberDashboardScreen';
import { MyPaymentsScreen } from '../features/payments/screens/MyPaymentsScreen';
import { FinanceScreen } from '../features/payments/screens/FinanceScreen';
import { EventsListScreen } from '../features/events/screens/EventsListScreen';
import { EventDetailScreen } from '../features/events/screens/EventDetailScreen';
import { AnnouncementsScreen } from '../features/announcements/screens/AnnouncementsScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { ExpensesListScreen } from '../features/expenses/screens/ExpensesListScreen';
import { MoreScreen } from '../features/dashboard/screens/MoreScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useTheme } from '../hooks/useTheme';
import { fontSize, fontWeight } from '../theme/typography';
import type { MemberTabParamList } from '../types';

const Tab = createBottomTabNavigator<MemberTabParamList>();

// Events stack: list + detail
const EventsStack = createStackNavigator();
function EventsNavigator() {
  return (
    <EventsStack.Navigator screenOptions={{ headerShown: false }}>
      <EventsStack.Screen name="EventsList">
        {({ navigation }) => (
          <EventsListScreen onEventPress={(id) => navigation.navigate('EventDetail', { eventId: id })} />
        )}
      </EventsStack.Screen>
      <EventsStack.Screen name="EventDetail">
        {({ route, navigation }) => (
          <EventDetailScreen
            eventId={(route.params as { eventId: string }).eventId}
            onBack={() => navigation.goBack()}
          />
        )}
      </EventsStack.Screen>
    </EventsStack.Navigator>
  );
}

// Finance stack: overview + expenses (read-only for members)
const FinanceStack = createStackNavigator();
function FinanceNavigator() {
  return (
    <FinanceStack.Navigator screenOptions={{ headerShown: false }}>
      <FinanceStack.Screen name="FinanceOverview">
        {({ navigation }) => (
          <FinanceScreen onExpenses={() => navigation.navigate('Expenses')} />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="Expenses">
        {({ navigation }) => <ExpensesListScreen onBack={() => navigation.goBack()} />}
      </FinanceStack.Screen>
    </FinanceStack.Navigator>
  );
}

// More stack
const MoreStack = createStackNavigator();
function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreHome">
        {({ navigation }) => (
          <MoreScreen onNavigate={(screen) => navigation.navigate(screen)} />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="Announcements">
        {({ navigation }) => <AnnouncementsScreen onBack={() => navigation.goBack()} />}
      </MoreStack.Screen>
      <MoreStack.Screen name="Notifications">
        {({ navigation }) => <NotificationsScreen onBack={() => navigation.goBack()} />}
      </MoreStack.Screen>
      <MoreStack.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen onBack={() => navigation.goBack()} />
        )}
      </MoreStack.Screen>
    </MoreStack.Navigator>
  );
}

export function MemberNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
            Home: { outline: 'home-outline', filled: 'home' },
            Payments: { outline: 'card-outline', filled: 'card' },
            Finance: { outline: 'bar-chart-outline', filled: 'bar-chart' },
            Events: { outline: 'calendar-outline', filled: 'calendar' },
            More: { outline: 'menu-outline', filled: 'menu' },
          };
          const icon = icons[route.name];
          return <Ionicons name={focused ? icon.filled : icon.outline} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={MemberDashboardScreen} />
      <Tab.Screen name="Payments" component={MyPaymentsScreen} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Events" component={EventsNavigator} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}

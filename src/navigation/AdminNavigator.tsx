import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AdminDashboardScreen } from '../features/dashboard/screens/AdminDashboardScreen';
import { MembersListScreen } from '../features/members/screens/MembersListScreen';
import { AddMemberScreen } from '../features/members/screens/AddMemberScreen';
import { MemberDetailScreen } from '../features/members/screens/MemberDetailScreen';
import { EditMemberScreen } from '../features/members/screens/EditMemberScreen';
import { MemberPaymentsScreen } from '../features/members/screens/MemberPaymentsScreen';
import { FinanceScreen } from '../features/payments/screens/FinanceScreen';
import { DuesPlansScreen } from '../features/payments/screens/DuesPlansScreen';
import { CreateDuesPlanScreen } from '../features/payments/screens/CreateDuesPlanScreen';
import { SpecialCollectionsScreen } from '../features/payments/screens/SpecialCollectionsScreen';
import { CreateSpecialCollectionScreen } from '../features/payments/screens/CreateSpecialCollectionScreen';
import { SpecialCollectionDetailScreen } from '../features/payments/screens/SpecialCollectionDetailScreen';
import { ExpensesListScreen } from '../features/expenses/screens/ExpensesListScreen';
import { AddExpenseScreen } from '../features/expenses/screens/AddExpenseScreen';
import { IncomeListScreen } from '../features/income/screens/IncomeListScreen';
import { AddIncomeScreen } from '../features/income/screens/AddIncomeScreen';
import { EventsListScreen } from '../features/events/screens/EventsListScreen';
import { EventDetailScreen } from '../features/events/screens/EventDetailScreen';
import { CreateEventScreen } from '../features/events/screens/CreateEventScreen';
import { AnnouncementsScreen } from '../features/announcements/screens/AnnouncementsScreen';
import { CreateAnnouncementScreen } from '../features/announcements/screens/CreateAnnouncementScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { MoreScreen } from '../features/dashboard/screens/MoreScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { ClubSettingsScreen } from '../features/club/screens/ClubSettingsScreen';
import { useTheme } from '../hooks/useTheme';
import { useClubBrandingStore } from '../store/club-branding.store';
import { fontSize, fontWeight } from '../theme/typography';
import type { AdminTabParamList } from '../types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

// Members stack: list + add + detail + edit + payments
const MembersStack = createStackNavigator();
function MembersNavigator() {
  return (
    <MembersStack.Navigator screenOptions={{ headerShown: false }}>
      <MembersStack.Screen name="MembersList">
        {({ navigation }) => (
          <MembersListScreen
            onAdd={() => navigation.navigate('AddMember')}
            onSelect={(userId, name) => navigation.navigate('MemberDetail', { userId, name })}
          />
        )}
      </MembersStack.Screen>
      <MembersStack.Screen name="AddMember">
        {({ navigation }) => (
          <AddMemberScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </MembersStack.Screen>
      <MembersStack.Screen name="MemberDetail">
        {({ route, navigation }) => {
          const { userId } = route.params as { userId: string; name: string };
          return (
            <MemberDetailScreen
              userId={userId}
              onBack={() => navigation.goBack()}
              onEdit={(uid) => navigation.navigate('EditMember', { userId: uid })}
              onViewPayments={(uid, name) => navigation.navigate('MemberPayments', { userId: uid, memberName: name })}
            />
          );
        }}
      </MembersStack.Screen>
      <MembersStack.Screen name="EditMember">
        {({ route, navigation }) => {
          const { userId } = route.params as { userId: string };
          return (
            <EditMemberScreen
              userId={userId}
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
            />
          );
        }}
      </MembersStack.Screen>
      <MembersStack.Screen name="MemberPayments">
        {({ route, navigation }) => {
          const { userId, memberName } = route.params as { userId: string; memberName: string };
          return (
            <MemberPaymentsScreen
              userId={userId}
              memberName={memberName}
              onBack={() => navigation.goBack()}
            />
          );
        }}
      </MembersStack.Screen>
    </MembersStack.Navigator>
  );
}

// Finance stack: Finance overview + Expenses + Add Expense
const FinanceStack = createStackNavigator();
function FinanceNavigator() {
  return (
    <FinanceStack.Navigator screenOptions={{ headerShown: false }}>
      <FinanceStack.Screen name="FinanceOverview">
        {({ navigation }) => (
          <FinanceScreen
            onExpenses={() => navigation.navigate('Expenses')}
            onIncome={() => navigation.navigate('Income')}
            onManagePricing={() => navigation.navigate('DuesPlans')}
            onSpecialCollections={() => navigation.navigate('SpecialCollections')}
          />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="Expenses">
        {({ navigation }) => (
          <ExpensesListScreen
            onBack={() => navigation.goBack()}
            onAdd={() => navigation.navigate('AddExpense')}
            onEdit={(item) => navigation.navigate('EditExpense', {
              expenseId: item.id,
              initialValues: {
                title: item.title,
                amount: String(Number(item.amount)),
                category: item.category ?? undefined,
                expenseDate: item.expenseDate.slice(0, 10),
                description: item.description ?? undefined,
              },
            })}
          />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="AddExpense">
        {({ navigation }) => (
          <AddExpenseScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="EditExpense">
        {({ route, navigation }) => {
          const params = route.params as { expenseId: string; initialValues: any };
          return (
            <AddExpenseScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
              expenseId={params.expenseId}
              initialValues={params.initialValues}
            />
          );
        }}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="DuesPlans">
        {({ navigation }) => (
          <DuesPlansScreen onBack={() => navigation.goBack()} onAdd={() => navigation.navigate('CreateDuesPlan')} />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="CreateDuesPlan">
        {({ navigation }) => (
          <CreateDuesPlanScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="SpecialCollections">
        {({ navigation }) => (
          <SpecialCollectionsScreen
            onBack={() => navigation.goBack()}
            onAdd={() => navigation.navigate('CreateSpecialCollection')}
            onSelect={(collectionId, label) => navigation.navigate('SpecialCollectionDetail', { collectionId, label })}
          />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="CreateSpecialCollection">
        {({ navigation }) => (
          <CreateSpecialCollectionScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="SpecialCollectionDetail">
        {({ route, navigation }) => {
          const { collectionId, label } = route.params as { collectionId: string; label: string };
          return (
            <SpecialCollectionDetailScreen
              collectionId={collectionId}
              label={label}
              onBack={() => navigation.goBack()}
            />
          );
        }}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="Income">
        {({ navigation }) => (
          <IncomeListScreen
            onBack={() => navigation.goBack()}
            onAdd={() => navigation.navigate('AddIncome')}
          />
        )}
      </FinanceStack.Screen>
      <FinanceStack.Screen name="AddIncome">
        {({ navigation }) => (
          <AddIncomeScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </FinanceStack.Screen>
    </FinanceStack.Navigator>
  );
}

// Events stack: list + detail + create
const EventsStack = createStackNavigator();
function EventsNavigator() {
  return (
    <EventsStack.Navigator screenOptions={{ headerShown: false }}>
      <EventsStack.Screen name="EventsList">
        {({ navigation }) => (
          <EventsListScreen
            onEventPress={(id) => navigation.navigate('EventDetail', { eventId: id })}
            onAdd={() => navigation.navigate('CreateEvent')}
          />
        )}
      </EventsStack.Screen>
      <EventsStack.Screen name="EventDetail">
        {({ route, navigation }) => (
          <EventDetailScreen
            eventId={(route.params as { eventId: string }).eventId}
            onBack={() => navigation.goBack()}
            onEdit={(event) => {
              const startAt = new Date(event.startAt);
              const endAt = event.endAt ? new Date(event.endAt) : undefined;
              const pad = (n: number) => String(n).padStart(2, '0');
              navigation.navigate('EditEvent', {
                eventId: event.id,
                initialValues: {
                  title: event.title,
                  location: event.location ?? '',
                  description: event.description ?? '',
                  date: `${startAt.getUTCFullYear()}-${pad(startAt.getUTCMonth() + 1)}-${pad(startAt.getUTCDate())}`,
                  startTime: `${pad(startAt.getUTCHours())}:${pad(startAt.getUTCMinutes())}`,
                  endTime: endAt ? `${pad(endAt.getUTCHours())}:${pad(endAt.getUTCMinutes())}` : '',
                },
              });
            }}
          />
        )}
      </EventsStack.Screen>
      <EventsStack.Screen name="CreateEvent">
        {({ navigation }) => (
          <CreateEventScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </EventsStack.Screen>
      <EventsStack.Screen name="EditEvent">
        {({ route, navigation }) => {
          const params = route.params as { eventId: string; initialValues: any };
          return (
            <CreateEventScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
              eventId={params.eventId}
              initialValues={params.initialValues}
            />
          );
        }}
      </EventsStack.Screen>
    </EventsStack.Navigator>
  );
}

// More stack: More + Announcements + Create Announcement + Notifications
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
        {({ navigation }) => (
          <AnnouncementsScreen
            onBack={() => navigation.goBack()}
            onAdd={() => navigation.navigate('CreateAnnouncement')}
            onEdit={(item) => navigation.navigate('EditAnnouncement', { announcementId: item.id, initialValues: { title: item.title, body: item.body } })}
          />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="CreateAnnouncement">
        {({ navigation }) => (
          <CreateAnnouncementScreen onBack={() => navigation.goBack()} onSuccess={() => navigation.goBack()} />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="EditAnnouncement">
        {({ route, navigation }) => {
          const params = route.params as { announcementId: string; initialValues: { title: string; body: string } };
          return (
            <CreateAnnouncementScreen
              onBack={() => navigation.goBack()}
              onSuccess={() => navigation.goBack()}
              announcementId={params.announcementId}
              initialValues={params.initialValues}
            />
          );
        }}
      </MoreStack.Screen>
      <MoreStack.Screen name="Notifications">
        {({ navigation }) => <NotificationsScreen onBack={() => navigation.goBack()} />}
      </MoreStack.Screen>
      <MoreStack.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen onBack={() => navigation.goBack()} />
        )}
      </MoreStack.Screen>
      <MoreStack.Screen name="ClubSettings">
        {({ navigation }) => (
          <ClubSettingsScreen onBack={() => navigation.goBack()} />
        )}
      </MoreStack.Screen>
    </MoreStack.Navigator>
  );
}

export function AdminNavigator() {
  const { theme } = useTheme();
  const branding = useClubBrandingStore((s) => s.branding);
  const insets = useSafeAreaInsets();

  // Use custom primary color if branding is set, otherwise use default
  const tabBarActiveTintColor = branding?.primaryColor || theme.tabBarActive;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tabBarActiveTintColor,
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
            Dashboard: { outline: 'grid-outline', filled: 'grid' },
            Members: { outline: 'people-outline', filled: 'people' },
            Finance: { outline: 'wallet-outline', filled: 'wallet' },
            Events: { outline: 'calendar-outline', filled: 'calendar' },
            More: { outline: 'ellipsis-horizontal-circle-outline', filled: 'ellipsis-horizontal-circle' },
          };
          const icon = icons[route.name];
          return <Ionicons name={focused ? icon.filled : icon.outline} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="Members" component={MembersNavigator} />
      <Tab.Screen name="Finance" component={FinanceNavigator} />
      <Tab.Screen name="Events" component={EventsNavigator} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}

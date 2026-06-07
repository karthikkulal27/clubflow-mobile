import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthStore } from '../../../store/auth.store';
import { useTheme } from '../../../hooks/useTheme';
import { fontSize, fontWeight } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
}

function MenuItem({ icon, label, onPress, danger, badge }: MenuItemProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.borderSubtle }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? theme.dangerLight : theme.borderSubtle }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.text.secondary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? theme.danger : theme.text.primary }]}>
        {label}
      </Text>
      <View style={styles.menuRight}>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
}

interface MoreScreenProps {
  onNavigate?: (screen: string) => void;
}

export function MoreScreen({ onNavigate }: MoreScreenProps) {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: clearAuth },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={user?.name ?? '?'} size={68} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text.primary }]}>{user?.name}</Text>
            <Text style={[styles.profilePhone, { color: theme.text.secondary }]}>{user?.phone}</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.roleText, { color: theme.primary }]}>
                {isAdmin ? 'Club Admin' : 'Member'}
              </Text>
            </View>
          </View>
        </View>

        <Card style={styles.menuCard} padding={0}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => onNavigate?.('Notifications')}
          />
          {isAdmin && (
            <MenuItem
              icon="bar-chart-outline"
              label="Reports & Analytics"
              onPress={() => onNavigate?.('Reports')}
            />
          )}
          {isAdmin && (
            <MenuItem
              icon="settings-outline"
              label="Club Settings"
              onPress={() => onNavigate?.('ClubSettings')}
            />
          )}
          <MenuItem
            icon="person-outline"
            label="My Profile"
            onPress={() => onNavigate?.('Profile')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
        </Card>

        <Card style={[styles.menuCard, styles.menuCardSpaced]} padding={0}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </Card>

        <Text style={[styles.version, { color: theme.text.tertiary }]}>
          ClubFlow v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[5],
  },
  profileInfo: { flex: 1, gap: spacing[1] },
  profileName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  profilePhone: { fontSize: fontSize.sm },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing[1],
  },
  roleText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  menuCard: { marginHorizontal: spacing[5], overflow: 'hidden' },
  menuCardSpaced: { marginTop: spacing[3] },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: fontSize.base },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: fontWeight.bold },
  version: { textAlign: 'center', fontSize: fontSize.xs, paddingVertical: spacing[6] },
});

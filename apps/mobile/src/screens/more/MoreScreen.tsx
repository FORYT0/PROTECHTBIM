import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {useAuth} from '../../contexts/AuthContext';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuSection { title: string; items: MenuItem[]; }
interface MenuItem {
  label: string;
  icon: string;
  iconColor?: string;
  screen?: keyof RootStackParamList;
  params?: any;
  onPress?: () => void;
  color?: string;
}

export function MoreScreen() {
  const {user, logout} = useAuth();
  const navigation = useNavigation<Nav>();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign out', style: 'destructive', onPress: logout},
    ]);
  };

  const sections: MenuSection[] = [
    {
      title: 'Construction',
      items: [
        {label: 'Contracts',     icon: 'file-text',      screen: 'Contracts'},
        {label: 'Change Orders', icon: 'refresh-cw',     screen: 'ChangeOrders'},
        {label: 'Daily Reports', icon: 'clipboard',      screen: 'DailyReports'},
        {label: 'Snags',         icon: 'alert-triangle', screen: 'Snags', iconColor: COLORS.red},
      ],
    },
    {
      title: 'Finance & Time',
      items: [
        {label: 'Cost Tracking', icon: 'dollar-sign', screen: 'CostTracking', iconColor: COLORS.yellow},
        {label: 'Time Tracking', icon: 'clock',       screen: 'TimeTracking'},
      ],
    },
    {
      title: 'Planning',
      items: [
        {label: 'Board',         icon: 'layout',    screen: 'Board'},
        {label: 'Work Packages', icon: 'package',   screen: 'WorkPackages'},
        {label: 'Calendar',      icon: 'calendar',  screen: 'Calendar'},
        {label: 'Resources',     icon: 'users',     screen: 'Resources'},
        {label: 'Wiki',          icon: 'book-open', screen: 'Wiki'},
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Sign out',
          icon: 'log-out',
          color: COLORS.red,
          iconColor: COLORS.red,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() ?? 'USER'}</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => {
                    if (item.onPress) {
                      item.onPress();
                    } else if (item.screen) {
                      navigation.navigate(item.screen as any, item.params);
                    }
                  }}
                  activeOpacity={0.75}>
                  <View style={[styles.iconWrap, item.iconColor && {backgroundColor: item.iconColor + '18'}]}>
                    <Feather
                      name={item.icon as any}
                      size={16}
                      color={item.iconColor ?? COLORS.textSecond}
                    />
                  </View>
                  <Text style={[styles.menuLabel, item.color && {color: item.color}]}>
                    {item.label}
                  </Text>
                  <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>PROTECHT BIM · v1.0.0</Text>
          <Text style={styles.appInfoText}>Construction Intelligence Platform</Text>
        </View>
        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        {flex: 1, backgroundColor: COLORS.bg},
  profile:     {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.lg,
    padding: SPACING.xl,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  avatar:      {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.blueAlpha,
    borderWidth: 2, borderColor: COLORS.blue + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  {fontSize: 26, fontWeight: '800', color: COLORS.blue},
  profileName: {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  profileEmail:{fontSize: 13, color: COLORS.textMuted, marginTop: 2},
  roleBadge:   {marginTop: 6, alignSelf: 'flex-start', backgroundColor: COLORS.blueAlpha, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.blue + '30'},
  roleText:    {fontSize: 10, color: COLORS.blue, fontWeight: '700', letterSpacing: 1},
  section:     {paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg},
  sectionTitle:{fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.xs},
  sectionCard: {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden'},
  menuItem:    {flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md},
  menuItemBorder:{borderBottomWidth: 1, borderBottomColor: COLORS.border},
  iconWrap:    {width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  menuLabel:   {flex: 1, fontSize: 15, color: COLORS.textPrimary},
  appInfo:     {padding: SPACING.xl, alignItems: 'center'},
  appInfoText: {fontSize: 12, color: COLORS.textDisabled, marginBottom: 2},
});

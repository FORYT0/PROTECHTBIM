import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';
import {projectService, dashboardService} from '../../api/services';
import {Card, KpiCard, SectionHeader, EmptyState, Badge} from '../../components/Card';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {formatCurrency, capitalize} from '../../utils/formatters';
import {statusColor} from '../../utils/theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const QUICK_LINKS = [
  {label: 'Contracts',     icon: 'file-text', screen: 'Contracts'},
  {label: 'Change Orders', icon: 'refresh-cw', screen: 'ChangeOrders'},
  {label: 'Daily Reports', icon: 'clipboard', screen: 'DailyReports'},
  {label: 'Snags',         icon: 'alert-triangle', screen: 'Snags'},
  {label: 'Time',          icon: 'clock', screen: 'TimeTracking'},
  {label: 'Resources',     icon: 'users', screen: 'Resources'},
] as const;

export function HomeScreen() {
  const {user, logout} = useAuth();
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);

  const {data: statsData, refetch: refetchStats} = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => dashboardService.getStats().catch(() => null),
  });
  const {data: projectsData, refetch: refetchProjects} = useQuery({
    queryKey: ['projects-home'],
    queryFn:  () => projectService.list({per_page: 5}),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchProjects()]);
    setRefreshing(false);
  }, [refetchStats, refetchProjects]);

  const stats    = statsData ?? {};
  const projects = projectsData?.projects ?? [];

  const kpis = [
    {label: 'Active Projects', value: stats.active_projects ?? projects.filter((p: any) => p.status === 'active').length, icon: <Feather name="briefcase"      size={18} color={COLORS.blue}   />, color: COLORS.blue},
    {label: 'Open Snags',      value: stats.open_snags ?? '—',    icon: <Feather name="alert-triangle"  size={18} color={COLORS.red}    />, color: COLORS.red},
    {label: 'Budget Used',     value: stats.budget_utilization ? `${stats.budget_utilization}%` : '—', icon: <Feather name="dollar-sign" size={18} color={COLORS.yellow} />, color: COLORS.yellow},
    {label: 'Team Members',    value: stats.team_members ?? '—',  icon: <Feather name="users"            size={18} color={COLORS.green}  />, color: COLORS.green},
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={projects}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Greeting */}
            <View style={styles.greeting}>
              <View>
                <Text style={styles.greetingSub}>Good day</Text>
                <Text style={styles.greetingName}>{user?.name ?? 'User'}</Text>
              </View>
              <TouchableOpacity style={styles.avatarBtn} onPress={() => {}}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* KPIs */}
            <View style={styles.kpiGrid}>
              {kpis.map(k => (
                <View key={k.label} style={styles.kpiCell}>
                  <KpiCard {...k} />
                </View>
              ))}
            </View>

            {/* Quick Access */}
            <SectionHeader title="Quick Access" />
            <View style={styles.quickGrid}>
              {QUICK_LINKS.map(link => (
                <TouchableOpacity
                  key={link.screen}
                  style={styles.quickBtn}
                  onPress={() => navigation.navigate(link.screen as any)}>
                  <View style={styles.quickIconWrap}>
                    <Feather name={link.icon} size={20} color={COLORS.blue} />
                  </View>
                  <Text style={styles.quickLabel}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Projects */}
            <SectionHeader
              title="Recent Projects"
              action="View all"
              onAction={() => navigation.navigate('MainTabs', {screen: 'Projects'} as any)}
            />
          </View>
        }
        renderItem={({item: p}) => (
          <TouchableOpacity
            style={styles.projectRow}
            onPress={() => navigation.navigate('ProjectDetail', {projectId: p.id})}>
            <View style={styles.projectIcon}>
              <Feather name="briefcase" size={18} color={COLORS.blue} />
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.projectMeta}>
                {capitalize(p.status)} · {p.progress ?? 0}% complete
              </Text>
            </View>
            <Badge label={capitalize(p.status)} color={statusColor(p.status)} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Feather name="briefcase" size={28} color={COLORS.textMuted} />}
            title="No projects yet"
            subtitle="Create your first project to get started"
          />
        }
        ListFooterComponent={<View style={{height: 32}} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        {flex: 1, backgroundColor: COLORS.bg},
  listContent: {},
  container:   {padding: SPACING.lg},
  greeting:    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl},
  greetingSub: {fontSize: 13, color: COLORS.textMuted},
  greetingName:{fontSize: 22, fontWeight: '800', color: COLORS.textPrimary},
  avatarBtn:   {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.blueAlpha, borderWidth: 1, borderColor: COLORS.blue + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  {color: COLORS.blue, fontSize: 18, fontWeight: '700'},
  kpiGrid:     {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs, marginBottom: SPACING.lg},
  kpiCell:     {width: '50%', paddingHorizontal: SPACING.xs},
  quickGrid:   {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs, marginBottom: SPACING.xl},
  quickBtn:    {
    width: '33.33%', paddingHorizontal: SPACING.xs, marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  quickIconWrap:{
    width: 48, height: 48, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickLabel:  {fontSize: 11, color: COLORS.textSecond, textAlign: 'center'},
  projectRow:  {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  projectIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.blueAlpha,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  projectInfo: {flex: 1, marginRight: SPACING.sm},
  projectName: {fontSize: 14, fontWeight: '600', color: COLORS.textPrimary},
  projectMeta: {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
});

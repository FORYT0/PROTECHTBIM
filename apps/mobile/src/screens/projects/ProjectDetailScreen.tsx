import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {projectService} from '../../api/services';
import {Card, Badge, SectionHeader, KpiCard} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor} from '../../utils/theme';
import {formatDate, formatCurrency, capitalize} from '../../utils/formatters';
import type {RootScreenProps, RootStackParamList} from '../../navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const MODULES: {label: string; icon: FeatherName; color: string; screen: keyof RootStackParamList}[] = [
  {label: 'Cost Tracking',  icon: 'dollar-sign',    color: COLORS.yellow,  screen: 'CostTracking'},
  {label: 'Contracts',      icon: 'file-text',      color: COLORS.blue,    screen: 'Contracts'},
  {label: 'Change Orders',  icon: 'refresh-cw',     color: COLORS.purple,  screen: 'ChangeOrders'},
  {label: 'Daily Reports',  icon: 'clipboard',      color: COLORS.green,   screen: 'DailyReports'},
  {label: 'Snags',          icon: 'alert-triangle', color: COLORS.red,     screen: 'Snags'},
  {label: 'Time Tracking',  icon: 'clock',          color: COLORS.blue,    screen: 'TimeTracking'},
  {label: 'Board',          icon: 'layout',         color: COLORS.purple,  screen: 'Board'},
  {label: 'Work Packages',  icon: 'package',        color: COLORS.yellow,  screen: 'WorkPackages'},
  {label: 'Wiki',           icon: 'book-open',      color: COLORS.green,   screen: 'Wiki'},
];

export function ProjectDetailScreen({route}: RootScreenProps<'ProjectDetail'>) {
  const {projectId} = route.params;
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);

  const {data: project, refetch, isLoading, isError} = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => projectService.get(projectId),
  });

  const onRefresh = async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  };

  if (isLoading && !project) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading project…</Text>
      </View>
    );
  }
  if (isError || !project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load project</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="briefcase" size={32} color={COLORS.blue} />
          </View>
          <Text style={styles.heroName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.heroDesc}>{project.description}</Text>
          )}
          <Badge label={capitalize(project.status)} color={statusColor(project.status)} />
        </View>

        <View style={styles.body}>
          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCell}>
              <KpiCard
                label="Progress"
                value={`${project.progress ?? 0}%`}
                icon={<Feather name="trending-up" size={16} color={COLORS.blue} />}
                color={COLORS.blue}
              />
            </View>
            <View style={styles.kpiCell}>
              <KpiCard
                label="Budget"
                value={formatCurrency(project.budget)}
                icon={<Feather name="dollar-sign" size={16} color={COLORS.yellow} />}
                color={COLORS.yellow}
              />
            </View>
            <View style={styles.kpiCell}>
              <KpiCard
                label="Start"
                value={formatDate(project.start_date)}
                icon={<Feather name="calendar" size={16} color={COLORS.green} />}
                color={COLORS.green}
              />
            </View>
            <View style={styles.kpiCell}>
              <KpiCard
                label="End"
                value={formatDate(project.end_date)}
                icon={<Feather name="flag" size={16} color={COLORS.red} />}
                color={COLORS.red}
              />
            </View>
          </View>

          {/* Progress bar */}
          <Card>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {width: `${project.progress ?? 0}%`}]} />
            </View>
            <Text style={styles.progressValue}>{project.progress ?? 0}% complete</Text>
          </Card>

          {/* Modules */}
          <SectionHeader title="Modules" />
          <View style={styles.moduleGrid}>
            {MODULES.map(mod => (
              <TouchableOpacity
                key={mod.screen}
                style={styles.moduleBtn}
                onPress={() => navigation.navigate(mod.screen as any, {projectId})}
                activeOpacity={0.8}>
                <View style={[styles.moduleIconWrap, {backgroundColor: mod.color + '18'}]}>
                  <Feather name={mod.icon} size={20} color={mod.color} />
                </View>
                <Text style={styles.moduleLabel}>{mod.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Details */}
          {project.client_name && (
            <Card>
              <SectionHeader title="Project Details" />
              {[
                {label: 'Client',   value: project.client_name},
                {label: 'Location', value: project.location},
                {label: 'Type',     value: capitalize(project.project_type)},
                {label: 'Owner',    value: project.owner?.name},
              ].filter(r => r.value).map(row => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    {flex: 1, backgroundColor: COLORS.bg},
  center:  {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg},
  loadingText:{color: COLORS.textMuted, fontSize: 15},
  errorText:  {color: COLORS.red, fontSize: 15},
  hero: {
    alignItems: 'center', padding: SPACING['2xl'],
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blueAlpha, borderWidth: 1,
    borderColor: COLORS.blue + '40',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  heroName: {fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6},
  heroDesc: {fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.md, lineHeight: 20},
  body:     {padding: SPACING.lg},
  kpiGrid:  {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs, marginBottom: SPACING.md},
  kpiCell:  {width: '50%', paddingHorizontal: SPACING.xs},
  progressLabel: {fontSize: 13, fontWeight: '600', color: COLORS.textSecond, marginBottom: SPACING.sm},
  progressBg:    {height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden'},
  progressFill:  {height: 8, backgroundColor: COLORS.blue, borderRadius: 4},
  progressValue: {fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs},
  moduleGrid:    {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl},
  moduleBtn: {
    width: '30%', flexGrow: 1,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: SPACING.md, alignItems: 'center', gap: 8,
  },
  moduleIconWrap:{width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center'},
  moduleLabel:   {fontSize: 11, color: COLORS.textSecond, textAlign: 'center'},
  detailRow:  {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  detailLabel:{fontSize: 13, color: COLORS.textMuted},
  detailValue:{fontSize: 13, color: COLORS.textPrimary, fontWeight: '500'},
});

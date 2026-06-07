import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import Svg, {Circle} from 'react-native-svg';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';
import {
  projectService, snagService, changeOrderService,
  workPackageService, dashboardService,
} from '../../api/services';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {formatCurrency} from '../../utils/formatters';
import {statusColor} from '../../utils/theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ─── Quick Access items ──────────────────────────────────────────────────── */
const QUICK_LINKS = [
  {label: 'Work Packages', desc: 'Tasks & milestones',  icon: 'package',        color: COLORS.orange,  screen: 'WorkPackages'},
  {label: 'Contracts',     desc: 'FIDIC & BOQ admin',   icon: 'file-text',      color: COLORS.blue,    screen: 'Contracts'},
  {label: 'Change Orders', desc: 'Variations & costs',  icon: 'refresh-cw',     color: COLORS.purple,  screen: 'ChangeOrders'},
  {label: 'Snag List',     desc: 'Defect tracking',     icon: 'alert-triangle', color: COLORS.red,     screen: 'Snags'},
  {label: 'Time Tracking', desc: 'Log & approve hrs',   icon: 'clock',          color: COLORS.yellow,  screen: 'TimeTracking'},
  {label: 'Daily Reports', desc: 'Site diaries',        icon: 'clipboard',      color: COLORS.teal,    screen: 'DailyReports'},
] as const;

/* ─── Portfolio Health SVG gauge ─────────────────────────────────────────── */
function HealthGauge({score}: {score: number}) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 70 ? COLORS.green : score >= 40 ? COLORS.yellow : COLORS.red;
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical';

  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeSvgWrap}>
        <Svg width={64} height={64} style={{transform: [{rotate: '-90deg'}]}}>
          <Circle cx={32} cy={32} r={r} fill="none" stroke="#1F2937" strokeWidth={5} />
          <Circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
          />
        </Svg>
        <Text style={styles.gaugeScore}>{score}</Text>
      </View>
      <View style={styles.gaugeInfo}>
        <Text style={styles.gaugeInfoLabel}>Portfolio Health</Text>
        <View style={styles.gaugeDotRow}>
          <View style={[styles.gaugeDot, {backgroundColor: color}]} />
          <Text style={[styles.gaugeDotLabel, {color}]}>{label}</Text>
        </View>
        <Text style={styles.gaugeProjectsLabel}>— projects tracked</Text>
      </View>
    </View>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiTile({label, value, sub, icon, color, onPress}: {
  label: string; value: string | number; sub?: string;
  icon: string; color: string; onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <View style={styles.kpiCell}>
      <Wrapper
        style={styles.kpiCard}
        onPress={onPress}
        activeOpacity={0.75}>
        <View style={[styles.kpiIconWrap, {backgroundColor: color + '22'}]}>
          <Feather name={icon as any} size={16} color={color} />
        </View>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
        {sub && <Text style={styles.kpiSub}>{sub}</Text>}
      </Wrapper>
    </View>
  );
}

/* ─── Alert row ──────────────────────────────────────────────────────────── */
function AlertRow({icon, color, title, desc, onPress}: {
  icon: string; color: string; title: string; desc: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.alertRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.alertIcon, {backgroundColor: color + '20'}]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertDesc}>{desc}</Text>
      </View>
      <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

/* ─── Project row ────────────────────────────────────────────────────────── */
function ProjectRow({project, onPress}: {project: any; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.projectRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.projectIcon}>
        <Feather name="briefcase" size={16} color={COLORS.blue} />
      </View>
      <View style={styles.projectInfo}>
        <View style={styles.projectNameRow}>
          <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
          <View style={[styles.projectBadge, {
            backgroundColor: statusColor(project.status) + '20',
            borderColor:     statusColor(project.status) + '40',
          }]}>
            <Text style={[styles.projectBadgeText, {color: statusColor(project.status)}]}>
              {(project.status || '').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.projectDesc} numberOfLines={1}>
          {project.description || 'No description'}
        </Text>
      </View>
      <View style={styles.projectProgress}>
        <Text style={styles.projectPct}>{project.progress ?? 0}%</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, {width: `${project.progress ?? 0}%`}]} />
        </View>
      </View>
      <Feather name="chevron-right" size={14} color={COLORS.textMuted} style={{marginLeft: 8}} />
    </TouchableOpacity>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export function HomeScreen() {
  const {user} = useAuth();
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* queries */
  const {data: projectsData, refetch: refetchProjects} = useQuery({
    queryKey: ['projects-home'],
    queryFn:  () => projectService.list({per_page: 50}),
  });
  const {data: statsData, refetch: refetchStats} = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => dashboardService.getStats().catch(() => null),
  });

  const projects = projectsData?.projects ?? [];
  const firstPid = projects[0]?.id ?? '';

  const {data: snagList = [], refetch: refetchSnags} = useQuery({
    queryKey: ['snags-home', firstPid],
    queryFn:  () => firstPid ? snagService.list({project_id: firstPid, per_page: 100}).then(r => r?.snags ?? []) : [],
    enabled:  !!firstPid,
  });
  const {data: coList = [], refetch: refetchCOs} = useQuery({
    queryKey: ['co-home', firstPid],
    queryFn:  () => firstPid ? changeOrderService.list({project_id: firstPid, per_page: 100}).then(r => r?.change_orders ?? []) : [],
    enabled:  !!firstPid,
  });
  const {data: wpList = [], refetch: refetchWPs} = useQuery({
    queryKey: ['wps-home', firstPid],
    queryFn:  () => firstPid ? workPackageService.list({project_id: firstPid, per_page: 100}).then(r => r?.work_packages ?? []) : [],
    enabled:  !!firstPid,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProjects(), refetchStats(), refetchSnags(), refetchCOs(), refetchWPs()]);
    setRefreshing(false);
  }, [refetchProjects, refetchStats, refetchSnags, refetchCOs, refetchWPs]);

  /* derived */
  const activeProjects  = projects.filter((p: any) => p.status === 'active');
  const onHold          = projects.filter((p: any) => p.status === 'on_hold').length;
  const completed       = projects.filter((p: any) => p.status === 'completed').length;
  const now             = new Date();
  const overdueWPs      = (wpList as any[]).filter((w: any) => w.due_date && new Date(w.due_date) < now && !['done', 'closed'].includes((w.status || '').toLowerCase()));
  const openSnags       = (snagList as any[]).filter((s: any) => s.status?.toLowerCase() === 'open');
  const criticalSnags   = (snagList as any[]).filter((s: any) => s.priority?.toLowerCase() === 'critical');
  const pendingCOs      = (coList as any[]).filter((c: any) => ['pending', 'under review', 'submitted'].includes((c.status || '').toLowerCase()));
  const totalCOValue    = (coList as any[]).reduce((s, c) => s + (Number(c.cost_impact) || 0), 0);
  const stats           = statsData ?? {};

  const portfolioScore = Math.min(100, Math.max(0,
    (activeProjects.length > 0 ? 50 : 20) +
    (overdueWPs.length === 0 ? 20 : Math.max(0, 20 - overdueWPs.length * 5)) +
    (criticalSnags.length === 0 ? 20 : Math.max(0, 20 - criticalSnags.length * 8)) +
    (pendingCOs.length < 3 ? 10 : 5),
  ));

  const actionCount = overdueWPs.length + criticalSnags.length + pendingCOs.length;

  const ariaInsight = criticalSnags.length > 0
    ? `${criticalSnags.length} critical snag${criticalSnags.length > 1 ? 's' : ''} detected — unresolved defects increase rectification costs by 40% if left beyond 14 days.`
    : overdueWPs.length > 0
    ? `${overdueWPs.length} overdue package${overdueWPs.length > 1 ? 's' : ''} — schedule slippage compounds at ~2.5% cost per week. Review critical path now.`
    : 'Portfolio health is strong. Continue daily reporting to maintain data accuracy for forecasting.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* glow blobs */}
          <View style={styles.heroGlow1} />
          <View style={styles.heroGlow2} />

          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroLogoRow}>
                <View style={styles.heroLogoIcon}>
                  <Feather name="layers" size={22} color="#fff" />
                </View>
                <View>
                  <Text style={styles.heroTitle}>PROTECHT BIM</Text>
                  <Text style={styles.heroSubtitle}>Construction Intelligence</Text>
                </View>
              </View>
              <Text style={styles.heroGreeting}>{greeting}. Here's your portfolio overview.</Text>
            </View>

            {/* Portfolio health gauge */}
            <View style={styles.heroGauge}>
              <HealthGauge score={portfolioScore} />
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* ── KPI GRID (6 tiles, 2 columns) ──────────────────────── */}
          <View style={styles.kpiGrid}>
            <KpiTile label="Total Projects"  value={projects.length}
              sub={`${activeProjects.length} active`}
              icon="briefcase" color={COLORS.blue}
              onPress={() => navigation.navigate('MainTabs', {screen: 'Projects'} as any)} />
            <KpiTile label="Work Packages"   value={(wpList as any[]).length}
              sub={`${overdueWPs.length} overdue`}
              icon="package" color={COLORS.orange}
              onPress={() => navigation.navigate('WorkPackages' as any)} />
            <KpiTile label="Open Snags"      value={openSnags.length}
              sub={`${criticalSnags.length} critical`}
              icon="alert-triangle" color={COLORS.red}
              onPress={() => navigation.navigate('Snags' as any)} />
            <KpiTile label="Pending COs"     value={pendingCOs.length}
              sub={totalCOValue > 0 ? formatCurrency(totalCOValue) : 'no cost'}
              icon="trending-up" color={COLORS.purple}
              onPress={() => navigation.navigate('ChangeOrders' as any)} />
            <KpiTile label="Completed"       value={completed}
              sub="projects delivered"
              icon="check-circle" color={COLORS.green} />
            <KpiTile label="On Hold"         value={onHold}
              sub="awaiting action"
              icon="pause-circle" color={COLORS.yellow} />
          </View>

          {/* ── ACTIVE PROJECTS ────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="briefcase" size={14} color={COLORS.blue} />
                <Text style={styles.sectionTitle}>Active Projects</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', {screen: 'Projects'} as any)}>
                <Text style={styles.sectionAction}>View all  ›</Text>
              </TouchableOpacity>
            </View>
            {projects.length === 0 ? (
              <View style={styles.emptySection}>
                <Feather name="briefcase" size={28} color={COLORS.textDisabled} />
                <Text style={styles.emptySectionText}>No projects yet</Text>
              </View>
            ) : (
              projects.slice(0, 5).map((p: any) => (
                <ProjectRow key={p.id} project={p}
                  onPress={() => navigation.navigate('ProjectDetail', {projectId: p.id})} />
              ))
            )}
          </View>

          {/* ── ACTION REQUIRED ────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Feather name="bell" size={14} color={COLORS.yellow} />
                <Text style={styles.sectionTitle}>Action Required</Text>
              </View>
              {actionCount > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{actionCount}</Text>
                </View>
              )}
            </View>

            {actionCount === 0 ? (
              <View style={styles.allClearRow}>
                <Feather name="check-circle" size={20} color={COLORS.green} />
                <Text style={styles.allClearText}>All clear — no actions needed</Text>
              </View>
            ) : (
              <>
                {criticalSnags.length > 0 && (
                  <AlertRow icon="alert-triangle" color={COLORS.red}
                    title={`${criticalSnags.length} Critical Snag${criticalSnags.length > 1 ? 's' : ''}`}
                    desc="Requires immediate site attention"
                    onPress={() => navigation.navigate('Snags' as any)} />
                )}
                {overdueWPs.length > 0 && (
                  <AlertRow icon="clock" color={COLORS.orange}
                    title={`${overdueWPs.length} Overdue Work Package${overdueWPs.length > 1 ? 's' : ''}`}
                    desc="Past due date, review schedule"
                    onPress={() => navigation.navigate('WorkPackages' as any)} />
                )}
                {pendingCOs.length > 0 && (
                  <AlertRow icon="file-text" color={COLORS.purple}
                    title={`${pendingCOs.length} Change Order${pendingCOs.length > 1 ? 's' : ''} Pending`}
                    desc="Awaiting review and approval"
                    onPress={() => navigation.navigate('ChangeOrders' as any)} />
                )}
              </>
            )}
          </View>

          {/* ── ARIA INSIGHT ───────────────────────────────────────── */}
          <View style={styles.ariaCard}>
            <View style={styles.ariaHeader}>
              <Feather name="zap" size={14} color={COLORS.blue} />
              <Text style={styles.ariaLabel}>ARIA INSIGHT</Text>
            </View>
            <Text style={styles.ariaText}>{ariaInsight}</Text>
            <TouchableOpacity style={styles.ariaLink} onPress={() => {}}>
              <Text style={styles.ariaLinkText}>Ask ARIA for details</Text>
              <Feather name="chevron-right" size={12} color={COLORS.blue} />
            </TouchableOpacity>
          </View>

          {/* ── QUICK ACCESS ───────────────────────────────────────── */}
          <Text style={styles.quickTitle}>QUICK ACCESS</Text>
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map(link => (
              <View key={link.screen} style={styles.quickCard}>
                <TouchableOpacity
                  style={styles.quickCardInner}
                  onPress={() => navigation.navigate(link.screen as any)}
                  activeOpacity={0.8}>
                  <View style={[styles.quickIconWrap, {backgroundColor: link.color + '20'}]}>
                    <Feather name={link.icon as any} size={20} color={link.color} />
                  </View>
                  <Text style={styles.quickLabel}>{link.label}</Text>
                  <Text style={styles.quickDesc}>{link.desc}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.bg},

  /* Hero */
  hero: {
    margin: SPACING.lg,
    backgroundColor: '#0D1117',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    overflow: 'hidden',
  },
  heroGlow1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160,
    backgroundColor: COLORS.blue,
    borderRadius: 80, opacity: 0.04,
  },
  heroGlow2: {
    position: 'absolute', bottom: -40, left: 40,
    width: 120, height: 120,
    backgroundColor: COLORS.purple,
    borderRadius: 60, opacity: 0.04,
  },
  heroContent:   {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  heroLeft:      {flex: 1, marginRight: SPACING.md},
  heroLogoRow:   {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm},
  heroLogoIcon:  {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.blue, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: {width: 0, height: 3},
    elevation: 6,
  },
  heroTitle:     {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  heroSubtitle:  {fontSize: 11, color: COLORS.textMuted, marginTop: 1},
  heroGreeting:  {fontSize: 13, color: COLORS.textSecond, lineHeight: 18},

  /* Gauge */
  heroGauge:    {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md,
  },
  gaugeWrap:    {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  gaugeSvgWrap: {position: 'relative', width: 64, height: 64, alignItems: 'center', justifyContent: 'center'},
  gaugeScore:   {
    position: 'absolute', fontSize: 14, fontWeight: '800',
    color: COLORS.textPrimary,
  },
  gaugeInfo:       {},
  gaugeInfoLabel:  {fontSize: 10, color: COLORS.textMuted, marginBottom: 4},
  gaugeDotRow:     {flexDirection: 'row', alignItems: 'center', gap: 5},
  gaugeDot:        {width: 6, height: 6, borderRadius: 3},
  gaugeDotLabel:   {fontSize: 11, fontWeight: '700'},
  gaugeProjectsLabel:{fontSize: 10, color: COLORS.textDisabled, marginTop: 2},

  body: {paddingHorizontal: SPACING.lg},

  /* KPI grid */
  kpiGrid:    {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs, marginBottom: SPACING.lg},
  kpiCell:    {width: '50%', paddingHorizontal: SPACING.xs, marginBottom: SPACING.sm},
  kpiCard:    {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  kpiIconWrap:{
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  kpiValue:   {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary},
  kpiLabel:   {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  kpiSub:     {fontSize: 10, color: COLORS.textDisabled, marginTop: 1},

  /* Section card */
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sectionHeaderLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  sectionTitle:      {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  sectionAction:     {fontSize: 12, color: COLORS.blue},
  actionBadge:       {paddingHorizontal: 6, paddingVertical: 2, backgroundColor: COLORS.red, borderRadius: 99},
  actionBadgeText:   {fontSize: 10, fontWeight: '800', color: '#fff'},
  emptySection:      {padding: SPACING.xl, alignItems: 'center', gap: 8},
  emptySectionText:  {fontSize: 13, color: COLORS.textMuted},

  /* All clear */
  allClearRow: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: SPACING.lg},
  allClearText:{fontSize: 14, color: COLORS.textSecond},

  /* Alert row */
  alertRow:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  alertIcon: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle:{fontSize: 13, fontWeight: '600', color: COLORS.textPrimary},
  alertDesc: {fontSize: 11, color: COLORS.textMuted, marginTop: 1},

  /* Project row */
  projectRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  projectIcon: {
    width: 34, height: 34, borderRadius: RADIUS.md,
    backgroundColor: COLORS.blueAlpha,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  projectInfo:    {flex: 1, minWidth: 0},
  projectNameRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
  projectName:    {fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1},
  projectBadge:   {
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1, flexShrink: 0,
  },
  projectBadgeText:{fontSize: 9, fontWeight: '700'},
  projectDesc:     {fontSize: 11, color: COLORS.textMuted},
  projectProgress: {alignItems: 'flex-end', gap: 3, flexShrink: 0},
  projectPct:      {fontSize: 11, color: COLORS.textSecond},
  progressBg:      {width: 50, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden'},
  progressFill:    {height: 4, backgroundColor: COLORS.blue, borderRadius: 2},

  /* ARIA */
  ariaCard: {
    backgroundColor: '#0D1117',
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.blue + '30',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  ariaHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm},
  ariaLabel:  {fontSize: 10, fontWeight: '700', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 1.5},
  ariaText:   {fontSize: 13, color: COLORS.textSecond, lineHeight: 20},
  ariaLink:   {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.md},
  ariaLinkText:{fontSize: 12, color: COLORS.blue},

  /* Quick Access */
  quickTitle: {
    fontSize: 11, fontWeight: '600', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs, marginBottom: SPACING.lg,
  },
  quickCard: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  quickCardInner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md,
  },
  quickIconWrap: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickLabel: {fontSize: 13, fontWeight: '700', color: COLORS.textPrimary},
  quickDesc:  {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
});

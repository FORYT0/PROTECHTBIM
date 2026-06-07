import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {dailyReportService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {EmptyState} from '../../components/Card';
import Feather from 'react-native-vector-icons/Feather';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {formatDate, formatDateTime} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function DailyReportsScreen({route}: RootScreenProps<'DailyReports'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['daily-reports', projectId],
    queryFn:  () => dailyReportService.list(projectId ? {project_id: projectId} : undefined),
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  const reports = (data?.reports ?? []).filter((r: any) =>
    !search || r.summary?.toLowerCase().includes(search.toLowerCase()) ||
    r.weather?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, {color: COLORS.blue}]}>
              {reports.filter((r: any) => {
                const d = new Date(r.report_date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search reports…" />

        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} />}
          renderItem={({item: r}) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>{new Date(r.report_date).getDate()}</Text>
                  <Text style={styles.dateMon}>{new Date(r.report_date).toLocaleString('default', {month: 'short'})}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>Daily Report</Text>
                  {r.weather && <Text style={styles.weather}>☁️ {r.weather}</Text>}
                  {r.temperature && <Text style={styles.weather}>🌡️ {r.temperature}°</Text>}
                </View>
                {r.author?.name && (
                  <View style={styles.authorBadge}>
                    <Text style={styles.authorText}>{r.author.name.charAt(0)}</Text>
                  </View>
                )}
              </View>

              {r.summary && (
                <Text style={styles.summary} numberOfLines={3}>{r.summary}</Text>
              )}

              <View style={styles.metaRow}>
                {r.workers_on_site != null && (
                  <Text style={styles.metaItem}>👷 {r.workers_on_site} workers</Text>
                )}
                {r.progress_percentage != null && (
                  <Text style={styles.metaItem}>📈 {r.progress_percentage}%</Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={!isLoading ? <EmptyState icon={<Feather name="clipboard" size={28} color={COLORS.textMuted} />} title="No daily reports" subtitle="Submit your first daily report" /> : null}
          ListFooterComponent={<View style={{height: 32}} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       {flex: 1, backgroundColor: COLORS.bg},
  container:  {flex: 1, padding: SPACING.lg},
  statsRow:   {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  statCard:   {flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center'},
  statValue:  {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:  {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  card:       {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm},
  dateBlock:  {width: 44, height: 44, backgroundColor: COLORS.blueAlpha, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center'},
  dateDay:    {fontSize: 18, fontWeight: '800', color: COLORS.blue, lineHeight: 20},
  dateMon:    {fontSize: 10, color: COLORS.blue, fontWeight: '600'},
  cardTitle:  {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  weather:    {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  authorBadge:{width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.purpleAlpha, alignItems: 'center', justifyContent: 'center'},
  authorText: {color: COLORS.purple, fontWeight: '700', fontSize: 14},
  summary:    {fontSize: 13, color: COLORS.textSecond, lineHeight: 18, marginBottom: SPACING.sm},
  metaRow:    {flexDirection: 'row', gap: SPACING.md},
  metaItem:   {fontSize: 12, color: COLORS.textMuted},
});

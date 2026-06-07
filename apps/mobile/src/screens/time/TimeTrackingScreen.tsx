import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {timeService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {EmptyState, KpiCard} from '../../components/Card';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {formatDate, formatHours} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function TimeTrackingScreen({route}: RootScreenProps<'TimeTracking'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['time-entries', projectId],
    queryFn:  () => timeService.list(projectId ? {project_id: projectId} : undefined),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const entries = (data?.time_entries ?? []).filter((e: any) =>
    !search || e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.task_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalHours = entries.reduce((s: number, e: any) => s + (Number(e.hours) || 0), 0);
  const thisWeek   = entries.filter((e: any) => {
    const d = new Date(e.date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= weekStart;
  });
  const weekHours = thisWeek.reduce((s: number, e: any) => s + (Number(e.hours) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <KpiCard
              label="Total Hours"
              value={formatHours(totalHours)}
              icon={<Feather name="clock" size={16} color={COLORS.blue} />}
              color={COLORS.blue}
            />
          </View>
          <View style={styles.kpiCell}>
            <KpiCard
              label="This Week"
              value={formatHours(weekHours)}
              icon={<Feather name="calendar" size={16} color={COLORS.green} />}
              color={COLORS.green}
            />
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search time entries…" />

        <FlatList
          data={entries}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: e}) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Feather name="clock" size={18} color={COLORS.blue} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTask} numberOfLines={1}>
                    {e.task_name || e.description || 'Time entry'}
                  </Text>
                  <Text style={styles.cardDate}>{formatDate(e.date)}</Text>
                  {e.description && e.task_name && (
                    <Text style={styles.cardDesc} numberOfLines={1}>{e.description}</Text>
                  )}
                </View>
                <View style={styles.hoursBox}>
                  <Text style={styles.hoursValue}>{formatHours(e.hours)}</Text>
                  {e.billable && <Text style={styles.billableTag}>Billable</Text>}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Feather name="clock" size={28} color={COLORS.textMuted} />}
                title="No time entries"
                subtitle="Log your first time entry"
              />
            ) : null
          }
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
  kpiGrid:    {flexDirection: 'row', marginHorizontal: -SPACING.xs, marginBottom: SPACING.md},
  kpiCell:    {flex: 1, paddingHorizontal: SPACING.xs},
  card:       {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardRow:    {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  cardIcon:   {width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  cardTask:   {fontSize: 14, fontWeight: '600', color: COLORS.textPrimary},
  cardDate:   {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  cardDesc:   {fontSize: 12, color: COLORS.textMuted},
  hoursBox:   {alignItems: 'flex-end'},
  hoursValue: {fontSize: 18, fontWeight: '800', color: COLORS.blue},
  billableTag:{fontSize: 10, color: COLORS.green, marginTop: 2, fontWeight: '600'},
});

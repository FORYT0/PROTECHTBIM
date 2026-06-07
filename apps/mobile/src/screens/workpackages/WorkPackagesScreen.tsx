import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {workPackageService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor, priorityColor} from '../../utils/theme';
import {formatDate, formatHours, capitalize} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function WorkPackagesScreen({route}: RootScreenProps<'WorkPackages'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['work-packages', projectId],
    queryFn:  () => workPackageService.list(projectId ? {project_id: projectId} : undefined),
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  const items = (data?.work_packages ?? []).filter((wp: any) =>
    !search || wp.title?.toLowerCase().includes(search.toLowerCase()) ||
    wp.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalItems  = items.length;
  const doneItems   = items.filter((wp: any) => wp.status === 'done' || wp.status === 'completed').length;
  const progress    = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, {color: COLORS.green}]}>{doneItems}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, {color: COLORS.blue}]}>{progress}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search work packages…" />

        <FlatList
          data={items}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} />}
          renderItem={({item: wp}) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{wp.title || wp.name}</Text>
                  {wp.assignee?.name && (
                    <View style={styles.assigneeRow}><Feather name="user" size={11} color={COLORS.textMuted} /><Text style={styles.cardAssignee}> {wp.assignee.name}</Text></View>
                  )}
                </View>
                <View style={{gap: 4, alignItems: 'flex-end'}}>
                  <Badge label={capitalize(wp.status ?? 'todo')} color={statusColor(wp.status)} />
                  {wp.priority && <Badge label={capitalize(wp.priority)} color={priorityColor(wp.priority)} />}
                </View>
              </View>

              {wp.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{wp.description}</Text>
              )}

              {/* Progress */}
              {wp.progress != null && (
                <View style={styles.progressRow}>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, {width: `${wp.progress}%`}]} />
                  </View>
                  <Text style={styles.progressText}>{wp.progress}%</Text>
                </View>
              )}

              <View style={styles.metaRow}>
                {wp.estimated_hours && (
                  <View style={styles.metaItemRow}><Feather name="clock" size={11} color={COLORS.textMuted} /><Text style={styles.metaItem}> {formatHours(wp.estimated_hours)}</Text></View>
                )}
                {wp.due_date && (
                  <View style={styles.metaItemRow}><Feather name="calendar" size={11} color={COLORS.textMuted} /><Text style={styles.metaItem}> Due {formatDate(wp.due_date)}</Text></View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={!isLoading ? <EmptyState icon={<Feather name="package" size={28} color={COLORS.textMuted} />} title="No work packages" subtitle="Break your project into work packages" /> : null}
          ListFooterComponent={<View style={{height: 32}} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        {flex: 1, backgroundColor: COLORS.bg},
  container:   {flex: 1, padding: SPACING.lg},
  statsRow:    {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  statCard:    {flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center'},
  statValue:   {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:   {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  card:        {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:     {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs},
  cardTitle:   {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  cardAssignee:{fontSize: 12, color: COLORS.textMuted, marginTop: 4},
  cardDesc:    {fontSize: 13, color: COLORS.textSecond, lineHeight: 18, marginBottom: SPACING.xs},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.xs},
  progressBg:  {flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2},
  progressFill:{height: 4, backgroundColor: COLORS.blue, borderRadius: 2},
  progressText:{fontSize: 11, color: COLORS.textMuted, width: 32},
  metaRow:     {flexDirection: 'row', gap: SPACING.md},
  metaItem:    {fontSize: 12, color: COLORS.textMuted},
});

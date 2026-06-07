import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {snagService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor, priorityColor} from '../../utils/theme';
import {formatDate, capitalize} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function SnagsScreen({route}: RootScreenProps<'Snags'>) {
  const projectId = route.params?.projectId;
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['snags', projectId, statusFilter],
    queryFn:  () => snagService.list({
      ...(projectId && {project_id: projectId}),
      ...(statusFilter !== 'all' && {status: statusFilter}),
    }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => snagService.resolve(id),
    onSuccess:  () => qc.invalidateQueries({queryKey: ['snags']}),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const snags = (data?.snags ?? []).filter((s: any) =>
    !search || s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.location?.toLowerCase().includes(search.toLowerCase()),
  );

  const openCount     = snags.filter((s: any) => s.status === 'open').length;
  const criticalCount = snags.filter((s: any) => s.priority === 'critical').length;
  const resolvedCount = snags.filter((s: any) => s.status === 'resolved').length;

  const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved'] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          {[
            {label: 'Open',     value: openCount,     color: COLORS.red},
            {label: 'Critical', value: criticalCount, color: COLORS.yellow},
            {label: 'Resolved', value: resolvedCount, color: COLORS.green},
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, {color: s.color}]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search snags…" />

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
              onPress={() => setStatus(f)}>
              <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                {capitalize(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={snags}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: s}) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.priorityBar, {backgroundColor: priorityColor(s.priority)}]} />
                <View style={{flex: 1, paddingLeft: SPACING.sm}}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
                  {s.location && (
                    <View style={styles.locationRow}>
                      <Feather name="map-pin" size={11} color={COLORS.textMuted} />
                      <Text style={styles.cardLocation}> {s.location}</Text>
                    </View>
                  )}
                </View>
                <View style={{gap: 4, alignItems: 'flex-end'}}>
                  <Badge label={capitalize(s.status ?? 'open')} color={statusColor(s.status)} />
                  {s.priority && <Badge label={capitalize(s.priority)} color={priorityColor(s.priority)} />}
                </View>
              </View>

              {s.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text>
              )}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={11} color={COLORS.textMuted} />
                  <Text style={styles.metaText}> {formatDate(s.created_at)}</Text>
                </View>
                {s.due_date && (
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={11} color={COLORS.textMuted} />
                    <Text style={styles.metaText}> Due {formatDate(s.due_date)}</Text>
                  </View>
                )}
              </View>

              {s.status !== 'resolved' && (
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => Alert.alert('Resolve Snag', 'Mark this snag as resolved?', [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Resolve', onPress: () => resolveMutation.mutate(s.id)},
                  ])}>
                  <Feather name="check-circle" size={14} color={COLORS.green} />
                  <Text style={styles.resolveBtnText}> Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Feather name="check-circle" size={28} color={COLORS.textMuted} />}
                title="No snags found"
                subtitle={openCount === 0 ? 'All snags resolved!' : 'No snags match your filter'}
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
  safe:            {flex: 1, backgroundColor: COLORS.bg},
  container:       {flex: 1, padding: SPACING.lg},
  statsRow:        {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  statCard:        {flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center'},
  statValue:       {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:       {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  filterRow:       {flexDirection: 'row', gap: 8, marginBottom: SPACING.md},
  filterChip:      {paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card},
  filterChipActive:{borderColor: COLORS.blue, backgroundColor: COLORS.blueAlpha},
  filterText:      {fontSize: 12, color: COLORS.textMuted},
  filterTextActive:{color: COLORS.blue, fontWeight: '600'},
  card:            {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:         {flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm},
  priorityBar:     {width: 3, borderRadius: 2, alignSelf: 'stretch'},
  cardTitle:       {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  locationRow:     {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  cardLocation:    {fontSize: 12, color: COLORS.textMuted},
  cardDesc:        {fontSize: 13, color: COLORS.textSecond, lineHeight: 18, marginBottom: SPACING.sm},
  metaRow:         {flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.sm},
  metaItem:        {flexDirection: 'row', alignItems: 'center'},
  metaText:        {fontSize: 12, color: COLORS.textMuted},
  resolveBtn:      {flexDirection: 'row', backgroundColor: COLORS.greenAlpha, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.green + '40', paddingVertical: SPACING.sm, alignItems: 'center', justifyContent: 'center'},
  resolveBtnText:  {color: COLORS.green, fontWeight: '600', fontSize: 13},
});

import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {workPackageService} from '../../api/services';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, priorityColor} from '../../utils/theme';
import {capitalize} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

const COLUMNS = ['todo', 'in_progress', 'review', 'done'];

export function BoardScreen({route}: RootScreenProps<'Board'>) {
  const projectId = route.params?.projectId;
  const [activeCol, setActiveCol] = useState<string>(COLUMNS[0]);
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['work-packages-board', projectId],
    queryFn:  () => workPackageService.list(projectId ? {project_id: projectId} : undefined),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const allItems = data?.work_packages ?? [];
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = allItems.filter((wp: any) => (wp.status ?? 'todo') === col);
    return acc;
  }, {} as Record<string, any[]>);

  const items = byStatus[activeCol] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.colTabs}
        contentContainerStyle={styles.colTabsContent}>
        {COLUMNS.map(col => {
          const count = (byStatus[col] ?? []).length;
          return (
            <TouchableOpacity
              key={col}
              style={[styles.colTab, activeCol === col && styles.colTabActive]}
              onPress={() => setActiveCol(col)}>
              <Text style={[styles.colTabText, activeCol === col && styles.colTabTextActive]}>
                {capitalize(col.replace('_', ' '))}
              </Text>
              {count > 0 && (
                <View style={[styles.colBadge, activeCol === col && styles.colBadgeActive]}>
                  <Text style={styles.colBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }
        renderItem={({item: wp}) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle} numberOfLines={2}>{wp.title || wp.name}</Text>
                {wp.assignee?.name && (
                  <View style={styles.assigneeRow}>
                    <Feather name="user" size={11} color={COLORS.textMuted} />
                    <Text style={styles.cardAssignee}> {wp.assignee.name}</Text>
                  </View>
                )}
              </View>
              {wp.priority && (
                <Badge label={capitalize(wp.priority)} color={priorityColor(wp.priority)} />
              )}
            </View>
            {wp.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>{wp.description}</Text>
            )}
            {(wp.estimated_hours || wp.progress != null) && (
              <View style={styles.metaRow}>
                {wp.estimated_hours && (
                  <View style={styles.metaItem}>
                    <Feather name="clock" size={11} color={COLORS.textMuted} />
                    <Text style={styles.metaText}> {wp.estimated_hours}h est.</Text>
                  </View>
                )}
                {wp.progress != null && (
                  <View style={styles.metaItem}>
                    <Feather name="trending-up" size={11} color={COLORS.textMuted} />
                    <Text style={styles.metaText}> {wp.progress}%</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Feather name="layout" size={28} color={COLORS.textMuted} />}
              title={`Nothing ${capitalize(activeCol.replace('_', ' '))}`}
              subtitle="All clear in this column"
            />
          ) : null
        }
        ListFooterComponent={<View style={{height: 32}} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           {flex: 1, backgroundColor: COLORS.bg},
  colTabs:        {maxHeight: 56, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  colTabsContent: {paddingHorizontal: SPACING.lg, gap: SPACING.xs, alignItems: 'center'},
  colTab:         {flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, gap: 6},
  colTabActive:   {backgroundColor: COLORS.blueAlpha},
  colTabText:     {fontSize: 13, color: COLORS.textMuted, fontWeight: '600'},
  colTabTextActive:{color: COLORS.blue},
  colBadge:       {width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center'},
  colBadgeActive: {backgroundColor: COLORS.blue},
  colBadgeText:   {fontSize: 11, color: COLORS.textPrimary, fontWeight: '700'},
  list:           {flex: 1},
  listContent:    {padding: SPACING.lg},
  card:           {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:        {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs},
  cardTitle:      {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm},
  assigneeRow:    {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  cardAssignee:   {fontSize: 12, color: COLORS.textMuted},
  cardDesc:       {fontSize: 13, color: COLORS.textSecond, lineHeight: 18, marginBottom: SPACING.xs},
  metaRow:        {flexDirection: 'row', gap: SPACING.md},
  metaItem:       {flexDirection: 'row', alignItems: 'center'},
  metaText:       {fontSize: 12, color: COLORS.textMuted},
});

import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {activityService} from '../../api/services';
import {EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {timeAgo} from '../../utils/formatters';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ACTION_ICONS: Record<string, {name: FeatherName; color: string}> = {
  created:  {name: 'plus-circle',   color: COLORS.blue},
  updated:  {name: 'edit-2',        color: COLORS.yellow},
  deleted:  {name: 'trash-2',       color: COLORS.red},
  approved: {name: 'check-circle',  color: COLORS.green},
  rejected: {name: 'x-circle',      color: COLORS.red},
  resolved: {name: 'tool',          color: COLORS.green},
  assigned: {name: 'user-check',    color: COLORS.blue},
  commented:{name: 'message-circle',color: COLORS.purple},
};
const DEFAULT_ACTION: {name: FeatherName; color: string} = {name: 'activity', color: COLORS.textMuted};

export function ActivityScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['activities'],
    queryFn:  () => activityService.list({per_page: 50}),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const activities = data?.activities ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Feed</Text>
        <Text style={styles.sub}>{activities.length} recent events</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.blue} colors={[COLORS.blue]} />
        }
        renderItem={({item: a}) => {
          const {name, color} = ACTION_ICONS[a.action?.toLowerCase()] ?? DEFAULT_ACTION;
          return (
            <View style={styles.item}>
              <View style={styles.timelineCol}>
                <View style={styles.dot} />
                <View style={styles.line} />
              </View>

              <View style={styles.itemContent}>
                <View style={[styles.itemIcon, {backgroundColor: color + '18'}]}>
                  <Feather name={name} size={16} color={color} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.itemText}>
                    <Text style={styles.itemUser}>{a.user?.name ?? 'Someone'}</Text>
                    {' '}{a.action ?? 'performed an action'}{' '}
                    <Text style={styles.itemEntity}>{a.entity_type ?? 'item'}</Text>
                  </Text>
                  {a.description && (
                    <Text style={styles.itemDesc} numberOfLines={2}>{a.description}</Text>
                  )}
                  <Text style={styles.itemTime}>{timeAgo(a.created_at)}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Feather name="activity" size={28} color={COLORS.textMuted} />}
              title="No activity yet"
              subtitle="Actions will appear here"
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
  safe:        {flex: 1, backgroundColor: COLORS.bg},
  header:      {padding: SPACING.lg, paddingBottom: SPACING.md},
  title:       {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary},
  sub:         {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  list:        {paddingHorizontal: SPACING.lg},
  item:        {flexDirection: 'row', marginBottom: SPACING.sm},
  timelineCol: {width: 24, alignItems: 'center'},
  dot:         {width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.blue, marginTop: 14},
  line:        {flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4},
  itemContent: {flex: 1, flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginLeft: SPACING.sm, marginBottom: SPACING.xs},
  itemIcon:    {width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center'},
  itemText:    {fontSize: 13, color: COLORS.textSecond, lineHeight: 18},
  itemUser:    {fontWeight: '700', color: COLORS.textPrimary},
  itemEntity:  {color: COLORS.blue, fontWeight: '600'},
  itemDesc:    {fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 16},
  itemTime:    {fontSize: 11, color: COLORS.textMuted, marginTop: 4},
});

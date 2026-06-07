import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {costService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState, KpiCard} from '../../components/Card';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {formatDate, formatCurrency, capitalize} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

const CATEGORY_COLORS: Record<string, string> = {
  labor:     COLORS.blue,
  material:  COLORS.green,
  equipment: COLORS.yellow,
  overhead:  COLORS.purple,
  other:     COLORS.textMuted,
};

type FeatherName = React.ComponentProps<typeof Feather>['name'];
const CATEGORY_ICONS: Record<string, FeatherName> = {
  labor:     'users',
  material:  'box',
  equipment: 'tool',
  overhead:  'layers',
  other:     'briefcase',
};

export function CostTrackingScreen({route}: RootScreenProps<'CostTracking'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data: listData, refetch, isLoading} = useQuery({
    queryKey: ['cost-entries', projectId],
    queryFn:  () => costService.list(projectId),
  });

  const {data: summaryData} = useQuery({
    queryKey: ['cost-summary', projectId],
    queryFn:  () => costService.getSummary(projectId),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const costs = (listData?.costs ?? []).filter((c: any) =>
    !search || c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalCost  = costs.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
  const budgetUsed = summaryData?.budget_utilization ?? 0;

  const byCategory = costs.reduce((acc: Record<string, number>, c: any) => {
    acc[c.category] = (acc[c.category] ?? 0) + (Number(c.amount) || 0);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <KpiCard
              label="Total Spent"
              value={formatCurrency(totalCost)}
              icon={<Feather name="dollar-sign" size={16} color={COLORS.yellow} />}
              color={COLORS.yellow}
            />
          </View>
          <View style={styles.kpiCell}>
            <KpiCard
              label="Budget Used"
              value={`${budgetUsed}%`}
              icon={<Feather name="bar-chart-2" size={16} color={budgetUsed > 80 ? COLORS.red : COLORS.green} />}
              color={budgetUsed > 80 ? COLORS.red : COLORS.green}
            />
          </View>
        </View>

        {Object.keys(byCategory).length > 0 && (
          <View style={styles.categoryRow}>
            {Object.entries(byCategory).map(([cat, val]) => (
              <View key={cat} style={[styles.categoryChip, {borderColor: (CATEGORY_COLORS[cat] ?? COLORS.textMuted) + '40'}]}>
                <View style={[styles.categoryDot, {backgroundColor: CATEGORY_COLORS[cat] ?? COLORS.textMuted}]} />
                <Text style={styles.categoryLabel}>{capitalize(cat)}</Text>
                <Text style={styles.categoryValue}>{formatCurrency(val as number)}</Text>
              </View>
            ))}
          </View>
        )}

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search cost entries…" />

        <FlatList
          data={costs}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: c}) => {
            const catColor = CATEGORY_COLORS[c.category] ?? COLORS.textMuted;
            const catIcon  = CATEGORY_ICONS[c.category] ?? 'briefcase';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.categoryIcon, {backgroundColor: catColor + '20'}]}>
                    <Feather name={catIcon} size={18} color={catColor} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.cardDesc} numberOfLines={2}>{c.description || capitalize(c.category)}</Text>
                    <Text style={styles.cardDate}>{formatDate(c.date)} · {capitalize(c.category)}</Text>
                  </View>
                  <Text style={[styles.cardAmount, {color: catColor}]}>
                    {formatCurrency(c.amount)}
                  </Text>
                </View>
                {c.vendor && <Text style={styles.vendorText}>Vendor: {c.vendor}</Text>}
              </View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Feather name="dollar-sign" size={28} color={COLORS.textMuted} />}
                title="No cost entries"
                subtitle="Record your first cost entry"
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
  safe:        {flex: 1, backgroundColor: COLORS.bg},
  container:   {flex: 1, padding: SPACING.lg},
  kpiGrid:     {flexDirection: 'row', marginHorizontal: -SPACING.xs, marginBottom: SPACING.md},
  kpiCell:     {flex: 1, paddingHorizontal: SPACING.xs},
  categoryRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md},
  categoryChip:{flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.card, borderRadius: RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs},
  categoryDot: {width: 8, height: 8, borderRadius: 4},
  categoryLabel:{fontSize: 12, color: COLORS.textSecond},
  categoryValue:{fontSize: 12, color: COLORS.textPrimary, fontWeight: '600'},
  card:        {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:     {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  categoryIcon:{width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center'},
  cardDesc:    {fontSize: 14, color: COLORS.textPrimary, fontWeight: '600'},
  cardDate:    {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  cardAmount:  {fontSize: 16, fontWeight: '800'},
  vendorText:  {fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs},
});

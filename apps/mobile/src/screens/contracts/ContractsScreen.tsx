import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {contractService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor} from '../../utils/theme';
import {formatDate, formatCurrency, capitalize} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function ContractsScreen({route}: RootScreenProps<'Contracts'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['contracts', projectId],
    queryFn:  () => contractService.list(projectId ? {project_id: projectId} : undefined),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const contracts = (data?.contracts ?? []).filter((c: any) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.contractor_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalValue = contracts.reduce((s: number, c: any) => s + (Number(c.value) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contracts.length}</Text>
            <Text style={styles.statLabel}>Contracts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, {color: COLORS.yellow}]}>{formatCurrency(totalValue)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, {color: COLORS.green}]}>
              {contracts.filter((c: any) => c.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search contracts…" />

        <FlatList
          data={contracts}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: c}) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Feather name="file-text" size={18} color={COLORS.blue} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                  {c.contractor_name && <Text style={styles.cardSub}>{c.contractor_name}</Text>}
                </View>
                <Badge label={capitalize(c.status ?? 'draft')} color={statusColor(c.status)} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaValue}>{formatCurrency(c.value)}</Text>
                <Text style={styles.metaDivider}>·</Text>
                <Text style={styles.metaDate}>Expires {formatDate(c.end_date)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Feather name="file-text" size={28} color={COLORS.textMuted} />}
                title="No contracts"
                subtitle="Add a contract to get started"
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
  statsRow:   {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  statCard:   {flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center'},
  statValue:  {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:  {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  card:       {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:    {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm},
  cardIcon:   {width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  cardTitle:  {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  cardSub:    {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  metaRow:    {flexDirection: 'row', alignItems: 'center', gap: SPACING.xs},
  metaValue:  {fontSize: 13, color: COLORS.yellow, fontWeight: '600'},
  metaDivider:{color: COLORS.textMuted},
  metaDate:   {fontSize: 12, color: COLORS.textMuted},
});

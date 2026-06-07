import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {resourceService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {capitalize} from '../../utils/formatters';

export function ResourcesScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['resources'],
    queryFn:  () => resourceService.list(),
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  const resources = (data?.resources ?? []).filter((r: any) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase()),
  );

  const byType = resources.reduce((acc: Record<string, number>, r: any) => {
    acc[r.type ?? 'other'] = (acc[r.type ?? 'other'] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{resources.length}</Text>
            <Text style={styles.statLabel}>Total Resources</Text>
          </View>
          {Object.entries(byType).slice(0, 2).map(([type, count]) => (
            <View key={type} style={styles.statCard}>
              <Text style={[styles.statValue, {color: COLORS.blue}]}>{count as number}</Text>
              <Text style={styles.statLabel}>{capitalize(type)}</Text>
            </View>
          ))}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search resources…" />

        <FlatList
          data={resources}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} />}
          renderItem={({item: r}) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {r.type === 'human' ? (
                      <Feather name="user" size={18} color={COLORS.blue} />
                    ) : r.type === 'equipment' ? (
                      <Feather name="tool" size={18} color={COLORS.yellow} />
                    ) : (
                      <Feather name="package" size={18} color={COLORS.green} />
                    )}
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardName}>{r.name}</Text>
                  {r.role && <Text style={styles.cardRole}>{r.role}</Text>}
                  {r.email && <Text style={styles.cardEmail}>{r.email}</Text>}
                </View>
                <View style={{gap: 4}}>
                  <Badge label={capitalize(r.type ?? 'resource')} color={COLORS.blue} />
                  {r.availability != null && (
                    <Text style={styles.availability}>{r.availability}% available</Text>
                  )}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={!isLoading ? <EmptyState icon={<Feather name="users" size={28} color={COLORS.textMuted} />} title="No resources" subtitle="Add team members and equipment" /> : null}
          ListFooterComponent={<View style={{height: 32}} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         {flex: 1, backgroundColor: COLORS.bg},
  container:    {flex: 1, padding: SPACING.lg},
  statsRow:     {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  statCard:     {flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, alignItems: 'center'},
  statValue:    {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:    {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  card:         {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardRow:      {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  avatar:       {width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  avatarText:   {fontSize: 22},
  cardName:     {fontSize: 15, fontWeight: '700', color: COLORS.textPrimary},
  cardRole:     {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  cardEmail:    {fontSize: 12, color: COLORS.blue, marginTop: 1},
  availability: {fontSize: 11, color: COLORS.green, textAlign: 'right'},
});

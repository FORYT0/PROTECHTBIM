import React, {useState, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import {projectService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor} from '../../utils/theme';
import {formatDate, capitalize} from '../../utils/formatters';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS = ['all', 'active', 'planning', 'on_hold', 'completed'];

export function ProjectsScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn:  () => projectService.list(
      statusFilter !== 'all' ? {status: statusFilter} : undefined,
    ),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const projects = (data?.projects ?? []).filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount    = projects.filter((p: any) => p.status === 'active').length;
  const completedCount = projects.filter((p: any) => p.status === 'completed').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.sub}>{projects.length} projects · {activeCount} active · {completedCount} done</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => {}}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search projects…" />

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              onPress={() => setStatus(s)}>
              <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
                {capitalize(s)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={projects}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: p}) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProjectDetail', {projectId: p.id})}
              activeOpacity={0.8}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Feather name="briefcase" size={20} color={COLORS.blue} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                  {p.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>{p.description}</Text>
                  )}
                </View>
                <Badge label={capitalize(p.status)} color={statusColor(p.status)} />
              </View>

              <View style={styles.progressRow}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {width: `${p.progress ?? 0}%`}]} />
                </View>
                <Text style={styles.progressText}>{p.progress ?? 0}%</Text>
              </View>

              <View style={styles.metaRow}>
                {p.start_date && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Start</Text>
                    <Text style={styles.metaValue}>{formatDate(p.start_date)}</Text>
                  </View>
                )}
                {p.end_date && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>End</Text>
                    <Text style={styles.metaValue}>{formatDate(p.end_date)}</Text>
                  </View>
                )}
                {p.budget && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Budget</Text>
                    <Text style={[styles.metaValue, {color: COLORS.yellow}]}>
                      ${(p.budget / 1000).toFixed(0)}K
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            isLoading ? null : (
              <EmptyState
                icon={<Feather name="briefcase" size={28} color={COLORS.textMuted} />}
                title="No projects found"
                subtitle={search ? 'Try a different search term' : 'Create your first project'}
              />
            )
          }
          ListFooterComponent={<View style={{height: 32}} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     {flex: 1, backgroundColor: COLORS.bg},
  header:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingBottom: SPACING.md,
  },
  title:    {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary},
  sub:      {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  addBtn:   {backgroundColor: COLORS.blue, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm},
  addBtnText:{color: '#fff', fontWeight: '700', fontSize: 14},
  content:  {flex: 1, paddingHorizontal: SPACING.lg},
  filterRow:{flexDirection: 'row', marginBottom: SPACING.md, gap: 8},
  filterChip:{
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  filterChipActive:{borderColor: COLORS.blue, backgroundColor: COLORS.blueAlpha},
  filterText:      {fontSize: 12, color: COLORS.textMuted},
  filterTextActive:{color: COLORS.blue, fontWeight: '600'},
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  cardTop:  {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm},
  cardIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center',
  },
  cardName: {fontSize: 15, fontWeight: '700', color: COLORS.textPrimary},
  cardDesc: {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
  progressRow:{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm},
  progressBg:  {flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2},
  progressFill:{height: 4, backgroundColor: COLORS.blue, borderRadius: 2},
  progressText:{fontSize: 11, color: COLORS.textMuted, width: 32, textAlign: 'right'},
  metaRow:  {flexDirection: 'row', gap: SPACING.lg},
  metaItem: {},
  metaLabel:{fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5},
  metaValue:{fontSize: 12, color: COLORS.textSecond, fontWeight: '600', marginTop: 1},
});

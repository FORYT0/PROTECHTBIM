import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {wikiService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {EmptyState} from '../../components/Card';
import Feather from 'react-native-vector-icons/Feather';
import {COLORS, SPACING, RADIUS} from '../../utils/theme';
import {timeAgo} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function WikiScreen({route}: RootScreenProps<'Wiki'>) {
  const projectId = route.params?.projectId;
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['wiki', projectId],
    queryFn:  () => wikiService.list(projectId),
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  const pages = (data?.pages ?? []).filter((p: any) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
          <Text style={styles.backText}>← Back to Wiki</Text>
        </TouchableOpacity>
        <View style={styles.pageContainer}>
          <Text style={styles.pageTitle}>{selected.title}</Text>
          <Text style={styles.pageMeta}>
            Last updated {timeAgo(selected.updated_at)}
            {selected.author?.name ? ` by ${selected.author.name}` : ''}
          </Text>
          <Text style={styles.pageContent}>{selected.content ?? 'No content.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search wiki pages…" />

        <FlatList
          data={pages}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} />}
          renderItem={({item: p}) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(p)} activeOpacity={0.8}>
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}><Feather name="file-text" size={18} color={COLORS.blue} /></View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardMeta}>
                    {timeAgo(p.updated_at)}
                    {p.author?.name ? ` · ${p.author.name}` : ''}
                  </Text>
                  {p.content && (
                    <Text style={styles.cardPreview} numberOfLines={2}>
                      {p.content.replace(/[#*`]/g, '').trim()}
                    </Text>
                  )}
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!isLoading ? <EmptyState icon={<Feather name="book-open" size={28} color={COLORS.textMuted} />} title="No wiki pages" subtitle="Create your first wiki page" /> : null}
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
  card:         {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardRow:      {flexDirection: 'row', alignItems: 'center', gap: SPACING.md},
  cardIcon:     {width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  cardTitle:    {fontSize: 15, fontWeight: '700', color: COLORS.textPrimary},
  cardMeta:     {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  cardPreview:  {fontSize: 12, color: COLORS.textSecond, marginTop: 4, lineHeight: 16},
  chevron:      {fontSize: 20, color: COLORS.textMuted},
  backBtn:      {padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  backText:     {color: COLORS.blue, fontSize: 15, fontWeight: '600'},
  pageContainer:{flex: 1, padding: SPACING.lg},
  pageTitle:    {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs},
  pageMeta:     {fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING['2xl']},
  pageContent:  {fontSize: 14, color: COLORS.textSecond, lineHeight: 22},
});

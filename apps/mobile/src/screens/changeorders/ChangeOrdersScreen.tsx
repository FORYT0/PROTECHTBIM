import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Feather from 'react-native-vector-icons/Feather';
import {changeOrderService} from '../../api/services';
import {SearchBar} from '../../components/SearchBar';
import {Badge, EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor, priorityColor} from '../../utils/theme';
import {formatCurrency, capitalize, timeAgo} from '../../utils/formatters';
import type {RootScreenProps} from '../../navigation/types';

export function ChangeOrdersScreen({route}: RootScreenProps<'ChangeOrders'>) {
  const projectId = route.params?.projectId;
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {data, refetch, isLoading} = useQuery({
    queryKey: ['change-orders', projectId],
    queryFn:  () => changeOrderService.list(projectId ? {project_id: projectId} : undefined),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => changeOrderService.approve(id),
    onSuccess:  () => qc.invalidateQueries({queryKey: ['change-orders']}),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => changeOrderService.reject(id),
    onSuccess:  () => qc.invalidateQueries({queryKey: ['change-orders']}),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await refetch(); setRefreshing(false);
  }, [refetch]);

  const orders = (data?.change_orders ?? []).filter((co: any) =>
    !search || co.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const pending  = orders.filter((co: any) => co.status === 'pending').length;
  const approved = orders.filter((co: any) => co.status === 'approved').length;
  const totalCost = orders.filter((co: any) => co.status === 'approved')
    .reduce((s: number, co: any) => s + (Number(co.cost_impact) || 0), 0);

  const handleApprove = (id: string) => {
    Alert.alert('Approve Change Order', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Approve', onPress: () => approveMutation.mutate(id)},
    ]);
  };
  const handleReject = (id: string) => {
    Alert.alert('Reject Change Order', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(id)},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.statsRow}>
          {[
            {label: 'Pending', value: pending, color: COLORS.yellow},
            {label: 'Approved', value: approved, color: COLORS.green},
            {label: 'Cost Impact', value: formatCurrency(totalCost), color: COLORS.red},
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, {color: s.color}]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search change orders…" />

        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={COLORS.blue} colors={[COLORS.blue]} />
          }
          renderItem={({item: co}) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Feather name="refresh-cw" size={18} color={COLORS.blue} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{co.title}</Text>
                  <Text style={styles.cardDate}>{timeAgo(co.created_at)}</Text>
                </View>
                <View style={{gap: 4, alignItems: 'flex-end'}}>
                  <Badge label={capitalize(co.status ?? 'pending')} color={statusColor(co.status)} />
                  {co.priority && <Badge label={capitalize(co.priority)} color={priorityColor(co.priority)} />}
                </View>
              </View>

              {co.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{co.description}</Text>
              )}

              {co.cost_impact && (
                <View style={styles.metaRow}>
                  <Text style={styles.costImpact}>
                    {Number(co.cost_impact) >= 0 ? '+' : ''}{formatCurrency(co.cost_impact)} cost impact
                  </Text>
                </View>
              )}

              {co.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(co.id)}>
                    <Feather name="check" size={13} color={COLORS.green} />
                    <Text style={styles.approveBtnText}> Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(co.id)}>
                    <Feather name="x" size={13} color={COLORS.red} />
                    <Text style={styles.rejectBtnText}> Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                icon={<Feather name="refresh-cw" size={28} color={COLORS.textMuted} />}
                title="No change orders"
                subtitle="No change orders found"
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
  statValue:  {fontSize: 16, fontWeight: '800', color: COLORS.textPrimary},
  statLabel:  {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  card:       {backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm},
  cardTop:    {flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm},
  cardIcon:   {width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.blueAlpha, alignItems: 'center', justifyContent: 'center'},
  cardTitle:  {fontSize: 14, fontWeight: '700', color: COLORS.textPrimary},
  cardDate:   {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  cardDesc:   {fontSize: 13, color: COLORS.textSecond, lineHeight: 18, marginBottom: SPACING.sm},
  metaRow:    {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm},
  costImpact: {fontSize: 13, color: COLORS.red, fontWeight: '600'},
  actionRow:  {flexDirection: 'row', gap: SPACING.sm},
  approveBtn: {flex: 1, flexDirection: 'row', backgroundColor: COLORS.greenAlpha, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.green + '40', paddingVertical: SPACING.sm, alignItems: 'center', justifyContent: 'center'},
  approveBtnText:{color: COLORS.green, fontWeight: '600', fontSize: 13},
  rejectBtn:  {flex: 1, flexDirection: 'row', backgroundColor: COLORS.redAlpha, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.red + '40', paddingVertical: SPACING.sm, alignItems: 'center', justifyContent: 'center'},
  rejectBtnText: {color: COLORS.red, fontWeight: '600', fontSize: 13},
});

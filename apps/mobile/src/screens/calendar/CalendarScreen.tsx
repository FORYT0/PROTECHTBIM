import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {workPackageService, dailyReportService} from '../../api/services';
import Feather from 'react-native-vector-icons/Feather';
import {EmptyState} from '../../components/Card';
import {COLORS, SPACING, RADIUS, statusColor} from '../../utils/theme';
import {formatDate, capitalize} from '../../utils/formatters';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export function CalendarScreen() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(today);
  const [refreshing, setRefreshing] = useState(false);

  const {data: wpData, refetch} = useQuery({
    queryKey: ['calendar-wps'],
    queryFn:  () => workPackageService.list({per_page: 100}),
  });

  const {data: reportData} = useQuery({
    queryKey: ['calendar-reports'],
    queryFn:  () => dailyReportService.list({per_page: 100}),
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await refetch(); setRefreshing(false); }, [refetch]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({length: daysInMonth}, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else { setMonth(m => m - 1); }
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else { setMonth(m => m + 1); }
  };

  // Events for selected day
  const selectedStr = selected
    ? `${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}`
    : '';

  const wpItems = (wpData?.work_packages ?? []).filter((wp: any) =>
    wp.due_date?.startsWith(selectedStr),
  );
  const reportItems = (reportData?.reports ?? []).filter((r: any) =>
    r.report_date?.startsWith(selectedStr),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={{flex: 1}}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={styles.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day names */}
        <View style={styles.dayNames}>
          {DAYS.map(d => <Text key={d} style={styles.dayName}>{d}</Text>)}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) {return <View key={`e-${i}`} style={styles.cell} />;}
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear();
            return (
              <TouchableOpacity
                key={day}
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => setSelected(new Date(year, month, day))}>
                <Text style={[
                  styles.dayText,
                  isToday && styles.dayToday,
                  isSelected && styles.daySelectedText,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Events for selected day */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsHeader}>
            {selected ? `${formatDate(selected)} events` : 'Select a day'}
          </Text>
          <FlatList
            data={[...wpItems.map((w: any) => ({...w, _type: 'wp'})), ...reportItems.map((r: any) => ({...r, _type: 'report'}))]}
            keyExtractor={item => `${item._type}-${item.id}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} colors={[COLORS.blue]} />}
            renderItem={({item}) => (
              <View style={styles.eventCard}>
                <View style={[styles.eventDot, {backgroundColor: item._type === 'report' ? COLORS.green : COLORS.blue}]} />
                <View>
                  <View style={styles.eventTitleRow}>
                    <Feather name={item._type === 'report' ? 'clipboard' : 'package'} size={14} color={item._type === 'report' ? COLORS.green : COLORS.blue} />
                    <Text style={styles.eventTitle}> {item._type === 'report' ? 'Daily Report' : (item.title ?? item.name)}</Text>
                  </View>
                  {item.status && <Text style={styles.eventSub}>{capitalize(item.status)}</Text>}
                </View>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon={<Feather name="calendar" size={28} color={COLORS.textMuted} />} title="No events" subtitle="Nothing scheduled for this day" />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  safe:          {flex: 1, backgroundColor: COLORS.bg},
  monthNav:      {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg},
  navBtn:        {width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center'},
  navBtnText:    {color: COLORS.textPrimary, fontSize: 20, fontWeight: '700'},
  monthLabel:    {fontSize: 18, fontWeight: '800', color: COLORS.textPrimary},
  dayNames:      {flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.xs},
  dayName:       {flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.textMuted, fontWeight: '600'},
  grid:          {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, marginBottom: SPACING.lg},
  cell:          {width: `${100/7}%`, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center'},
  cellSelected:  {backgroundColor: COLORS.blue, borderRadius: CELL_SIZE / 2},
  dayText:       {fontSize: 14, color: COLORS.textSecond},
  dayToday:      {color: COLORS.blue, fontWeight: '800'},
  daySelectedText:{color: '#fff', fontWeight: '800'},
  eventsSection: {flex: 1, paddingHorizontal: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md},
  eventsHeader:  {fontSize: 14, fontWeight: '700', color: COLORS.textSecond, marginBottom: SPACING.md},
  eventCard:     {flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.xs},
  eventDot:      {width: 10, height: 10, borderRadius: 5},
  eventTitleRow: {flexDirection: 'row', alignItems: 'center'},
  eventTitle:    {fontSize: 14, fontWeight: '600', color: COLORS.textPrimary},
  eventSub:      {fontSize: 12, color: COLORS.textMuted, marginTop: 2},
});

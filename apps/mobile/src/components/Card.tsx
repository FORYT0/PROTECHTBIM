import React, {ReactNode} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ViewStyle} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../utils/theme';

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}
export function Card({children, onPress, style}: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  color?: string;
  onPress?: () => void;
}
export function KpiCard({label, value, sub, icon, color = COLORS.blue, onPress}: KpiCardProps) {
  return (
    <Card onPress={onPress} style={styles.kpi}>
      <View style={[styles.kpiIcon, {backgroundColor: color + '20'}]}>
        {icon}
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </Card>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
}
export function Badge({label, color = COLORS.blue}: BadgeProps) {
  return (
    <View style={[styles.badge, {backgroundColor: color + '20', borderColor: color + '40'}]}>
      <Text style={[styles.badgeText, {color}]}>{label}</Text>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}
export function SectionHeader({title, action, onAction}: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}
export function EmptyState({icon, title, subtitle, action, onAction}: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction}>
          <Text style={styles.emptyBtnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
  },
  kpi:      {padding: SPACING.md, alignItems: 'flex-start'},
  kpiIcon:  {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  kpiValue: {fontSize: 22, fontWeight: '800', color: COLORS.textPrimary},
  kpiLabel: {fontSize: 11, color: COLORS.textMuted, marginTop: 2},
  kpiSub:   {fontSize: 11, color: COLORS.textDisabled, marginTop: 1},
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    alignSelf:         'flex-start',
  },
  badgeText:    {fontSize: 11, fontWeight: '600'},
  sectionRow:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: COLORS.textPrimary},
  sectionAction:{fontSize: 13, color: COLORS.blue},
  empty:        {alignItems: 'center', paddingVertical: 48},
  emptyIconWrap:{
    width: 64, height: 64, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle:   {fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6},
  emptySub:     {fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 32},
  emptyBtn:     {marginTop: 20, backgroundColor: COLORS.blue, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.md},
  emptyBtnText: {color: '#fff', fontWeight: '600', fontSize: 14},
});

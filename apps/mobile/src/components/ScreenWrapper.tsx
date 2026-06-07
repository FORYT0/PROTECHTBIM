import React, {ReactNode} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {COLORS, SPACING} from '../utils/theme';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  scrollable?: boolean;
  padded?: boolean;
}

export function ScreenWrapper({
  children,
  title,
  subtitle,
  loading,
  error,
  onRefresh,
  refreshing = false,
  scrollable = true,
  padded = true,
}: Props) {
  const content = (
    <>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      )}
      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!loading && !error && children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, padded && styles.padded]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.blue}
                colors={[COLORS.blue]}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.content, padded && styles.padded, {flex: 1}]}>
          {content}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     {flex: 1, backgroundColor: COLORS.bg},
  scroll:   {flex: 1},
  content:  {flexGrow: 1},
  padded:   {padding: SPACING.lg},
  header:   {marginBottom: SPACING.lg},
  title:    {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary},
  subtitle: {fontSize: 13, color: COLORS.textMuted, marginTop: 4},
  center:   {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  errorEmoji:{fontSize: 40, marginBottom: 12},
  errorText: {color: COLORS.red, fontSize: 14, textAlign: 'center', paddingHorizontal: 32},
});

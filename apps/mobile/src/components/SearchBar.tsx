import React from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../utils/theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({value, onChangeText, placeholder = 'Search…', onClear}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }}>
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.card,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom:    SPACING.md,
    height:          44,
  },
  icon:  {fontSize: 16, marginRight: SPACING.sm},
  input: {flex: 1, color: COLORS.textPrimary, fontSize: 14},
  clear: {color: COLORS.textMuted, fontSize: 16, padding: 4},
});

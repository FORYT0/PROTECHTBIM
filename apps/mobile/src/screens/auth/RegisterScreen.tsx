import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import {useAuth} from '../../contexts/AuthContext';
import {COLORS, RADIUS, SPACING} from '../../utils/theme';
import type {AuthScreenProps} from '../../navigation/types';

export function RegisterScreen({navigation}: AuthScreenProps<'Register'>) {
  const {register} = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err: any) {
      Alert.alert('Registration failed', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Feather name="layers" size={28} color="#fff" />
            </View>
            <Text style={styles.logoTitle}>Create account</Text>
            <Text style={styles.logoSub}>Join PROTECHT BIM</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="John Smith"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={[styles.input, {flex: 1, marginBottom: 0}]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 8 characters"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity style={styles.pwdToggle} onPress={() => setShowPwd(v => !v)}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && {opacity: 0.6}]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.btnText}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Text>
              {!loading && <Feather name="arrow-right" size={16} color="#fff" style={{marginLeft: 6}} />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      {flex: 1, backgroundColor: COLORS.bg},
  container: {flexGrow: 1, padding: SPACING.xl, justifyContent: 'center'},
  logoWrap:  {alignItems: 'center', marginBottom: SPACING['3xl']},
  logoIcon:  {
    width: 64, height: 64, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
    shadowColor: COLORS.blue, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: {width: 0, height: 4},
    elevation: 8,
  },
  logoTitle: {fontSize: 24, fontWeight: '800', color: COLORS.textPrimary},
  logoSub:   {fontSize: 13, color: COLORS.textMuted, marginTop: 4},
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING['2xl'], marginBottom: SPACING.xl,
  },
  label:     {fontSize: 12, fontWeight: '600', color: COLORS.textSecond, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.5},
  input:     {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.textPrimary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md, fontSize: 15, marginBottom: SPACING.lg,
  },
  pwdRow:    {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg},
  pwdToggle: {padding: 12, marginLeft: 8},
  btn:       {flexDirection: 'row', backgroundColor: COLORS.blue, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center'},
  btnText:   {color: '#fff', fontSize: 16, fontWeight: '700'},
  footer:    {flexDirection: 'row', justifyContent: 'center'},
  footerText:{color: COLORS.textMuted, fontSize: 14},
  footerLink:{color: COLORS.blue, fontSize: 14, fontWeight: '600'},
});

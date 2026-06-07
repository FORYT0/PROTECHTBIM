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

export function LoginScreen({navigation}: AuthScreenProps<'Login'>) {
  const {login} = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login failed', err?.message ?? 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'pm' | 'eng') => {
    const creds = {
      admin: {email: 'admin@protecht.com',    password: 'Admin123!'},
      pm:    {email: 'pm@protecht.com',        password: 'Demo1234!'},
      eng:   {email: 'engineer@protecht.com',  password: 'Demo1234!'},
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Feather name="layers" size={28} color="#fff" />
            </View>
            <Text style={styles.logoTitle}>
              <Text style={styles.logoTitleWhite}>PROTECHT</Text>
              <Text style={styles.logoTitleBlue}> BIM</Text>
            </Text>
            <Text style={styles.logoSub}>Construction Intelligence Platform</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in</Text>
            <Text style={styles.cardSub}>Access your construction portfolio</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.pwdRow}>
              <TextInput
                style={[styles.input, {flex: 1, marginBottom: 0}]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.pwdToggle} onPress={() => setShowPwd(v => !v)}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading || !email || !password}>
              {loading
                ? <Text style={styles.btnText}>Signing in…</Text>
                : <><Text style={styles.btnText}>Sign In</Text><Feather name="arrow-right" size={16} color="#fff" style={{marginLeft: 6}} /></>
              }
            </TouchableOpacity>
          </View>

          {/* Demo access */}
          <View style={styles.demo}>
            <View style={styles.demoHeader}>
              <View style={styles.demoDot} />
              <Text style={styles.demoTitle}>Demo Access</Text>
            </View>
            <View style={styles.demoRow}>
              {(['admin', 'pm', 'eng'] as const).map(role => (
                <TouchableOpacity key={role} style={styles.demoBtn} onPress={() => fillDemo(role)}>
                  <View style={[styles.demoAvatar,
                    role === 'admin' ? styles.avatarBlue :
                    role === 'pm'    ? styles.avatarPurple : styles.avatarGreen]}>
                    <Text style={styles.demoAvatarText}>
                      {role === 'admin' ? 'A' : role === 'pm' ? 'P' : 'E'}
                    </Text>
                  </View>
                  <Text style={styles.demoLabel}>
                    {role === 'admin' ? 'Admin' : role === 'pm' ? 'Proj. Mgr' : 'Engineer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.demoHint}>Tap a role to pre-fill · Admin: Admin123! · Others: Demo1234!</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>
              New to PROTECHT? <Text style={styles.registerLinkBlue}>Create account</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      {flex: 1, backgroundColor: COLORS.bg},
  container: {padding: SPACING.lg, paddingBottom: 48},
  logoWrap:  {alignItems: 'center', marginTop: SPACING['2xl'], marginBottom: SPACING['2xl']},
  logoIcon:  {
    width: 64, height: 64, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: COLORS.blue, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },
  logoTitle:      {flexDirection: 'row'},
  logoTitleWhite: {fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1},
  logoTitleBlue:  {fontSize: 22, fontWeight: '800', color: COLORS.blue, letterSpacing: 1},
  logoSub:        {fontSize: 12, color: COLORS.textMuted, marginTop: 4},
  card:      {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, marginBottom: SPACING.lg,
  },
  cardTitle: {fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4},
  cardSub:   {fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.xl},
  label:     {fontSize: 12, fontWeight: '600', color: COLORS.textSecond, marginBottom: 6, marginTop: SPACING.md},
  input:     {
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12,
    color: COLORS.textPrimary, fontSize: 15, marginBottom: SPACING.sm,
  },
  pwdRow:    {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm},
  pwdToggle: {padding: 12, marginLeft: 8},
  btn:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.blue, borderRadius: RADIUS.md,
    paddingVertical: 14, marginTop: SPACING.md,
    shadowColor: COLORS.blue, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  btnDisabled:{backgroundColor: COLORS.borderSub},
  btnText:   {color: '#fff', fontWeight: '700', fontSize: 15},
  demo: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.xl,
  },
  demoHeader:{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md},
  demoDot:   {width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.blue, marginRight: 8},
  demoTitle: {fontSize: 12, fontWeight: '700', color: COLORS.blue, textTransform: 'uppercase', letterSpacing: 1},
  demoRow:   {flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.sm},
  demoBtn:   {alignItems: 'center', flex: 1},
  demoAvatar:{
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarBlue:  {backgroundColor: COLORS.blue},
  avatarPurple:{backgroundColor: COLORS.purple},
  avatarGreen: {backgroundColor: '#16A34A'},
  demoAvatarText:{color: '#fff', fontWeight: '700', fontSize: 16},
  demoLabel: {fontSize: 11, color: COLORS.textSecond},
  demoHint:  {fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 8},
  registerLink:     {textAlign: 'center', fontSize: 13, color: COLORS.textMuted},
  registerLinkBlue: {color: COLORS.blue, fontWeight: '600'},
});

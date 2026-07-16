import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';
import BigButton from '../components/BigButton';
import BottomToast from '../components/BottomToast';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [identitas, setIdentitas] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPass, setIsFocusedPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');

  const emailRef = useRef(null);
  const passRef = useRef(null);

  const handleLogin = async () => {
    if (!identitas || !password) {
      setToastType('warning');
      setToastMsg('Mohon isi Email dan Kata Sandi Anda dengan lengkap.');
      return;
    }

    setLoading(true);
    setToastMsg('');
    try {
      // Kirim POST request ke /api/login di backend Laravel
      const response = await api.post('/login', {
        email: identitas.trim(),
        password: password,
      });

      const { token, user } = response.data.data;

      // Simpan Token & Data User ke AsyncStorage
      await AsyncStorage.setItem('sawittracker_token', token);
      await AsyncStorage.setItem('sawittracker_user', JSON.stringify(user));

      // Langsung masuk ke Dashboard tanpa notifikasi pop-up
      navigation.replace('Dashboard', { userName: user.name });

    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      const pesanError = error.response?.data?.message || 'Gagal terhubung ke server API. Pastikan IP dan backend aktif di port 8000.';
      setToastType('error');
      setToastMsg(pesanError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Top Pill Badge */}
          {/* <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <View style={styles.statusDot} />
              <Text style={styles.badgeText}>SAWITTRACKER PRO MOBILE</Text>
            </View>
          </View> */}

          {/* Glowing Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, SHADOWS.card]}>
              <MaterialCommunityIcons name="palm-tree" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.logoText}>Nyawit<Text style={{ color: COLORS.primary }}>Dulu</Text></Text>
            <Text style={styles.subtitle}>Sistem Manajemen Panen & Kasbon Digital</Text>
          </View>

          {/* Glassy Login Card */}
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.welcomeTitle}>Login</Text>
            <Text style={styles.instruction}>Kelola kebun dan timbangan sawit dari dalam genggaman Anda.</Text>

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Admin / Koperasi</Text>
              <TouchableOpacity 
                activeOpacity={1}
                style={[styles.inputWrapper, isFocusedEmail && styles.inputFocused]}
                onPress={() => emailRef.current?.focus()}
              >
                <Ionicons name="mail-outline" size={20} color={isFocusedEmail ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  testID="input-email"
                  ref={emailRef}
                  style={styles.input}
                  placeholder="admin@sawittracker.com"
                  placeholderTextColor="#94A3B8"
                  value={identitas}
                  onChangeText={setIdentitas}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={true}
                  selectTextOnFocus={true}
                  onFocus={() => setIsFocusedEmail(true)}
                  onBlur={() => setIsFocusedEmail(false)}
                />
              </TouchableOpacity>
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TouchableOpacity 
                activeOpacity={1}
                style={[styles.inputWrapper, isFocusedPass && styles.inputFocused]}
                onPress={() => passRef.current?.focus()}
              >
                <Ionicons name="lock-closed-outline" size={20} color={isFocusedPass ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  testID="input-password"
                  ref={passRef}
                  style={styles.input}
                  placeholder="Masukkan kata sandi..."
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={true}
                  selectTextOnFocus={true}
                  onFocus={() => setIsFocusedPass(true)}
                  onBlur={() => setIsFocusedPass(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Lupa Sandi */}
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Lupa kata sandi?</Text>
            </TouchableOpacity>

            {/* Tombol Masuk Modern */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>loading...</Text>
              </View>
            ) : (
              <BigButton 
                testID="btn-login"
                title="Masuk" 
                onPress={handleLogin}
                style={{ marginTop: 10 }}
                icon={<Ionicons name="arrow-forward-circle-outline" size={22} color="#FFF" />}
              />
            )}

            {/* Security Pill Footer */}
            <View style={styles.securityFooter}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
              <Text style={styles.securityText}>Secured by Nyawit Cloud & Laravel Sanctum</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomToast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryGlow,
    marginRight: 8,
  },
  badgeText: {
    ...FONTS.extrabold,
    color: COLORS.primaryGlow,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  logoText: {
    ...FONTS.black,
    fontSize: 32,
    color: COLORS.textWhite,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  welcomeTitle: {
    ...FONTS.extrabold,
    fontSize: 22,
    color: COLORS.textWhite,
    letterSpacing: -0.4,
  },
  instruction: {
    ...FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    ...FONTS.semibold,
    fontSize: 13,
    color: COLORS.textSilver,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: SIZES.radius,
    height: SIZES.inputHeight,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    ...FONTS.medium,
    flex: 1,
    height: '100%',
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textWhite,
  },
  eyeBtn: {
    padding: 8,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    ...FONTS.semibold,
    color: COLORS.accentCyan,
    fontSize: 13,
  },
  loadingBox: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flexDirection: 'row',
  },
  loadingText: {
    ...FONTS.bold,
    color: COLORS.primaryGlow,
    marginLeft: 10,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  securityText: {
    ...FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
});

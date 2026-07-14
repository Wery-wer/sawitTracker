import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';
import BigButton from '../components/BigButton';
import api from '../services/api';

export default function DashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const userName = route?.params?.userName || 'Admin Koperasi';
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ambil data transaksi secara Live dari Supabase setiap kali layar Dashboard aktif / dibuka
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/transactions');
      const dataTrx = response.data.data || [];
      setTransactions(dataTrx);
    } catch (error) {
      console.error('Gagal mengambil transaksi dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper untuk formatting angka yang aman dari NaN & string concatenation
  const formatNumber = (val) => {
    const num = Math.round(Number(val) || 0);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatRupiah = (val) => {
    return 'Rp ' + formatNumber(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).split('T')[0] || dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Hitung statistik dari data riil di Supabase (pastikan diubah ke Number)
  const totalNetto = transactions.reduce((acc, curr) => acc + (Number(curr.netto_weight) || 0), 0);
  const totalPembayaran = transactions.reduce((acc, curr) => acc + (Number(curr.total_net_price) || 0), 0);
  const totalTruk = transactions.length;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Sleek Liquid Glass Top Nav */}
      <BlurView
        intensity={85}
        tint="light"
        style={[
          styles.topNav,
          { paddingTop: Math.max(insets.top + 6, Platform.OS === 'ios' ? 44 : 32) }
        ]}
      >
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍🌾</Text>
          </View>
          <View>
            <Text style={styles.welcomeLabel}>Selamat Datang,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        {/* Round Logout Button di Kanan Atas */}
        <TouchableOpacity
          style={[styles.logoutRoundBtn, SHADOWS.card]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 92, 142) }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGlow} />
        }
      >

        {/* Hero Analytics Card (Live dari Supabase Cloud) */}
        <View style={[styles.heroCardContainer, SHADOWS.card]}>
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroHeaderRow}>
              <Text style={styles.heroLabel}>TOTAL PEMBAYARAN PANEN</Text>
            </View>

            <Text style={styles.heroBalance}>{formatRupiah(totalPembayaran)}</Text>

            <View style={styles.heroStatsGrid}>
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="weight-kilogram" size={16} color="#FDE047" />
                <Text style={styles.statPillText}>{formatNumber(totalNetto)} KG Netto</Text>
              </View>
              <View style={styles.statPill}>
                <MaterialCommunityIcons name="truck-outline" size={16} color="#FFFFFF" />
                <Text style={styles.statPillText}>{totalTruk} Transaksi Masuk</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Action Grid */}
        {/* <Text style={styles.sectionTitle}>Aksi Cepat</Text> */}

        {/* Action Card 1: Input Panen */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionCard, SHADOWS.card]}
          onPress={() => navigation.navigate('InputPanen')}
        >
          <View style={styles.actionCardGradient}>
            <View style={styles.actionIconBox}>
              <MaterialCommunityIcons name="scale-balance" size={28} color="#059669" />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={styles.actionTitle}>Input Timbangan Panen</Text>
              <Text style={styles.actionSubtitle}>Catat bruto, tarra & hitung netto</Text>
            </View>
            <View style={styles.actionArrow}>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Card 2: Riwayat Struk */}
        {/* <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.actionCardSecondary}
          onPress={() => onRefresh()}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
            <Ionicons name="refresh-circle-outline" size={28} color={COLORS.info} />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={[styles.actionTitle, { color: COLORS.textSilver }]}>Refresh Data Cloud</Text>
            <Text style={styles.actionSubtitle}>Tarik data terbaru dari server Supabase</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity> */}

        {/* Recent Transactions Feed (Live dari PostgreSQL) */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Terkini</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.seeAll}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingFeed}>
              <ActivityIndicator size="small" color={COLORS.primaryGlow} />
              <Text style={styles.loadingFeedText}>Sinkronisasi dengan database cloud...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedText}>Belum ada transaksi panen. Silakan input timbangan baru!</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.feedItem}>
                <View style={styles.feedIcon}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.feedInfo}>
                  <Text style={styles.feedName}>{item.farmer?.name || 'Petani'}</Text>
                  <Text style={styles.feedTime}>
                    {formatDate(item.date || item.created_at)} • ⚖️ Netto: {formatNumber(item.netto_weight)} KG
                  </Text>
                </View>
                <View style={styles.feedRight}>
                  <Text style={styles.feedAmount}>{formatRupiah(item.total_net_price || 0)}</Text>
                  {Number(item.debt_deduction) > 0 && (
                    <Text style={styles.feedWeight}>Kasbon: Rp - {formatNumber(item.debt_deduction)}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />

      </ScrollView>

      {/* MODAL KONFIRMASI LOGOUT (PROFESSIONAL DIALOG) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutOverlay}>
          <View style={[styles.logoutCard, SHADOWS.card]}>
            {/* Icon Warning / Logout */}
            <View style={styles.logoutIconOuter}>
              <View style={styles.logoutIconInner}>
                <Ionicons name="log-out-outline" size={36} color="#EF4444" />
              </View>
            </View>

            <Text style={styles.logoutTitle}>Konfirmasi Keluar</Text>
            <Text style={styles.logoutSubtitle}>
              Apakah Anda yakin ingin keluar dari aplikasi?
            </Text>

            {/* Tombol Aksi: Keluar dan Tidak */}
            <View style={styles.logoutBtnRow}>
              <TouchableOpacity
                style={styles.btnTidak}
                activeOpacity={0.8}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.btnTidakText}>Tidak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnKeluar}
                activeOpacity={0.8}
                onPress={() => {
                  setShowLogoutModal(false);
                  navigation.replace('Login');
                }}
              >
                <Text style={styles.btnKeluarText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 213, 225, 0.45)',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  logoutRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeLabel: {
    ...FONTS.semibold,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  userName: {
    ...FONTS.extrabold,
    fontSize: 16,
    color: COLORS.textWhite,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 24,
  },
  heroCardContainer: {
    borderRadius: SIZES.radiusLarge,
    marginBottom: 28,
  },
  heroCard: {
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 89, 0.8)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    ...FONTS.extrabold,
    fontSize: 12,
    color: '#D1FAE5',
    letterSpacing: 0.8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    ...FONTS.extrabold,
    fontSize: 11,
    color: COLORS.primaryGlow,
    marginLeft: 4,
  },
  heroBalance: {
    ...FONTS.black,
    fontSize: 34,
    color: '#FFFFFF',
    marginVertical: 12,
    letterSpacing: -0.6,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statPillText: {
    ...FONTS.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  sectionTitle: {
    ...FONTS.extrabold,
    fontSize: 18,
    color: COLORS.textWhite,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  actionCard: {
    borderRadius: SIZES.radiusLarge,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  actionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  actionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 28,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    ...FONTS.extrabold,
    fontSize: 17,
    color: COLORS.textWhite,
    marginBottom: 4,
  },
  actionSubtitle: {
    ...FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  actionArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedSection: {
    marginTop: 8,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAll: {
    ...FONTS.bold,
    fontSize: 13,
    color: '#059669',
  },
  loadingFeed: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingFeedText: {
    ...FONTS.medium,
    color: COLORS.textSilver,
    marginLeft: 10,
    fontSize: 13,
  },
  emptyFeed: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyFeedText: {
    ...FONTS.medium,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  feedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  feedInfo: {
    flex: 1,
  },
  feedName: {
    ...FONTS.bold,
    fontSize: 15,
    color: COLORS.textWhite,
  },
  feedTime: {
    ...FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  feedRight: {
    alignItems: 'flex-end',
  },
  feedAmount: {
    ...FONTS.extrabold,
    fontSize: 14,
    color: '#059669',
  },
  feedWeight: {
    ...FONTS.semibold,
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 2,
  },
  // LOGOUT MODAL STYLES
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTitle: {
    ...FONTS.black,
    fontSize: 22,
    color: COLORS.textWhite,
    textAlign: 'center',
  },
  logoutSubtitle: {
    ...FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnTidak: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  btnTidakText: {
    ...FONTS.bold,
    fontSize: 15,
    color: '#334155',
  },
  btnKeluar: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.danger,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  btnKeluarText: {
    ...FONTS.extrabold,
    fontSize: 15,
    color: '#FFF',
  },
});

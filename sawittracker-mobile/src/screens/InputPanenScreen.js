import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Modal, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';
import BigButton from '../components/BigButton';
import BottomToast from '../components/BottomToast';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InputPanenScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [warningMsg, setWarningMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('error');
  
  const [bruto, setBruto] = useState('');
  const [tarra, setTarra] = useState('');
  const [isFocusedBruto, setIsFocusedBruto] = useState(false);
  const [isFocusedTarra, setIsFocusedTarra] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deductDebt, setDeductDebt] = useState(null);

  // Refs untuk auto-focus
  const brutoRef = useRef(null);
  const tarraRef = useRef(null);
  const modalTranslateY = useRef(new Animated.Value(900)).current;

  // Animasi spring / jiggle saat modal pilih petani dibuka & ditutup
  useEffect(() => {
    if (modalVisible) {
      modalTranslateY.setValue(900);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 28,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handleCloseModal = (onDone) => {
    Animated.timing(modalTranslateY, {
      toValue: 900,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      if (typeof onDone === 'function') onDone();
    });
  };

  const [hargaSatuan, setHargaSatuan] = useState(2500);

  // 1. Ambil daftar petani dan harga sawit secara Live dari Backend API
  useEffect(() => {
    fetchFarmers();
    fetchHargaSawit();
  }, []);

  // Otomatis atur opsi potong kasbon berdasar status utang/kasbon petani yang dipilih
  useEffect(() => {
    if (selectedFarmer) {
      const currentDebt = Number(selectedFarmer.total_debt || selectedFarmer.debt || 0);
      if (currentDebt <= 0) {
        setDeductDebt(false);
      } else {
        setDeductDebt(null); // Kosongkan opsi jika petani punya utang > 0 agar admin wajib memilih manual
      }
    }
  }, [selectedFarmer]);

  const fetchHargaSawit = async () => {
    try {
      const res = await api.get('/harga-sawit');
      if (res.data?.data?.harga_sawit) {
        setHargaSatuan(Number(res.data.data.harga_sawit));
      }
    } catch (error) {
      console.error('Gagal mengambil harga sawit dari server di mobile:', error);
    }
  };

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      // 1. Cek dulu apakah ada data petani yang tersimpan di memori HP (AsyncStorage cache)
      const cachedData = await AsyncStorage.getItem('cached_farmers_list');
      if (cachedData) {
        const parsedFarmers = JSON.parse(cachedData);
        if (parsedFarmers.length > 0) {
          setFarmers(parsedFarmers);
        }
      }

      // 2. Tetap panggil API ke Cloud Supabase untuk mengambil data terbaru & sinkronisasi
      const response = await api.get('/farmers');
      const dataFarmers = response.data.data || [];
      setFarmers(dataFarmers);
      if (dataFarmers.length > 0) {
        // 3. Simpan data terbaru dari Cloud ke dalam memori HP untuk dipakai saat offline!
        await AsyncStorage.setItem('cached_farmers_list', JSON.stringify(dataFarmers));
      }
    } catch (error) {
      console.error('Gagal mengambil data petani dari API, menggunakan cache / fallback:', error);
      // 4. Jika internet putus total di kebun dan memori HP juga belum punya cache:
      const cachedData = await AsyncStorage.getItem('cached_farmers_list');
      if (cachedData) {
        const parsedFarmers = JSON.parse(cachedData);
        setFarmers(parsedFarmers);
      }
    } finally {
      setLoadingFarmers(false);
    }
  };

  // Perhitungan otomatis secara Live (Support koma dan titik)
  const cleanBruto = bruto.replace(',', '.');
  const cleanTarra = tarra.replace(',', '.');
  const numBruto = parseFloat(cleanBruto) || 0;
  const numTarra = parseFloat(cleanTarra) || 0;
  const netto = Math.max(0, numBruto - numTarra);
  const totalHarga = netto * hargaSatuan;
  const farmerDebt = selectedFarmer ? Number(selectedFarmer.total_debt || selectedFarmer.debt || 0) : 0;
  const debt_deduction = deductDebt === true ? Math.min(farmerDebt, totalHarga) : 0;
  const totalNettoBayar = totalHarga - debt_deduction;

  const formatNumber = (val) => {
    const num = Math.round(Number(val) || 0);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatRupiah = (val) => {
    return 'Rp ' + formatNumber(val);
  };

  // 2. Simpan Transaksi ke Backend API (/api/transactions)
  const handleSimpan = async () => {
    if (!selectedFarmer || !bruto || numBruto <= 0) {
      setWarningMsg('Mohon lengkapi 2 kolom utama: Pemilik Kebun, dan Berat Bruto!');
      return;
    }
    if (numTarra >= numBruto) {
      setWarningMsg('Berat Tarra (potongan timbangan) tidak boleh lebih besar atau sama dengan Berat Bruto!');
      return;
    }
    if (farmerDebt > 0 && deductDebt === null) {
      setWarningMsg('Harap pilih Opsi Potongan Kasbon (Potong Kasbon atau Bayar Penuh) terlebih dahulu!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        farmer_id: selectedFarmer.id,
        date: new Date().toISOString().split('T')[0],
        bruto_weight: Math.round(numBruto),
        tarra_weight: Math.round(numTarra),
        price_per_kg: hargaSatuan,
        deduct_debt: deductDebt,
        deductDebt: deductDebt,
      };

      const response = await api.post('/transactions', payload);
      const savedData = response.data.data;
      const namaPetani = savedData?.farmer?.name || selectedFarmer.name;

      setSuccessData({
        namaPetani: namaPetani,
        netto: savedData?.netto_weight || netto,
        totalBayar: savedData?.total_net_price || totalHarga,
        potonganKasbon: savedData?.debt_deduction || 0,
        hargaPerKg: savedData?.price_per_kg || hargaSatuan,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        idTransaksi: savedData?.id || Math.floor(1000 + Math.random() * 9000)
      });

    } catch (error) {
      console.error('Error menyimpan transaksi:', error.response?.data || error.message);
      const pesanError = error.response?.data?.message || 'Gagal menyimpan transaksi ke Cloud. Pastikan server Laravel aktif.';
      Alert.alert('Gagal Menyimpan', pesanError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      {/* Sleek Liquid Glass Floating Header */}
      <BlurView 
        intensity={85} 
        tint="light" 
        style={[
          styles.topNavGlass, 
          { paddingTop: Math.max(insets.top + 6, Platform.OS === 'ios' ? 44 : 32) }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButtonRow} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <View style={[styles.backIconCircle, SHADOWS.card]}>
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </View>
          <Text style={styles.backLabel}>Dashboard</Text>
        </TouchableOpacity>

        {/* <View style={styles.titleBadge}>
          <Text style={styles.topNavTitle}>Input Panen</Text>
        </View> */}
      </BlurView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.content, 
            { 
              paddingTop: Math.max(insets.top + 92, 142),
              paddingBottom: Math.max(insets.bottom + 12, 16),
              flexGrow: 1,
            }
          ]} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Input Timbangan</Text>
            <Text style={styles.pageSubtitle}>Catat hasil kebun & hitung potongan tarra otomatis</Text>
          </View>

          {/* Card Form Utama */}
          <View style={[styles.card, SHADOWS.card]}>
            
            {/* Step 1: Pilih Petani (Custom Modern Selector Box) */}
            <View style={styles.sectionHeader}>
              <View style={styles.stepCircle}><Text style={styles.stepText}>1</Text></View>
              <Text style={styles.sectionTitle}>Pilih Pemilik Kebun</Text>
            </View>

            {loadingFarmers ? (
              <View style={styles.loadingBoxPicker}>
                <ActivityIndicator size="small" color={COLORS.primaryGlow} />
                <Text style={styles.loadingTextPicker}>Mengambil data petani ...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                testID="btn-pilih-petani"
                activeOpacity={0.8}
                style={styles.customSelector}
                onPress={() => setModalVisible(true)}
              >
                <View style={styles.selectorLeft}>
                  <View style={styles.farmerIconCircle}>
                    <Text style={styles.farmerIconText}>👨‍🌾</Text>
                  </View>
                  <View>
                    {/* <Text style={styles.selectorLabel}>{selectedFarmer ? selectedFarmer.name : 'Plih Nama Petani'}</Text> */}
                    <Text style={styles.label}>
                      {selectedFarmer ? selectedFarmer.name : 'Pilih Petani...'}
                    </Text>
                    {selectedFarmer?.phone && (
                      <Text style={styles.selectorPhone}>{selectedFarmer.phone}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.selectorArrow}>
                  <Ionicons name="chevron-down" size={20} color={COLORS.primaryGlow} />
                </View>
              </TouchableOpacity>
            )}

            {/* Step 2: Input Angka */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.stepCircle}><Text style={styles.stepText}>2</Text></View>
              <Text style={styles.sectionTitle}>Data Timbangan (KG)</Text>
            </View>

            {/* Input Berat Bruto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Berat Bruto (Kotor):</Text>
              <TouchableOpacity 
                activeOpacity={1} 
                style={[styles.inputWrapper, isFocusedBruto && styles.inputFocused]}
                onPress={() => brutoRef.current?.focus()}
              >
                <MaterialCommunityIcons name="weight-kilogram" size={24} color={isFocusedBruto ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  testID="input-bruto"
                  ref={brutoRef}
                  style={styles.inputNumeric}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={bruto}
                  onChangeText={(val) => setBruto(val.replace(/[^0-9.,]/g, ''))}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  returnKeyType="next"
                  onSubmitEditing={() => tarraRef.current?.focus()}
                  onFocus={() => setIsFocusedBruto(true)}
                  onBlur={() => setIsFocusedBruto(false)}
                />
                <Text style={styles.unitText}>KG</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>*Total berat truk beserta buah sawit segar</Text>
            </View>

            {/* Input Berat Tarra */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Berat Tarra (Potongan / Truk):</Text>
              <TouchableOpacity 
                activeOpacity={1} 
                style={[styles.inputWrapper, isFocusedTarra && styles.inputFocused]}
                onPress={() => tarraRef.current?.focus()}
              >
                <MaterialCommunityIcons name="truck-outline" size={24} color={isFocusedTarra ? COLORS.primary : COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  testID="input-tarra"
                  ref={tarraRef}
                  style={styles.inputNumeric}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={tarra}
                  onChangeText={(val) => setTarra(val.replace(/[^0-9.,]/g, ''))}
                  keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  returnKeyType="done"
                  onFocus={() => setIsFocusedTarra(true)}
                  onBlur={() => setIsFocusedTarra(false)}
                />
                <Text style={styles.unitText}>KG</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>*Berat truk kosong setelah bongkar muatan</Text>
            </View>

            <View style={{
              marginTop: 24, backgroundColor: '#FFFFFF', padding: 16, borderRadius: SIZES.radiusLarge, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{
                  ...FONTS.bold, color: '#64748B', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5
                }}>
                  Opsi Potongan Kasbon
                </Text>
              </View>

              {farmerDebt <= 0 ? (
                <View style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: SIZES.radius,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="shield-checkmark" size={22} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...FONTS.extrabold, fontSize: 13, color: '#0F172A', marginBottom: 2 }}>
                      Petani Bebas Kasbon (Rp 0)
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ width: '100%' }}>
                  <View style={{
                    flexDirection: 'row', gap: 10
                  }}>
                    <TouchableOpacity
                      testID="btn-potong-kasbon"
                      activeOpacity={0.85}
                      onPress={() => setDeductDebt(true)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: SIZES.radius,
                        backgroundColor: deductDebt === true ? '#059669' : '#F8FAFC',
                        borderWidth: 1.5,
                        borderColor: deductDebt === true ? '#059669' : '#CBD5E1',
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={deductDebt === true ? '#FFF' : '#64748B'} />
                      <Text style={{ ...FONTS.bold, color: deductDebt === true ? '#FFF' : '#334155', fontSize: 13 }}>Potong Kasbon</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setDeductDebt(false)}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: SIZES.radius,
                        backgroundColor: deductDebt === false ? '#059669' : '#F8FAFC',
                        borderWidth: 1.5,
                        borderColor: deductDebt === false ? '#059669' : '#CBD5E1',
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Ionicons name="cash-outline" size={18} color={deductDebt === false ? '#FFF' : '#64748B'} />
                      <Text style={{ ...FONTS.bold, color: deductDebt === false ? '#FFF' : '#334155', fontSize: 13 }}>Bayar Penuh</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Step 3: Kalkulasi Live (Enterprise Receipt Card) */}
            <View style={[styles.sectionHeader, { marginTop: 28 }]}>
              <View style={styles.stepCircle}><Text style={styles.stepText}>3</Text></View>
              <Text style={styles.sectionTitle}>Total Rincian Panen</Text>
            </View>

            <LinearGradient
              colors={['#ECFDF5', '#F0FDF4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.calcBox, SHADOWS.card]}
            >
              <View style={styles.calcRow}>
                <View>
                  <Text style={styles.calcLabel}>Berat Netto (Bersih)</Text>
                  <Text style={styles.calcSub}>Bruto - Tarra</Text>
                </View>
                <View style={styles.nettoBadge}>
                  <Text style={styles.nettoText}>{formatNumber(netto)} KG</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Baris Total Kotor */}
              <View style={[styles.calcRow, { marginBottom: 8 }]}>
                <Text style={{ ...FONTS.semibold, color: '#64748B', fontSize: 13 }}>Total Kotor (Gross)</Text>
                <Text style={{ ...FONTS.bold, color: '#0F172A', fontSize: 14}} adjustsFontSizeToFit numberOfLines={1}>{formatRupiah(totalHarga)}</Text>
              </View>

              {/* Baris Harga TBS hari ini */}
              <View style={[styles.calcRow, { marginBottom: 8 }]}>
                <Text style={{ ...FONTS.semibold, color: '#64748B', fontSize: 13 }}>Harga TBS hari ini</Text>
                <Text style={{ ...FONTS.bold, color: '#f40808ff', fontSize: 14 }} adjustsFontSizeToFit numberOfLines={1}>{formatRupiah(hargaSatuan)} / KG</Text>
              </View>

              {/* Baris Potongan Kasbon */}
              <View style={[styles.calcRow, { marginBottom: 12, backgroundColor: debt_deduction > 0 ? '#FFE4E6' : 'transparent', padding: debt_deduction > 0 ? 10 : 0, borderRadius: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 12 }}>
                  <Text style={{ ...FONTS.bold, color: debt_deduction > 0 ? '#E11D48' : '#64748B', fontSize: 13 }} adjustsFontSizeToFit numberOfLines={1}>Potongan Kasbon</Text>
                </View>
                <Text style={{ ...FONTS.extrabold, color: debt_deduction > 0 ? '#E11D48' : '#64748B', fontSize: 14 }} adjustsFontSizeToFit numberOfLines={1}>
                  - {formatRupiah(debt_deduction)}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Baris Total Bersih yang dibayarkan */}
              <View style={styles.totalSection}>
                <View style={styles.totalHeaderRow}>
                  <Text style={styles.calcLabelTotal}>Total Bersih Dibayarkan</Text>
                  {/* <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>Rp {formatNumber(hargaSatuan)} / KG</Text>
                  </View> */}
                </View>
                <Text style={styles.totalPriceText} numberOfLines={1} adjustsFontSizeToFit>
                  {formatRupiah(totalNettoBayar)}
                </Text>
              </View>
            </LinearGradient>

            {/* Tombol Simpan Modern */}
            {submitting ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Menyimpan...</Text>
              </View>
            ) : (
              <BigButton 
                testID="btn-simpan"
                title="Simpan" 
                onPress={handleSimpan}
                style={{ marginTop: 24 }}
                icon={<Ionicons name="cloud-upload-outline" size={22} color="#FFF" />}
              />
            )}

            <BigButton 
              title="Kembali" 
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 4 }}
            />

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL PILIH PETANI (MODERN BOTTOM SHEET / CARD LIST) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => handleCloseModal()}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay}
          onPress={() => handleCloseModal()}
        >
          <Animated.View 
            onStartShouldSetResponder={() => true}
            style={[styles.modalContainer, SHADOWS.card, { transform: [{ translateY: modalTranslateY }] }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pemilik Kebun</Text>
              <TouchableOpacity onPress={() => handleCloseModal()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSilver} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {farmers.map((item) => {
                const isSelected = selectedFarmer?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    testID={`item-petani-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    activeOpacity={0.8}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedFarmer(item);
                      handleCloseModal();
                    }}
                  >
                    <View style={styles.modalItemLeft}>
                      <View style={[styles.avatarCircle, isSelected && { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.avatarText}>{isSelected ? '✓' : '👨‍🌾'}</Text>
                      </View>
                      <View>
                        <Text style={[styles.modalItemName, isSelected && { color: COLORS.primaryGlow }]}>
                          {item.name}
                        </Text>
                        <Text style={styles.modalItemPhone}>
                          📱 {item.phone || 'No HP Tidak Ada'}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primaryGlow} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => handleCloseModal()}
            >
              <Text style={styles.modalCancelText}>Tutup</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL SUKSES TRANSAKSI (PROFESSIONAL RECEIPT DIALOG) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successData !== null}
        onRequestClose={() => {}}
      >
        <View style={styles.successOverlay}>
          <View style={[styles.successCard]}>
            {/* Icon Checkmark Celebratory */}
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={36} color="#FFF" />
              </View>
            </View>

            <Text style={styles.successTitle}>Transaksi Berhasil!</Text>
            <Text style={styles.successSubtitle}>Bukti Penerimaan Tanda Buah Segar (TBS)</Text>

            {/* Receipt Box */}
            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>No. Transaksi</Text>
                <Text style={styles.receiptValue}>#TRX-{successData?.idTransaksi}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Tanggal</Text>
                <Text style={styles.receiptValue}>{successData?.tanggal}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Pemilik Kebun</Text>
                <Text style={[styles.receiptValue, { color: COLORS.accentCyan }]}>{successData?.namaPetani}</Text>
              </View>
              
              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Berat Netto (Bersih)</Text>
                <Text style={styles.receiptValue}>{formatNumber(successData?.netto)} KG</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Harga Sawit Hari Ini</Text>
                <Text style={[styles.receiptValue, { color: COLORS.primaryGlow }]}>Rp {formatNumber(successData?.hargaPerKg || hargaSatuan)} / KG</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Kasbon</Text>
                <Text style={[styles.receiptValue, { color: Number(successData?.potonganKasbon) > 0 ? COLORS.danger : COLORS.textMuted }]}>
                  {Number(successData?.potonganKasbon) > 0 ? `- ${formatRupiah(successData?.potonganKasbon)}` : 'Rp 0'}
                </Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRowTotal}>
                <Text style={styles.receiptLabelTotal}>Total Dibayarkan</Text>
                <Text style={styles.receiptValueTotal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatRupiah(successData?.totalBayar)}
                </Text>
              </View>
            </View>

            <View style={styles.successFooter}>
              <Text style={styles.successFooterText}>
                ✓ Data telah tercatat otomatis ke sistem admin pabrik
              </Text>
            </View>

            <BigButton
              testID="btn-selesai"
              title="Selesai & Kembali"
              onPress={() => {
                setSuccessData(null);
                setSelectedFarmer(null);
                setBruto('');
                setTarra('');
                navigation.goBack();
              }}
              style={{ width: '100%', marginTop: 20 }}
              icon={<Ionicons name="checkmark-done-outline" size={22} color="#FFF" />}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL PERINGATAN (SIMPLE & CLEAN WARNING DIALOG) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={warningMsg !== null}
        onRequestClose={() => setWarningMsg(null)}
      >
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, SHADOWS.card, { borderColor: '#F59E0B' }]}>
            {/* Icon Warning Amber */}
            <View style={[styles.successIconOuter, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <View style={[styles.successIconInner, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="alert" size={36} color="#FFF" />
              </View>
            </View>

            <Text style={styles.successTitle}>Data Belum Lengkap</Text>
            <Text style={[styles.successSubtitle, { marginBottom: 20, color: '#334155', fontSize: 14, lineHeight: 22 }]}>
              {warningMsg}
            </Text>

            <BigButton
              title="Kembali"
              onPress={() => setWarningMsg(null)}
              style={{ width: '100%', backgroundColor: '#F59E0B' }}
              icon={<Ionicons name="create-outline" size={20} color="#FFF" />}
            />
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
  topNavGlass: {
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
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backLabel: {
    ...FONTS.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  titleBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topNavTitle: {
    ...FONTS.extrabold,
    fontSize: 13,
    color: '#059669',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 10,
  },
  badgeText: {
    ...FONTS.extrabold,
    color: COLORS.primaryGlow,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  pageTitle: {
    ...FONTS.black,
    fontSize: 28,
    color: COLORS.textWhite,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    ...FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepText: {
    ...FONTS.extrabold,
    color: '#FFF',
    fontSize: 12,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: 16,
    color: COLORS.textWhite,
  },
  loadingBoxPicker: {
    height: 70,
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTextPicker: {
    ...FONTS.medium,
    color: COLORS.textSilver,
    fontSize: 13,
    marginLeft: 10,
  },
  customSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: SIZES.radiusLarge,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  farmerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmerIconText: {
    fontSize: 22,
  },
  selectorLabel: {
    ...FONTS.semibold,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectorValue: {
    ...FONTS.extrabold,
    fontSize: 16,
    color: COLORS.textWhite,
    marginTop: 2,
  },
  selectorPhone: {
    ...FONTS.semibold,
    fontSize: 12,
    color: COLORS.accentCyan,
    marginTop: 2,
  },
  selectorArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 62,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputNumeric: {
    ...FONTS.extrabold,
    flex: 1,
    fontSize: 24,
    color: COLORS.textWhite,
    height: '100%',
  },
  unitText: {
    ...FONTS.extrabold,
    fontSize: 15,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  helperText: {
    ...FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  calcBox: {
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    ...FONTS.semibold,
    fontSize: 14,
    color: COLORS.textSilver,
  },
  calcSub: {
    ...FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  nettoBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  nettoText: {
    ...FONTS.extrabold,
    fontSize: 16,
    color: '#0284C7',
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 16,
  },
  totalSection: {
    width: '100%',
  },
  totalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricePill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pricePillText: {
    ...FONTS.extrabold,
    fontSize: 11,
    color: '#047857',
  },
  calcLabelTotal: {
    ...FONTS.bold,
    fontSize: 15,
    color: COLORS.textWhite,
  },
  totalPriceText: {
    ...FONTS.black,
    fontSize: 28,
    color: '#059669',
    letterSpacing: -0.5,
  },
  loadingBox: {
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    marginTop: 24,
  },
  loadingText: {
    ...FONTS.bold,
    color: COLORS.primaryGlow,
    marginLeft: 10,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 70,
    marginBottom: -46,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    ...FONTS.extrabold,
    fontSize: 20,
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  modalSub: {
    ...FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalItemSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...FONTS.bold,
    fontSize: 18,
    color: '#334155',
  },
  modalItemName: {
    ...FONTS.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  modalItemPhone: {
    ...FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  modalCancelText: {
    ...FONTS.bold,
    color: COLORS.danger,
    fontSize: 15,
  },
  // SUCCESS MODAL STYLES (PROFESSIONAL FINTECH RECEIPT)
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    ...FONTS.black,
    fontSize: 22,
    color: '#0F172A',
    textAlign: 'center',
  },
  successSubtitle: {
    ...FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: SIZES.radiusLarge,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptLabel: {
    ...FONTS.semibold,
    fontSize: 13,
    color: COLORS.textSilver,
  },
  receiptValue: {
    ...FONTS.bold,
    fontSize: 13,
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  receiptRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  receiptLabelTotal: {
    ...FONTS.extrabold,
    fontSize: 15,
    color: '#0F172A',
  },
  receiptValueTotal: {
    ...FONTS.black,
    fontSize: 20,
    color: '#059669',
  },
  successFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successFooterText: {
    ...FONTS.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

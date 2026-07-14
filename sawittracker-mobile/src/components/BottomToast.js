import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function BottomToast({ message, type = 'error', onClose, duration = 4000 }) {
  const slideAnim = useRef(new Animated.Value(150)).current; // Mulai tersembunyi di bawah layar
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Munculkan animasi slide up
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [message]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose && message) {
        onClose();
      }
    });
  };

  if (!message) return null;

  const getStyleConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#065F46',
          border: '#10B981',
          icon: 'checkmark-circle',
          iconColor: '#34D399',
          title: 'Berhasil',
        };
      case 'warning':
        return {
          bg: '#78350F',
          border: '#F59E0B',
          icon: 'warning',
          iconColor: '#FBBF24',
          title: 'Peringatan',
        };
      case 'error':
      default:
        return {
          bg: '#7F1D1D',
          border: '#EF4444',
          icon: 'alert-circle',
          iconColor: '#F87171',
          title: 'Informasi / Kendala API',
        };
    }
  };

  const config = getStyleConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        SHADOWS.card,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>
        <View style={styles.textBox}>
          <Text style={[styles.title, { color: config.iconColor }]}>{config.title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    marginRight: 12,
  },
  textBox: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    ...FONTS.extrabold,
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    ...FONTS.medium,
    fontSize: 12,
    color: '#F8FAFC',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
});

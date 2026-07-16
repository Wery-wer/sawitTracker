import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export default function BigButton({ title, onPress, style, textStyle, variant = 'primary', icon = null, testID }) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  
  if (isPrimary) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        style={[styles.container, SHADOWS.card, style]}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.textPrimary, textStyle]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      style={[
        styles.secondaryButton,
        isDanger ? styles.dangerBorder : styles.secondaryBorder,
        style
      ]}
      onPress={onPress}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[
        styles.textSecondary,
        { color: isDanger ? '#E11D48' : '#334155' },
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  gradientButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondaryButton: {
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radiusLarge,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dangerBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    backgroundColor: 'rgba(225, 29, 72, 0.06)',
  },
  iconContainer: {
    marginRight: 10,
  },
  textPrimary: {
    ...FONTS.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  textSecondary: {
    ...FONTS.semibold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

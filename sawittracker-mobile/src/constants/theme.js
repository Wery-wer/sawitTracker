// Tema UI Standard Enterprise Operational (Apple HIG / SAP Fiori / Stripe POS Aesthetic)
// Clean White/Light Mode, High-Contrast Typography, Subtle Borders & Professional Accents
import { Platform } from 'react-native';

export const FONTS = {
  // Web App font-sans exact mapping for React Native (iOS: System/SF Pro, Android: Roboto)
  regular: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '400',
    letterSpacing: 0,
  },
  medium: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  semibold: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bold: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  extrabold: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  black: {
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
};

export const COLORS = {
  // Base Light Mode Palette
  background: '#F8FAFC',  // Slate 50 Clean Operational Background
  card: '#FFFFFF',        // Pure White Surface
  cardBorder: '#E2E8F0',  // Crisp Subtle Border (Slate 200)
  cardHover: '#F1F5F9',   // Slate 100 Active Surface

  // Professional Accents
  primary: '#059669',     // Enterprise Emerald 600 (Authoritative & Clean Green)
  primaryGlow: '#10B981', // Emerald 500
  primaryDark: '#047857', // Emerald 700
  accentCyan: '#0284C7',  // Enterprise Sky / Blue 600
  accentPurple: '#4F46E5',// Enterprise Indigo 600

  // High-Contrast Typography
  textWhite: '#0F172A',   // Main Title & Primary Text (Dark Slate 900)
  textSilver: '#334155',  // Secondary Text (Slate 700)
  textMuted: '#64748B',   // Muted Text & Labels (Slate 500)
  textDark: '#FFFFFF',    // Text inside primary/dark badges

  // Status Colors
  success: '#16A34A',     // Green 600
  warning: '#D97706',     // Amber 600
  danger: '#E11D48',      // Rose 600
  info: '#0284C7',        // Blue 600
};

export const SIZES = {
  // Modern Proportional Typography
  hero: 32,
  title: 24,
  subtitle: 18,
  body: 15,
  caption: 13,
  
  // Ergonomic Dimensions for Field Staff
  buttonHeight: 52,
  inputHeight: 52,
  radiusSmall: 8,
  radius: 12,
  radiusLarge: 16,
};

export const SHADOWS = {
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B132B',
    background: '#F8FAFC',
    backgroundElement: '#EEF2F6',
    backgroundSelected: '#DFE5EC',
    textSecondary: '#64748B',
    primary: '#037EF3',
    primaryDark: '#0262BE',
    primaryLight: '#EBF5FF',
    card: '#FFFFFF',
    cardSubtle: '#F1F5F9',
    border: '#E2E8F0',
    borderSubtle: '#EDF2F7',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    urgent: '#DC2626',
    info: '#0284C7',
    infoLight: '#F0F9FF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B0F17',
    backgroundElement: '#181E29',
    backgroundSelected: '#232B3A',
    textSecondary: '#94A3B8',
    primary: '#037EF3',
    primaryDark: '#0262BE',
    primaryLight: '#0E294B',
    card: '#131924',
    cardSubtle: '#1C2433',
    border: '#242D3D',
    borderSubtle: '#1B2330',
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#451A03',
    danger: '#EF4444',
    dangerLight: '#450A0A',
    urgent: '#DC2626',
    info: '#38BDF8',
    infoLight: '#082F49',
  },
} as const;

export const DepartmentColors: Record<
  string,
  {
    name: string;
    color: string;
    bgLight: string;
    bgDark: string;
    description: string;
  }
> = {
  oGX: {
    name: 'oGX',
    color: '#F85A40',
    bgLight: '#FFF1F0',
    bgDark: '#3A1412',
    description: 'Outgoing Global Exchange',
  },
  iCX: {
    name: 'iCX',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgDark: '#2E1065',
    description: 'Incoming Global Exchange',
  },
  TM: {
    name: 'TM',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    bgDark: '#451A03',
    description: 'Talent Management',
  },
  Finance: {
    name: 'Finance',
    color: '#10B981',
    bgLight: '#ECFDF5',
    bgDark: '#064E3B',
    description: 'Finance & Legal',
  },
  Marketing: {
    name: 'Marketing',
    color: '#EC4899',
    bgLight: '#FDF2F8',
    bgDark: '#500724',
    description: 'Marketing & PR',
  },
  BD: {
    name: 'BD',
    color: '#6366F1',
    bgLight: '#EEF2FF',
    bgDark: '#1E1B4B',
    description: 'Business Development',
  },
  General: {
    name: 'General',
    color: '#037EF3',
    bgLight: '#EFF6FF',
    bgDark: '#172554',
    description: 'General LC Bardo',
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

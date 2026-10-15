import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { TaskPriority } from '@/types/database';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  {
    label: string;
    color: string;
    bgLight: string;
    bgDark: string;
  }
> = {
  urgent: {
    label: 'Urgent',
    color: '#EF4444',
    bgLight: '#FEF2F2',
    bgDark: '#450A0A',
  },
  high: {
    label: 'High',
    color: '#F97316',
    bgLight: '#FFF7ED',
    bgDark: '#431407',
  },
  medium: {
    label: 'Medium',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    bgDark: '#082F49',
  },
  low: {
    label: 'Low',
    color: '#10B981',
    bgLight: '#ECFDF5',
    bgDark: '#064E3B',
  },
};

export function PriorityBadge({
  priority,
  size = 'md',
  showDot = true,
  style,
}: PriorityBadgeProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const backgroundColor = isDark ? config.bgDark : config.bgLight;
  const textColor = config.color;

  const sizeStyle =
    size === 'sm'
      ? styles.sizeSm
      : size === 'lg'
      ? styles.sizeLg
      : styles.sizeMd;

  const textStyle =
    size === 'sm'
      ? styles.textSm
      : size === 'lg'
      ? styles.textLg
      : styles.textMd;

  const dotSize =
    size === 'sm' ? styles.dotSm : size === 'lg' ? styles.dotLg : styles.dotMd;

  return (
    <View style={[styles.container, sizeStyle, { backgroundColor }, style]}>
      {showDot && (
        <View style={[styles.dot, dotSize, { backgroundColor: textColor }]} />
      )}
      <Text style={[styles.text, textStyle, { color: textColor }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sizeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  textSm: {
    fontSize: 11,
    lineHeight: 14,
  },
  sizeMd: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  dotMd: {
    width: 6,
    height: 6,
  },
  textMd: {
    fontSize: 12,
    lineHeight: 16,
  },
  sizeLg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  dotLg: {
    width: 8,
    height: 8,
  },
  textLg: {
    fontSize: 14,
    lineHeight: 18,
  },
});

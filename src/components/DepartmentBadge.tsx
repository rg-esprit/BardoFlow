import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { DepartmentColors } from '@/constants/theme';
import { Department } from '@/types/database';

interface DepartmentBadgeProps {
  department: Department | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function DepartmentBadge({
  department,
  size = 'md',
  showDot = true,
  style,
}: DepartmentBadgeProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const config =
    DepartmentColors[department] ||
    DepartmentColors[department?.toUpperCase()] ||
    DepartmentColors['General'];

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
        {config.name}
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
  // Sizes
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

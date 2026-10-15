import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Colors } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  iconName?: SymbolViewProps['name'];
  customIcon?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({
  label,
  value,
  subtext,
  iconName,
  customIcon,
  iconColor = '#037EF3',
  iconBgColor,
  trend,
  onPress,
  style,
}: StatCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const defaultIconBg = isDark ? 'rgba(3, 126, 243, 0.15)' : '#EFF6FF';
  const bgIcon = iconBgColor || defaultIconBg;

  const CardWrapper = onPress ? Pressable : View;

  return (
    <CardWrapper
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: bgIcon }]}>
          {customIcon ? (
            customIcon
          ) : iconName ? (
            <SymbolView
              name={iconName}
              size={18}
              tintColor={iconColor}
            />
          ) : null}
        </View>

        {trend && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trend.isNeutral
                  ? colors.backgroundElement
                  : trend.isPositive
                  ? colors.successLight
                  : colors.dangerLight,
              },
            ]}>
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.isNeutral
                    ? colors.textSecondary
                    : trend.isPositive
                    ? colors.success
                    : colors.danger,
                },
              ]}>
              {trend.text}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      {subtext && (
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>
          {subtext}
        </Text>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 11,
    marginTop: 4,
  },
});

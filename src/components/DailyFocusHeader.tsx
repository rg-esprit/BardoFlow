import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Pressable,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Colors } from '@/constants/theme';

interface DailyFocusHeaderProps {
  completedCount: number;
  totalCount: number;
  urgentCount?: number;
  selectedDate?: Date;
  onOpenNewTask?: () => void;
  onOpenNewMeeting?: () => void;
}

export function DailyFocusHeader({
  completedCount,
  totalCount,
  urgentCount = 0,
  selectedDate,
  onOpenNewTask,
  onOpenNewMeeting,
}: DailyFocusHeaderProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const dateString = useMemo(() => {
    const d = selectedDate || new Date();
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  const percentage = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.min(100, Math.round((completedCount / totalCount) * 100));
  }, [completedCount, totalCount]);

  const motivationalText = useMemo(() => {
    if (totalCount === 0) {
      return 'No tasks scheduled — smooth sailing! ⛵️';
    }
    if (completedCount === totalCount) {
      return 'All tasks completed! Outstanding work 🎉';
    }
    if (urgentCount > 0) {
      return `${urgentCount} priority item${urgentCount > 1 ? 's' : ''} left to clear`;
    }
    const remaining = totalCount - completedCount;
    return `${remaining} task${remaining > 1 ? 's' : ''} remaining for today`;
  }, [completedCount, totalCount, urgentCount]);

  return (
    <View style={styles.container}>
      {/* Top Bar with LC Badge */}
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
            {dateString}
          </Text>
          <Text style={[styles.greetingTitle, { color: colors.text }]}>
            {greeting}, <Text style={{ color: colors.primary }}>AIESECer</Text> 👋
          </Text>
        </View>

        {/* Sleek LC Bardo status pill */}
        <View
          style={[
            styles.lcPill,
            {
              backgroundColor: isDark ? 'rgba(3, 126, 243, 0.18)' : '#EBF5FF',
              borderColor: isDark ? 'rgba(3, 126, 243, 0.4)' : '#BAE0FD',
            },
          ]}>
          <View style={styles.activeDot} />
          <Text style={[styles.lcPillText, { color: colors.primary }]}>LC Bardo</Text>
        </View>
      </View>

      {/* Focus & Progress Card */}
      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <Text style={[styles.focusLabel, { color: colors.textSecondary }]}>
              DAILY MOMENTUM
            </Text>
            <Text style={[styles.tasksCountText, { color: colors.text }]}>
              {completedCount} of {totalCount} tasks completed
            </Text>
          </View>

          <View
            style={[
              styles.percentPill,
              {
                backgroundColor:
                  percentage === 100
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.2)'
                      : colors.successLight
                    : isDark
                    ? '#1E293B'
                    : colors.backgroundElement,
              },
            ]}>
            <Text
              style={[
                styles.percentText,
                { color: percentage === 100 ? colors.success : colors.primary },
              ]}>
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Progress Bar Track */}
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: isDark ? '#1E293B' : colors.backgroundElement },
          ]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: percentage === 100 ? colors.success : colors.primary,
              },
            ]}
          />
        </View>

        {/* Motivational Status text */}
        <View style={styles.motivationalRow}>
          <SymbolView
            name={
              percentage === 100
                ? { ios: 'checkmark.seal.fill', android: 'check_circle', web: 'check_circle' }
                : { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }
            }
            size={12}
            tintColor={percentage === 100 ? colors.success : colors.primary}
          />
          <Text style={[styles.motivationalText, { color: colors.textSecondary }]}>
            {motivationalText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greetingBlock: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lcPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#10B981',
  },
  lcPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressInfo: {
    gap: 2,
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tasksCountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  percentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  motivationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  motivationalText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

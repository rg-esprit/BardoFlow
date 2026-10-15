import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
  Vibration,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Task, Meeting } from '@/types/database';
import { Colors } from '@/constants/theme';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tasks?: Task[];
  meetings?: Meeting[];
  onResetToday?: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getDaysOfWeek(baseDate: Date): Date[] {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function WeekStrip({
  selectedDate,
  onSelectDate,
  tasks = [],
  meetings = [],
  onResetToday,
}: WeekStripProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getDaysOfWeek(today), [today]);
  const isViewingToday = useMemo(() => isSameDay(selectedDate, today), [selectedDate, today]);

  // Compute month & year string for current week
  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const handleSelectDay = (day: Date) => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {}
    }
    onSelectDate(day);
  };

  const handleTodayPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(12);
      } catch {}
    }
    if (onResetToday) {
      onResetToday();
    } else {
      onSelectDate(new Date());
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top Header Row with Month & Today shortcut */}
      <View style={styles.headerRow}>
        <View style={styles.monthBadge}>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
            size={13}
            tintColor={colors.primary}
          />
          <Text style={[styles.monthText, { color: colors.text }]}>{monthYearLabel}</Text>
        </View>

        {!isViewingToday && (
          <Pressable
            hitSlop={8}
            onPress={handleTodayPress}
            style={({ pressed }) => [
              styles.todayButton,
              {
                backgroundColor: isDark ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight,
                borderColor: colors.primary,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'arrow.uturn.backward', android: 'replay', web: 'replay' }}
              size={11}
              tintColor={colors.primary}
            />
            <Text style={[styles.todayButtonText, { color: colors.primary }]}>Today</Text>
          </Pressable>
        )}
      </View>

      {/* 7 Days Strip */}
      <View style={styles.daysRow}>
        {weekDays.map((dayDate, idx) => {
          const isSelected = isSameDay(dayDate, selectedDate);
          const isCurrentToday = isSameDay(dayDate, today);

          // Find day indicators
          const dayMeetings = meetings.filter((m) => {
            if (!m.meeting_date) return false;
            return isSameDay(new Date(m.meeting_date), dayDate);
          });

          const dayTasks = tasks.filter((t) => {
            if (!t.deadline) return false;
            return isSameDay(new Date(t.deadline), dayDate);
          });

          const hasMeeting = dayMeetings.length > 0;
          const hasPendingTask = dayTasks.some((t) => t.status !== 'completed');
          const hasUrgentTask = dayTasks.some(
            (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
          );
          const hasCompletedTask = dayTasks.some((t) => t.status === 'completed');

          return (
            <Pressable
              key={dayDate.toISOString()}
              onPress={() => handleSelectDay(dayDate)}
              style={({ pressed }) => [
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isCurrentToday
                    ? isDark
                      ? '#1E293B'
                      : colors.primaryLight
                    : 'transparent',
                  borderColor: isSelected
                    ? colors.primary
                    : isCurrentToday
                    ? colors.primary
                    : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.dayName,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : isCurrentToday
                      ? colors.primary
                      : colors.textSecondary,
                    fontWeight: isSelected || isCurrentToday ? '700' : '500',
                  },
                ]}>
                {DAY_NAMES[idx]}
              </Text>

              <Text
                style={[
                  styles.dayNumber,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontWeight: isSelected || isCurrentToday ? '800' : '600',
                  },
                ]}>
                {dayDate.getDate()}
              </Text>

              {/* Event indicator dots */}
              <View style={styles.dotsRow}>
                {hasMeeting && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected ? '#FFFFFF' : colors.primary,
                      },
                    ]}
                  />
                )}
                {hasPendingTask && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected
                          ? '#FCA5A5'
                          : hasUrgentTask
                          ? colors.urgent
                          : colors.warning,
                      },
                    ]}
                  />
                )}
                {!hasPendingTask && hasCompletedTask && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected ? '#A7F3D0' : colors.success,
                      },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    marginHorizontal: 16,
    marginVertical: 8,
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
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 2,
    minHeight: 62,
    justifyContent: 'space-between',
  },
  dayName: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayNumber: {
    fontSize: 16,
    marginVertical: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 6,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 999,
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  StyleProp,
  ViewStyle,
  Vibration,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Task } from '@/types/database';
import { Colors } from '@/constants/theme';
import { DepartmentBadge } from './DepartmentBadge';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onToggleComplete?: (task: Task) => void;
  onPress?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  style?: StyleProp<ViewStyle>;
}

export function TaskCard({
  task,
  onToggleComplete,
  onPress,
  onDelete,
  onEdit,
  style,
}: TaskCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const isCompleted = task.status === 'completed';

  // Format deadline with time-precision
  const deadlineInfo = React.useMemo(() => {
    if (!task.deadline) return null;

    const due = new Date(task.deadline);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const hasTime =
      due.getHours() !== 0 || due.getMinutes() !== 0 || due.getSeconds() !== 0;
    const timeStr = hasTime
      ? due.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : '';

    let text = '';
    let isOverdue = false;
    let isUrgent = false;

    if (diffMs < 0) {
      isOverdue = true;
      if (Math.abs(diffHours) < 24) {
        text = `Overdue by ${Math.abs(diffHours)}h`;
      } else {
        text = `Overdue by ${Math.abs(diffDays)}d`;
      }
    } else if (diffDays === 0) {
      isUrgent = true;
      text = hasTime ? `Today, ${timeStr}` : 'Today';
    } else if (diffDays === 1) {
      text = hasTime ? `Tomorrow, ${timeStr}` : 'Tomorrow';
    } else if (diffDays <= 7) {
      text = hasTime ? `In ${diffDays}d (${timeStr})` : `In ${diffDays} days`;
    } else {
      text = due.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }

    return { text, isOverdue, isUrgent };
  }, [task.deadline]);

  // Initials for avatar
  const initials = React.useMemo(() => {
    if (!task.assignee_name) return null;
    const parts = task.assignee_name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [task.assignee_name]);

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(15);
      } catch {}
    }
    onToggleComplete?.(task);
  };

  const priorityColor = React.useMemo(() => {
    switch (task.priority) {
      case 'urgent':
        return colors.urgent;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.primary;
      default:
        return colors.success;
    }
  }, [task.priority, colors]);

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      onLongPress={() => onDelete?.(task)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCompleted ? colors.borderSubtle : colors.border,
          opacity: isCompleted ? 0.65 : pressed ? 0.94 : 1,
        },
        style,
      ]}>
      {/* Priority accent stripe */}
      <View
        style={[
          styles.priorityAccent,
          {
            backgroundColor: isCompleted ? 'transparent' : priorityColor,
          },
        ]}
      />

      <View style={styles.contentRow}>
        {/* Things 3 style circular toggle button */}
        <Pressable
          hitSlop={12}
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.checkbox,
            {
              borderColor: isCompleted
                ? colors.success
                : task.priority === 'urgent'
                ? colors.urgent
                : colors.border,
              backgroundColor: isCompleted
                ? colors.success
                : isDark
                ? '#1E293B'
                : '#F8FAFC',
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          {isCompleted && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={12}
              tintColor="#FFFFFF"
            />
          )}
        </Pressable>

        {/* Task Details */}
        <View style={styles.body}>
          {/* Top meta row */}
          <View style={styles.badgesRow}>
            <DepartmentBadge department={task.department} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />

            {/* Quick Actions */}
            <View style={styles.actions}>
              {onEdit && (
                <Pressable
                  hitSlop={8}
                  onPress={() => onEdit(task)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? '#1E293B' : colors.backgroundElement,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}>
                  <SymbolView
                    name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                    size={13}
                    tintColor={colors.textSecondary}
                  />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  hitSlop={8}
                  onPress={() => onDelete(task)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}>
                  <SymbolView
                    name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                    size={13}
                    tintColor={colors.danger}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Title */}
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: isCompleted ? colors.textSecondary : colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}>
            {task.title}
          </Text>

          {/* Description snippet if present */}
          {Boolean(task.description) && !isCompleted && (
            <Text
              numberOfLines={2}
              style={[styles.description, { color: colors.textSecondary }]}>
              {task.description}
            </Text>
          )}

          {/* Footer Info: Deadline and Assignee */}
          <View style={styles.footerRow}>
            {deadlineInfo && (
              <View
                style={[
                  styles.deadlinePill,
                  {
                    backgroundColor:
                      deadlineInfo.isOverdue && !isCompleted
                        ? isDark
                          ? 'rgba(239, 68, 68, 0.2)'
                          : colors.dangerLight
                        : deadlineInfo.isUrgent && !isCompleted
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.2)'
                          : colors.warningLight
                        : isDark
                        ? '#1E293B'
                        : colors.backgroundElement,
                  },
                ]}>
                <SymbolView
                  name={{
                    ios: 'clock.fill',
                    android: 'schedule',
                    web: 'schedule',
                  }}
                  size={11}
                  tintColor={
                    deadlineInfo.isOverdue && !isCompleted
                      ? colors.danger
                      : deadlineInfo.isUrgent && !isCompleted
                      ? colors.warning
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.deadlineText,
                    {
                      color:
                        deadlineInfo.isOverdue && !isCompleted
                          ? colors.danger
                          : deadlineInfo.isUrgent && !isCompleted
                          ? colors.warning
                          : colors.textSecondary,
                    },
                  ]}>
                  {deadlineInfo.text}
                </Text>
              </View>
            )}

            {Boolean(task.assignee_name) && (
              <View style={styles.assigneeContainer}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isDark ? 'rgba(3, 126, 243, 0.25)' : colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {initials}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.assigneeName, { color: colors.textSecondary }]}>
                  {task.assignee_name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  priorityAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  deadlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
  },
  assigneeName: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 120,
  },
});

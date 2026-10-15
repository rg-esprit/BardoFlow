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

  // Format deadline and check overdue status
  const deadlineInfo = React.useMemo(() => {
    if (!task.deadline) return null;

    const due = new Date(task.deadline);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    const diffDays = Math.round(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let text = '';
    let isOverdue = false;
    let isUrgent = false;

    if (diffDays < 0) {
      isOverdue = true;
      text = `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays === 0) {
      isUrgent = true;
      text = 'Today';
    } else if (diffDays === 1) {
      text = 'Tomorrow';
    } else if (diffDays <= 7) {
      text = `In ${diffDays} days`;
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

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCompleted
            ? colors.borderSubtle
            : colors.border,
          opacity: isCompleted ? 0.72 : pressed ? 0.95 : 1,
        },
        style,
      ]}>
      <View style={styles.contentRow}>
        {/* Toggle completion button */}
        <Pressable
          hitSlop={12}
          onPress={() => onToggleComplete?.(task)}
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.primary : colors.textSecondary,
              backgroundColor: isCompleted ? colors.primary : 'transparent',
            },
          ]}>
          {isCompleted && (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={13}
              tintColor="#FFFFFF"
            />
          )}
        </Pressable>

        {/* Task Details */}
        <View style={styles.body}>
          {/* Badges row */}
          <View style={styles.badgesRow}>
            <DepartmentBadge department={task.department} size="sm" />
            <PriorityBadge priority={task.priority} size="sm" />

            {/* Quick Actions */}
            <View style={styles.actions}>
              {onEdit && (
                <Pressable
                  hitSlop={8}
                  onPress={() => onEdit(task)}
                  style={styles.actionBtn}>
                  <SymbolView
                    name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                    size={14}
                    tintColor={colors.textSecondary}
                  />
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  hitSlop={8}
                  onPress={() => onDelete(task)}
                  style={styles.actionBtn}>
                  <SymbolView
                    name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                    size={14}
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
          {task.description && !isCompleted && (
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
                        ? colors.dangerLight
                        : deadlineInfo.isUrgent && !isCompleted
                        ? colors.warningLight
                        : colors.backgroundElement,
                  },
                ]}>
                <SymbolView
                  name={{
                    ios: 'calendar',
                    android: 'calendar_today',
                    web: 'calendar_today',
                  }}
                  size={12}
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

            {task.assignee_name && (
              <View style={styles.assigneeContainer}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.avatarText,
                      { color: colors.primary },
                    ]}>
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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    gap: 8,
    marginLeft: 'auto',
  },
  actionBtn: {
    padding: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
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
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  deadlineText: {
    fontSize: 11,
    fontWeight: '600',
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
    maxWidth: 110,
  },
});

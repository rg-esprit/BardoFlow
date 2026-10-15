import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Vibration,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Department, NewTaskInput, TaskPriority } from '@/types/database';
import { createTask } from '@/services/task-service';
import { Colors, DepartmentColors } from '@/constants/theme';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultDepartment?: Department;
  defaultDate?: Date;
}

const DEPARTMENTS: Department[] = [
  'General',
  'oGX',
  'iCX',
  'TM',
  'Finance',
  'Marketing',
  'BD',
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'urgent', label: 'Urgent', color: '#EF4444' },
  { key: 'high', label: 'High', color: '#F97316' },
  { key: 'medium', label: 'Medium', color: '#0284C7' },
  { key: 'low', label: 'Low', color: '#10B981' },
];

type DeadlineChoice = 'today' | 'tomorrow' | 'next_meeting' | 'none';

export function QuickAddModal({
  visible,
  onClose,
  onTaskCreated,
  defaultDepartment = 'General',
  defaultDate,
}: QuickAddModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department>(defaultDepartment);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadlineChoice, setDeadlineChoice] = useState<DeadlineChoice>('today');
  const [assigneeName, setAssigneeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDepartment(defaultDepartment || 'General');
      setPriority('medium');
      setDeadlineChoice(defaultDate ? 'today' : 'today');
      setAssigneeName('');
      setError(null);
    }
  }, [visible, defaultDepartment, defaultDate]);

  const calculateDeadline = (): string | null => {
    const base = defaultDate ? new Date(defaultDate) : new Date();
    if (deadlineChoice === 'none') return null;

    if (deadlineChoice === 'today') {
      base.setHours(20, 0, 0, 0);
      return base.toISOString();
    }
    if (deadlineChoice === 'tomorrow') {
      const d = new Date(base.getTime() + 24 * 60 * 60 * 1000);
      d.setHours(20, 0, 0, 0);
      return d.toISOString();
    }
    if (deadlineChoice === 'next_meeting') {
      // In 2 days at 18:00
      const d = new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000);
      d.setHours(18, 0, 0, 0);
      return d.toISOString();
    }
    return null;
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(20);
      } catch {}
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const input: NewTaskInput = {
        title: trimmedTitle,
        department,
        priority,
        deadline: calculateDeadline(),
        assignee_name: assigneeName.trim() || null,
        status: 'pending',
      };

      await createTask(input);
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('[QuickAddModal] Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        {/* Backdrop press to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          {/* Grabber handle */}
          <View style={styles.grabberHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDark ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight },
                ]}>
                <SymbolView
                  name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                  size={18}
                  tintColor={colors.primary}
                />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Quick Add Task</Text>
            </View>

            <Pressable
              hitSlop={10}
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? '#1E293B' : colors.backgroundElement },
              ]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={13}
                tintColor={colors.textSecondary}
              />
            </Pressable>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? '#450A0A' : '#FEF2F2' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Title input with autofocus */}
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: isDark ? '#1E293B' : colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}>
            <TextInput
              autoFocus
              placeholder="What needs to be done? (e.g. Call EB member)"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            {/* Quick Deadline Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              WHEN TO DO THIS?
            </Text>
            <View style={styles.chipsRow}>
              {(
                [
                  { key: 'today', label: 'Today', icon: 'sun.max.fill' },
                  { key: 'tomorrow', label: 'Tomorrow', icon: 'sunrise.fill' },
                  { key: 'next_meeting', label: 'Next Meeting', icon: 'calendar' },
                  { key: 'none', label: 'No Date', icon: 'minus.circle' },
                ] as const
              ).map((chip) => {
                const isSelected = deadlineChoice === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => setDeadlineChoice(chip.key)}
                    style={({ pressed }) => [
                      styles.choiceChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#1E293B'
                          : colors.backgroundElement,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.choiceChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Department Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              DEPARTMENT
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptScroll}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = department === dept;
                const deptConf = DepartmentColors[dept] || DepartmentColors['General'];
                return (
                  <Pressable
                    key={dept}
                    onPress={() => setDepartment(dept)}
                    style={({ pressed }) => [
                      styles.deptChip,
                      {
                        backgroundColor: isSelected
                          ? deptConf.color
                          : isDark
                          ? deptConf.bgDark
                          : deptConf.bgLight,
                        borderColor: isSelected ? deptConf.color : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.deptDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : deptConf.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.deptChipText,
                        {
                          color: isSelected ? '#FFFFFF' : deptConf.color,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}>
                      {dept}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Priority Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              PRIORITY LEVEL
            </Text>
            <View style={styles.chipsRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={({ pressed }) => [
                      styles.priorityPill,
                      {
                        backgroundColor: isSelected
                          ? p.color
                          : isDark
                          ? '#1E293B'
                          : colors.backgroundElement,
                        borderColor: isSelected ? p.color : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: isSelected ? '#FFFFFF' : p.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityPillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Assignee Input */}
            <View
              style={[
                styles.assigneeInputBox,
                {
                  backgroundColor: isDark ? '#1E293B' : colors.backgroundElement,
                  borderColor: colors.border,
                  marginTop: 14,
                },
              ]}>
              <SymbolView
                name={{ ios: 'person', android: 'person', web: 'person' }}
                size={14}
                tintColor={colors.textSecondary}
              />
              <TextInput
                placeholder="Assign to (e.g. Yasmine, Aziz - optional)"
                placeholderTextColor={colors.textSecondary}
                value={assigneeName}
                onChangeText={setAssigneeName}
                style={[styles.assigneeInput, { color: colors.text }]}
              />
            </View>
          </ScrollView>

          {/* Action Button */}
          <Pressable
            disabled={isSubmitting}
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.submitBtnText}>Add Task</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  grabberHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  choiceChipText: {
    fontSize: 12,
  },
  deptScroll: {
    gap: 7,
    paddingVertical: 2,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  deptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deptChipText: {
    fontSize: 12,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityPillText: {
    fontSize: 12,
  },
  assigneeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assigneeInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

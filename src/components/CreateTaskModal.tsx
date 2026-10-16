import React, { useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Department, NewTaskInput, TaskPriority } from '@/types/database';
import { createTask } from '@/services/task-service';
import { Colors, DepartmentColors } from '@/constants/theme';
import { DepartmentBadge } from './DepartmentBadge';
import { PriorityBadge } from './PriorityBadge';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultDepartment?: Department;
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

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export function CreateTaskModal({
  visible,
  onClose,
  onTaskCreated,
  defaultDepartment,
}: CreateTaskModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>(
    defaultDepartment || 'General'
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeName, setAssigneeName] = useState('');
  const [deadlinePreset, setDeadlinePreset] = useState<
    'none' | 'today' | 'tomorrow' | 'weekend' | 'next_week'
  >('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDepartment(defaultDepartment || 'General');
    setPriority('medium');
    setAssigneeName('');
    setDeadlinePreset('none');
    setError(null);
  };

  const calculateDeadline = (): string | null => {
    if (deadlinePreset === 'none') return null;

    const now = new Date();
    if (deadlinePreset === 'today') {
      now.setHours(23, 59, 59, 999);
      return now.toISOString();
    }
    if (deadlinePreset === 'tomorrow') {
      const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
    if (deadlinePreset === 'weekend') {
      const d = new Date();
      const day = d.getDay();
      const diffToSunday = day === 0 ? 0 : 7 - day;
      d.setDate(d.getDate() + diffToSunday);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
    if (deadlinePreset === 'next_week') {
      const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const input: NewTaskInput = {
        title: title.trim(),
        description: description.trim() || null,
        department,
        priority,
        status: 'pending',
        deadline: calculateDeadline(),
        assignee_name: assigneeName.trim() || null,
      };

      await createTask(input);
      resetForm();
      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('[CreateTaskModal] Failed to create task:', err);
      setError(err?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={isDesktop ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.modalContainer,
            isDesktop && styles.modalContainerDesktop,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                New AIESEC Task
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Assign action items to LC members
              </Text>
            </View>

            <Pressable
              hitSlop={12}
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.backgroundElement },
              ]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={16}
                tintColor={colors.textSecondary}
              />
            </Pressable>
          </View>

          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.dangerLight },
              ]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Title */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Task Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="e.g., Send Lead Nurturing Email Blast"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Department Selector */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Department
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = department === dept;
                const deptColor =
                  DepartmentColors[dept]?.color || colors.primary;

                return (
                  <Pressable
                    key={dept}
                    onPress={() => setDepartment(dept)}
                    style={[
                      styles.deptChip,
                      {
                        backgroundColor: isSelected
                          ? deptColor
                          : colors.backgroundElement,
                        borderColor: isSelected ? deptColor : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.deptChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {dept}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Priority Selector */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Priority
            </Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityOption,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(3, 126, 243, 0.2)'
                            : '#EFF6FF'
                          : colors.backgroundElement,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}>
                    <PriorityBadge priority={p} size="sm" />
                  </Pressable>
                );
              })}
            </View>

            {/* Deadline Presets */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Deadline
            </Text>
            <View style={styles.deadlineRow}>
              {[
                { key: 'none', label: 'None' },
                { key: 'today', label: 'Today' },
                { key: 'tomorrow', label: 'Tomorrow' },
                { key: 'weekend', label: 'Weekend' },
                { key: 'next_week', label: 'Next Week' },
              ].map((item) => {
                const isSelected = deadlinePreset === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      setDeadlinePreset(
                        item.key as typeof deadlinePreset
                      )
                    }
                    style={[
                      styles.deadlineChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.backgroundElement,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.deadlineChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Assignee Name */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Assignee Name (Optional)
            </Text>
            <TextInput
              value={assigneeName}
              onChangeText={setAssigneeName}
              placeholder="e.g., Yassine Bardo, Sarah K."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Description */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add key deliverables, links, or notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Submit Button */}
            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <SymbolView
                    name={{ ios: 'plus.circle.fill', android: 'add', web: 'add' }}
                    size={18}
                    tintColor="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>Create Task</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalContainerDesktop: {
    maxWidth: 580,
    borderRadius: 20,
    borderBottomWidth: 1,
    maxHeight: '88%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  deptChipText: {
    fontSize: 13,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  deadlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deadlineChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  deadlineChipText: {
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 22,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

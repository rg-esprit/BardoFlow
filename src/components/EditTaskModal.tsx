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
  useWindowDimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Department, Task, TaskPriority, TaskStatus } from '@/types/database';
import { updateTask } from '@/services/task-service';
import { Colors, DepartmentColors } from '@/constants/theme';
import { PriorityBadge } from './PriorityBadge';

interface EditTaskModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
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
const STATUSES: { status: TaskStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
];

export function EditTaskModal({
  task,
  visible,
  onClose,
  onTaskUpdated,
}: EditTaskModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('General');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assigneeName, setAssigneeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDepartment(task.department);
      setPriority(task.priority);
      setStatus(task.status);
      setAssigneeName(task.assignee_name || '');
      setError(null);
    }
  }, [task]);

  const handleSubmit = async () => {
    if (!task) return;
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        department,
        priority,
        status,
        assignee_name: assigneeName.trim() || null,
      });

      onTaskUpdated();
      onClose();
    } catch (err: any) {
      console.error('[EditTaskModal] Error updating task:', err);
      setError(err?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

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
                Edit Task
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Update details, priority, or status
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
              onChangeText={setTitle}
              placeholder="Task Title"
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

            {/* Status Selector */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Status
            </Text>
            <View style={styles.statusRow}>
              {STATUSES.map((item) => {
                const isSelected = status === item.status;
                return (
                  <Pressable
                    key={item.status}
                    onPress={() => setStatus(item.status)}
                    style={[
                      styles.statusChip,
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
                        styles.statusChipText,
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

            {/* Department */}
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

            {/* Priority */}
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

            {/* Assignee */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Assignee Name
            </Text>
            <TextInput
              value={assigneeName}
              onChangeText={setAssigneeName}
              placeholder="Assignee name"
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
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
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
                <Text style={styles.submitButtonText}>Save Changes</Text>
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
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 13,
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
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

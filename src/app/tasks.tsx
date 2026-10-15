import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Department, Task, TaskPriority, TaskStatus } from '@/types/database';
import {
  getTasks,
  toggleTaskComplete,
  deleteTask,
} from '@/services/task-service';
import { Colors, DepartmentColors } from '@/constants/theme';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { EditTaskModal } from '@/components/EditTaskModal';

const STATUS_FILTERS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const DEPARTMENTS: (Department | 'all')[] = [
  'all',
  'oGX',
  'iCX',
  'TM',
  'Finance',
  'Marketing',
  'BD',
  'General',
];

const PRIORITIES: (TaskPriority | 'all')[] = [
  'all',
  'urgent',
  'high',
  'medium',
  'low',
];

export default function TasksScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error('[TasksScreen] Failed to load tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      await toggleTaskComplete(task.id, task.status);
    } catch (err) {
      console.error('[TasksScreen] Error toggling task:', err);
      loadTasks();
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
            await deleteTask(task.id);
          },
        },
      ]
    );
  };

  // Filter tasks locally
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Department
      if (
        deptFilter !== 'all' &&
        t.department.toLowerCase() !== deptFilter.toLowerCase()
      ) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchAssignee = t.assignee_name?.toLowerCase().includes(q);
        const matchDept = t.department.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchDept) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, deptFilter, priorityFilter, searchQuery]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDeptFilter('all');
    setPriorityFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'all' ||
    deptFilter !== 'all' ||
    priorityFilter !== 'all';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Tasks & OKRs
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </Text>
        </View>

        <Pressable
          onPress={() => setCreateModalVisible(true)}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={16}
            tintColor="#FFFFFF"
          />
          <Text style={styles.createButtonText}>Add Task</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={16}
            tintColor={colors.textSecondary}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks, assignees, or keywords..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable
              hitSlop={8}
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}>
              <SymbolView
                name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
                size={14}
                tintColor={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}>
          {STATUS_FILTERS.map((item) => {
            const isSelected = statusFilter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setStatusFilter(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.card,
                    borderColor: isSelected
                      ? colors.primary
                      : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
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
        </ScrollView>
      </View>

      {/* Department Horizontal Scroll */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}>
          {DEPARTMENTS.map((dept) => {
            const isSelected = deptFilter === dept;
            const deptColor =
              dept === 'all'
                ? colors.primary
                : DepartmentColors[dept]?.color || colors.primary;

            return (
              <Pressable
                key={dept}
                onPress={() => setDeptFilter(dept)}
                style={[
                  styles.deptFilterChip,
                  {
                    backgroundColor: isSelected
                      ? deptColor
                      : colors.card,
                    borderColor: isSelected ? deptColor : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.deptFilterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {dept === 'all' ? 'All Depts' : dept}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Priority Horizontal Scroll */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}>
          {PRIORITIES.map((p) => {
            const isSelected = priorityFilter === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPriorityFilter(p)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(3, 126, 243, 0.25)'
                        : '#EFF6FF'
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.priorityChipText,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {p === 'all'
                    ? 'All Priorities'
                    : p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={(t) => setEditingTask(t)}
                onDelete={handleDeleteTask}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
                size={36}
                tintColor={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No tasks match your criteria
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {hasActiveFilters
                  ? 'Try clearing some filters or search query.'
                  : 'Start by creating your first task for LC Bardo.'}
              </Text>

              {hasActiveFilters ? (
                <Pressable
                  onPress={clearAllFilters}
                  style={[
                    styles.emptyButton,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text
                    style={[styles.emptyButtonText, { color: colors.text }]}>
                    Clear Filters
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => setCreateModalVisible(true)}
                  style={[
                    styles.emptyButton,
                    { backgroundColor: colors.primary },
                  ]}>
                  <Text
                    style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>
                    + Create First Task
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <CreateTaskModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onTaskCreated={loadTasks}
        defaultDepartment={deptFilter !== 'all' ? deptFilter : undefined}
      />

      <EditTaskModal
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={loadTasks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  filterGroup: {
    marginBottom: 8,
  },
  chipsScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  deptFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  deptFilterChipText: {
    fontSize: 12,
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityChipText: {
    fontSize: 11,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 90,
  },
  emptyState: {
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

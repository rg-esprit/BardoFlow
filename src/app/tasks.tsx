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
  useColorScheme,
  Vibration,
  Platform,
  useWindowDimensions,
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
import { QuickAddModal } from '@/components/QuickAddModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { showAlert } from '@/utils/alert';

type StatusTab = 'all' | 'pending' | 'urgent' | 'completed';

const STATUS_TABS: { key: StatusTab; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'tray.full.fill' },
  { key: 'pending', label: 'Pending', icon: 'hourglass' },
  { key: 'urgent', label: 'Urgent', icon: 'flame.fill' },
  { key: 'completed', label: 'Done', icon: 'checkmark.circle.fill' },
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

export default function TasksScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');

  // Modals
  const [quickAddVisible, setQuickAddVisible] = useState(false);
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
    showAlert(
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

  // Department counts
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    DEPARTMENTS.forEach((d) => {
      if (d !== 'all') {
        counts[d] = tasks.filter(
          (t) => t.department.toLowerCase() === d.toLowerCase()
        ).length;
      }
    });
    return counts;
  }, [tasks]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: tasks.length,
      pending: tasks.filter((t) => t.status !== 'completed').length,
      urgent: tasks.filter(
        (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
      ).length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    };
  }, [tasks]);

  // Filtered task set
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (activeTab === 'pending' && t.status === 'completed') return false;
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (
        activeTab === 'urgent' &&
        (t.status === 'completed' || (t.priority !== 'urgent' && t.priority !== 'high'))
      ) {
        return false;
      }

      // Dept filter
      if (deptFilter !== 'all' && t.department.toLowerCase() !== deptFilter.toLowerCase()) {
        return false;
      }

      // Search
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
  }, [tasks, activeTab, deptFilter, searchQuery]);

  // Grouped tasks
  const urgentGroup = useMemo(() => {
    if (activeTab === 'completed') return [];
    return filteredTasks.filter(
      (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
    );
  }, [filteredTasks, activeTab]);

  const regularPendingGroup = useMemo(() => {
    if (activeTab === 'completed') return [];
    return filteredTasks.filter(
      (t) => t.status !== 'completed' && t.priority !== 'urgent' && t.priority !== 'high'
    );
  }, [filteredTasks, activeTab]);

  const completedGroup = useMemo(() => {
    if (activeTab === 'pending' || activeTab === 'urgent') return [];
    return filteredTasks.filter((t) => t.status === 'completed');
  }, [filteredTasks, activeTab]);

  const handleTabChange = (tab: StatusTab) => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {}
    }
    setActiveTab(tab);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Container with Responsive Max-Width */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View style={styles.responsiveContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                AIESEC IN BARDO
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Task Center</Text>
            </View>

            <Pressable
              onPress={() => setQuickAddVisible(true)}
              style={({ pressed }) => [
                styles.headerAddBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={16}
                tintColor="#FFFFFF"
              />
              <Text style={styles.headerAddBtnText}>Add Task</Text>
            </Pressable>
          </View>

          {/* Desktop Search & Status Row or Mobile Stack */}
          <View style={isDesktop ? styles.desktopControlsRow : undefined}>
            {/* Search Bar */}
            <View style={isDesktop ? styles.desktopSearchWrap : styles.searchContainer}>
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                <SymbolView
                  name={{
                    ios: 'magnifyingglass',
                    android: 'search',
                    web: 'search',
                  }}
                  size={16}
                  tintColor={colors.textSecondary}
                />
                <TextInput
                  placeholder="Search tasks, departments, assignees..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.searchInput, { color: colors.text }]}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    hitSlop={8}
                    onPress={() => setSearchQuery('')}
                    style={styles.clearBtn}>
                    <SymbolView
                      name={{
                        ios: 'xmark.circle.fill',
                        android: 'cancel',
                        web: 'cancel',
                      }}
                      size={16}
                      tintColor={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Segmented Status Filter */}
            <View style={isDesktop ? styles.desktopTabsWrap : styles.tabsContainer}>
              <View
                style={[
                  styles.segmentedBar,
                  {
                    backgroundColor: isDark ? '#18202F' : colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                {STATUS_TABS.map((tab) => {
                  const isSelected = activeTab === tab.key;
                  const count = tabCounts[tab.key];
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => handleTabChange(tab.key)}
                      style={[
                        styles.tabPill,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : 'transparent',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.tabLabel,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}>
                        {tab.label}
                      </Text>
                      {count > 0 && (
                        <View
                          style={[
                            styles.tabCountPill,
                            {
                              backgroundColor: isSelected
                                ? 'rgba(255, 255, 255, 0.25)'
                                : isDark
                                ? '#1E293B'
                                : colors.backgroundElement,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.tabCountText,
                              {
                                color: isSelected ? '#FFFFFF' : colors.textSecondary,
                              },
                            ]}>
                            {count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Department Filter Pills */}
          <View style={styles.deptScrollWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptScrollContent}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = deptFilter === dept;
                const count = deptCounts[dept] || 0;
                const deptConf =
                  dept !== 'all'
                    ? DepartmentColors[dept] || DepartmentColors['General']
                    : null;

                return (
                  <Pressable
                    key={dept}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        try {
                          Vibration.vibrate(10);
                        } catch {}
                      }
                      setDeptFilter(dept);
                    }}
                    style={({ pressed }) => [
                      styles.deptFilterPill,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? '#18202F'
                          : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    {deptConf && (
                      <View
                        style={[
                          styles.deptDot,
                          { backgroundColor: isSelected ? '#FFFFFF' : deptConf.color },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.deptFilterText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}>
                      {dept === 'all' ? 'All Teams' : dept}
                    </Text>
                    <Text
                      style={[
                        styles.deptCountSub,
                        {
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary,
                        },
                      ]}>
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Tasks List */}
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading tasks...
              </Text>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{
                  ios: 'checklist',
                  android: 'checklist',
                  web: 'checklist',
                }}
                size={38}
                tintColor={colors.primary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? 'No matching tasks' : 'No tasks in this view'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with different keywords or clearing filters.'
                  : 'Great job! You are clear or ready to add new action items.'}
              </Text>

              <Pressable
                onPress={() => setQuickAddVisible(true)}
                style={({ pressed }) => [
                  styles.emptyCtaBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={15}
                  tintColor="#FFFFFF"
                />
                <Text style={styles.emptyCtaText}>Create First Task</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listContent}>
              {/* Urgent & High Priority Group */}
              {urgentGroup.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.statusDot, { backgroundColor: colors.urgent }]} />
                      <Text style={[styles.sectionTitle, { color: colors.urgent }]}>
                        Urgent & Priority ({urgentGroup.length})
                      </Text>
                    </View>
                  </View>
                  <View style={isDesktop ? styles.desktopCardGrid : undefined}>
                    {urgentGroup.map((task) => (
                      <View key={task.id} style={isDesktop ? styles.desktopCardItem : undefined}>
                        <TaskCard
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onEdit={setEditingTask}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Remaining Action Items */}
              {regularPendingGroup.length > 0 && (
                <View style={styles.sectionWrap}>
                  {urgentGroup.length > 0 && (
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderLeft}>
                        <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                          Action Items ({regularPendingGroup.length})
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={isDesktop ? styles.desktopCardGrid : undefined}>
                    {regularPendingGroup.map((task) => (
                      <View key={task.id} style={isDesktop ? styles.desktopCardItem : undefined}>
                        <TaskCard
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onEdit={setEditingTask}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Completed Tasks */}
              {completedGroup.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Completed ({completedGroup.length})
                      </Text>
                    </View>
                  </View>
                  <View style={isDesktop ? styles.desktopCardGrid : undefined}>
                    {completedGroup.map((task) => (
                      <View key={task.id} style={isDesktop ? styles.desktopCardItem : undefined}>
                        <TaskCard
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDeleteTask}
                          onEdit={setEditingTask}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: isDesktop ? 40 : 90 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setQuickAddVisible(true)}
        bottomOffset={isDesktop ? 32 : 96}
        style={
          isDesktop && {
            right: Math.max(24, (width - 1120) / 2 + 24),
          }
        }
      />

      {/* Modals */}
      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onTaskCreated={loadTasks}
        defaultDepartment={deptFilter !== 'all' ? deptFilter : 'General'}
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
  scrollContent: {
    paddingBottom: 20,
  },
  responsiveContainer: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  headerAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  desktopControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  desktopSearchWrap: {
    flex: 1,
  },
  desktopTabsWrap: {
    minWidth: 360,
  },
  desktopCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  desktopCardItem: {
    width: '49%',
    flexGrow: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 2,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 11,
    gap: 5,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deptScrollWrap: {
    marginVertical: 6,
  },
  deptScrollContent: {
    paddingHorizontal: 16,
    gap: 7,
  },
  deptFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  deptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deptFilterText: {
    fontSize: 12,
  },
  deptCountSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionWrap: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    marginHorizontal: 16,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

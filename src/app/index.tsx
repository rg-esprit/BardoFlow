import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Alert,
  TextInput,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Task, Meeting, Activity } from '@/types/database';
import {
  getTasks,
  toggleTaskComplete,
  deleteTask,
  createTask,
} from '@/services/task-service';
import { getMeetings, deleteMeeting } from '@/services/meeting-service';
import { getActivities } from '@/services/activity-service';
import { Colors } from '@/constants/theme';
import { WeekStrip, isSameDay } from '@/components/WeekStrip';
import { DailyFocusHeader } from '@/components/DailyFocusHeader';
import { TaskCard } from '@/components/TaskCard';
import { MeetingCard } from '@/components/MeetingCard';
import { QuickAddModal } from '@/components/QuickAddModal';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';
import { EditTaskModal } from '@/components/EditTaskModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';

export default function TodayDashboardScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Selected date for WeekStrip (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Inline quick task add input
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [isInlineAdding, setIsInlineAdding] = useState(false);

  // Modals
  const [quickAddModalVisible, setQuickAddModalVisible] = useState(false);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedMeetings, fetchedActivities] =
        await Promise.all([
          getTasks(),
          getMeetings(),
          getActivities({ limit: 10 }),
        ]);

      setTasks(fetchedTasks);
      setMeetings(fetchedMeetings);
      setActivities(fetchedActivities);
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: updatedStatus } : t))
      );

      await toggleTaskComplete(task.id, task.status);
      getActivities({ limit: 10 }).then(setActivities).catch(() => {});
    } catch (err) {
      console.error('[Dashboard] Toggle task error:', err);
      loadData();
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
            getActivities({ limit: 10 }).then(setActivities).catch(() => {});
          },
        },
      ]
    );
  };

  const handleDeleteMeeting = (meeting: Meeting) => {
    Alert.alert(
      'Cancel Meeting',
      `Are you sure you want to delete "${meeting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
            await deleteMeeting(meeting.id);
            getActivities({ limit: 10 }).then(setActivities).catch(() => {});
          },
        },
      ]
    );
  };

  // Inline Quick Add submit
  const handleInlineAdd = async () => {
    const trimmed = inlineTaskTitle.trim();
    if (!trimmed) return;

    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(15);
      } catch {}
    }

    try {
      setIsInlineAdding(true);
      const deadline = new Date(selectedDate);
      deadline.setHours(20, 0, 0, 0);

      const newTask = await createTask({
        title: trimmed,
        department: 'General',
        priority: 'medium',
        deadline: deadline.toISOString(),
        status: 'pending',
      });

      setInlineTaskTitle('');
      setTasks((prev) => [newTask, ...prev]);
      getActivities({ limit: 10 }).then(setActivities).catch(() => {});
    } catch (err) {
      console.error('[Dashboard] Inline add error:', err);
      Alert.alert('Error', 'Could not create task. Please try again.');
    } finally {
      setIsInlineAdding(false);
    }
  };

  const today = useMemo(() => new Date(), []);
  const isViewingToday = useMemo(() => isSameDay(selectedDate, today), [selectedDate, today]);

  // Daily focus metrics for today
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      return isSameDay(new Date(t.deadline), today);
    });
  }, [tasks, today]);

  const completedTodayCount = useMemo(() => {
    return todayTasks.filter((t) => t.status === 'completed').length;
  }, [todayTasks]);

  const urgentTodayCount = useMemo(() => {
    return todayTasks.filter(
      (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
    ).length;
  }, [todayTasks]);

  // Spotlight Next Up Meeting (any meeting today or upcoming in the next 24h)
  const spotlightMeeting = useMemo(() => {
    const nowMs = Date.now();
    // Prioritize meeting on selected date
    const dayMeetings = meetings.filter((m) => {
      if (!m.meeting_date) return false;
      const mDate = new Date(m.meeting_date);
      return isSameDay(mDate, selectedDate);
    });

    if (dayMeetings.length > 0) {
      // Find one that is ongoing or upcoming
      const upcoming = dayMeetings.find(
        (m) => new Date(m.meeting_date).getTime() >= nowMs - 1000 * 60 * 60
      );
      if (upcoming) return upcoming;
      return dayMeetings[0];
    }

    // Otherwise if viewing today, find the next upcoming meeting
    if (isViewingToday) {
      const upcoming = meetings.find(
        (m) => new Date(m.meeting_date).getTime() >= nowMs - 1000 * 60 * 30
      );
      return upcoming || null;
    }

    return null;
  }, [meetings, selectedDate, isViewingToday]);

  // Agenda items for the selected day
  const overdueTasks = useMemo(() => {
    if (!isViewingToday) return [];
    const nowTime = today.getTime();
    return tasks.filter((t) => {
      if (t.status === 'completed' || !t.deadline) return false;
      const d = new Date(t.deadline);
      return d.getTime() < nowTime && !isSameDay(d, today);
    });
  }, [tasks, isViewingToday, today]);

  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      return isSameDay(new Date(t.deadline), selectedDate) && t.status !== 'completed';
    });
  }, [tasks, selectedDate]);

  const selectedDayCompletedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      return isSameDay(new Date(t.deadline), selectedDate) && t.status === 'completed';
    });
  }, [tasks, selectedDate]);

  const selectedDayMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (!m.meeting_date) return false;
      return isSameDay(new Date(m.meeting_date), selectedDate);
    });
  }, [meetings, selectedDate]);

  const selectedDayLabel = useMemo(() => {
    if (isViewingToday) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (isSameDay(selectedDate, tomorrow)) return 'Tomorrow';
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate, isViewingToday, today]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading BardoFlow...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Daily Focus Header with Time-Aware Greeting & Momentum Progress */}
        <DailyFocusHeader
          completedCount={completedTodayCount}
          totalCount={todayTasks.length}
          urgentCount={urgentTodayCount}
          selectedDate={selectedDate}
        />

        {/* Interactive 7-Day Week Strip */}
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasks={tasks}
          meetings={meetings}
          onResetToday={() => setSelectedDate(new Date())}
        />

        {/* Next Up Meeting Spotlight Card (if any meeting today/selected date) */}
        {spotlightMeeting && (
          <View style={styles.sectionWrap}>
            <MeetingCard
              meeting={spotlightMeeting}
              spotlight
              onDelete={handleDeleteMeeting}
            />
          </View>
        )}

        {/* Inline Quick Task Bar */}
        <View style={styles.sectionWrap}>
          <View
            style={[
              styles.inlineAddBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <SymbolView
              name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
              size={18}
              tintColor={colors.primary}
            />
            <TextInput
              placeholder={`Quick add task for ${selectedDayLabel}...`}
              placeholderTextColor={colors.textSecondary}
              value={inlineTaskTitle}
              onChangeText={setInlineTaskTitle}
              onSubmitEditing={handleInlineAdd}
              returnKeyType="done"
              style={[styles.inlineInput, { color: colors.text }]}
            />
            {inlineTaskTitle.trim().length > 0 && (
              <Pressable
                onPress={handleInlineAdd}
                disabled={isInlineAdding}
                style={({ pressed }) => [
                  styles.inlineAddBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                {isInlineAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <SymbolView
                    name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
                    size={12}
                    tintColor="#FFFFFF"
                  />
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Selected Date Context Header */}
        <View style={styles.agendaHeaderRow}>
          <View style={styles.agendaTitleRow}>
            <Text style={[styles.agendaTitle, { color: colors.text }]}>
              {selectedDayLabel}'s Agenda
            </Text>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: isDark ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight,
                },
              ]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                {selectedDayTasks.length + selectedDayMeetings.length}
              </Text>
            </View>
          </View>

          <View style={styles.actionShortcuts}>
            <Pressable
              hitSlop={8}
              onPress={() => setMeetingModalVisible(true)}
              style={({ pressed }) => [
                styles.shortcutPill,
                {
                  backgroundColor: isDark ? '#1E293B' : colors.backgroundElement,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name={{ ios: 'calendar.badge.plus', android: 'event', web: 'event' }}
                size={12}
                tintColor={colors.primary}
              />
              <Text style={[styles.shortcutText, { color: colors.textSecondary }]}>
                + Meeting
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Overdue Items Banner (if viewing today & has overdue) */}
        {overdueTasks.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.urgent }]} />
                <Text style={[styles.groupTitle, { color: colors.urgent }]}>
                  Overdue Action Items ({overdueTasks.length})
                </Text>
              </View>
            </View>

            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={setEditingTask}
              />
            ))}
          </View>
        )}

        {/* Pending Tasks for Selected Day */}
        <View style={styles.sectionWrap}>
          {selectedDayTasks.length === 0 && selectedDayMeetings.length === 0 && (
            <View
              style={[
                styles.emptyDayCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'task_alt', web: 'task_alt' }}
                size={34}
                tintColor={colors.primary}
              />
              <Text style={[styles.emptyDayTitle, { color: colors.text }]}>
                No pending items for {selectedDayLabel}
              </Text>
              <Text style={[styles.emptyDaySubtitle, { color: colors.textSecondary }]}>
                Use the quick add bar above or tap + to plan ahead.
              </Text>
            </View>
          )}

          {selectedDayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={setEditingTask}
            />
          ))}
        </View>

        {/* Completed Tasks section */}
        {selectedDayCompletedTasks.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
                  Completed ({selectedDayCompletedTasks.length})
                </Text>
              </View>
            </View>

            {selectedDayCompletedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={setEditingTask}
              />
            ))}
          </View>
        )}

        {/* Bottom padding so floating button doesn't cover content */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Action Button for rapid task creation */}
      <FloatingActionButton
        onPress={() => setQuickAddModalVisible(true)}
        bottomOffset={20}
      />

      {/* Modals */}
      <QuickAddModal
        visible={quickAddModalVisible}
        onClose={() => setQuickAddModalVisible(false)}
        onTaskCreated={loadData}
        defaultDate={selectedDate}
      />

      <CreateMeetingModal
        visible={meetingModalVisible}
        onClose={() => setMeetingModalVisible(false)}
        onMeetingCreated={loadData}
      />

      <EditTaskModal
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={loadData}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inlineAddBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inlineInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  inlineAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  agendaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionShortcuts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  emptyDayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    gap: 8,
  },
  emptyDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDaySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

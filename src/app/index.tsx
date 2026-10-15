import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Task, Meeting, Activity } from '@/types/database';
import {
  getTasks,
  toggleTaskComplete,
  deleteTask,
} from '@/services/task-service';
import { getMeetings } from '@/services/meeting-service';
import { getActivities } from '@/services/activity-service';
import { Colors } from '@/constants/theme';
import { StatCard } from '@/components/StatCard';
import { TaskCard } from '@/components/TaskCard';
import { MeetingCard } from '@/components/MeetingCard';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';

export default function TodayDashboardScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedMeetings, fetchedActivities] =
        await Promise.all([
          getTasks(),
          getMeetings(),
          getActivities({ limit: 8 }),
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
      // Optimistic update
      const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: updatedStatus } : t))
      );

      await toggleTaskComplete(task.id, task.status);
      // Refresh activities in background
      getActivities({ limit: 8 }).then(setActivities).catch(() => {});
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
            getActivities({ limit: 8 }).then(setActivities).catch(() => {});
          },
        },
      ]
    );
  };

  // Metrics calculations
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const urgentTasks = tasks.filter(
    (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
  );

  // Focus tasks: urgent, or due today/overdue
  const now = new Date();
  const todayStr = now.toDateString();

  const urgentOrTodayTasks = pendingTasks.filter((t) => {
    if (t.priority === 'urgent') return true;
    if (t.deadline) {
      const d = new Date(t.deadline);
      return d.toDateString() === todayStr || d.getTime() < now.getTime();
    }
    return false;
  });

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Next upcoming meeting
  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.meeting_date).getTime() >= now.getTime() - 1000 * 60 * 30
  );
  const nextMeeting = upcomingMeetings[0] || null;

  // Format today's date
  const formattedToday = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Relative time helper for activity
  const formatTimeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading LC Bardo dashboard...
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
        {/* Header Greeting */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.lcBadge,
                  { backgroundColor: colors.primaryLight },
                ]}>
                <Text style={[styles.lcBadgeText, { color: colors.primary }]}>
                  LC BARDO
                </Text>
              </View>
              <Text
                style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
                {formattedToday}
              </Text>
            </View>
            <Text style={[styles.greetingTitle, { color: colors.text }]}>
              BardoFlow
            </Text>
            <Text
              style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>
              Lead with passion, deliver with excellence.
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => setTaskModalVisible(true)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'plus.circle.fill', android: 'add', web: 'add' }}
              size={18}
              tintColor="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>+ New Task</Text>
          </Pressable>

          <Pressable
            onPress={() => setMeetingModalVisible(true)}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <SymbolView
              name={{
                ios: 'calendar.badge.plus',
                android: 'calendar_today',
                web: 'calendar_today',
              }}
              size={18}
              tintColor={colors.primary}
            />
            <Text
              style={[styles.actionButtonText, { color: colors.text }]}>
              + Schedule Meeting
            </Text>
          </Pressable>
        </View>

        {/* Metrics Summary Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsCol}>
            <StatCard
              label="Pending Tasks"
              value={pendingTasks.length}
              subtext={`${completedCount} completed`}
              iconName={{
                ios: 'checklist',
                android: 'checklist',
                web: 'checklist',
              }}
              iconColor="#037EF3"
            />
          </View>
          <View style={styles.metricsCol}>
            <StatCard
              label="Urgent Action"
              value={urgentTasks.length}
              subtext="Needs attention"
              iconName={{
                ios: 'flame.fill',
                android: 'schedule',
                web: 'schedule',
              }}
              iconColor="#EF4444"
              iconBgColor={
                isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'
              }
              trend={{
                text: `${completionRate}% Done`,
                isPositive: completionRate >= 50,
                isNeutral: completionRate < 50,
              }}
            />
          </View>
        </View>

        {/* Next Meeting Spotlight */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Next Upcoming Meeting
            </Text>
            <Pressable onPress={() => setMeetingModalVisible(true)}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>
                + Schedule
              </Text>
            </Pressable>
          </View>

          {nextMeeting ? (
            <MeetingCard meeting={nextMeeting} spotlight />
          ) : (
            <View
              style={[
                styles.emptySpotlight,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{
                  ios: 'calendar',
                  android: 'calendar_today',
                  web: 'calendar_today',
                }}
                size={28}
                tintColor={colors.textSecondary}
              />
              <Text
                style={[styles.emptySpotlightTitle, { color: colors.text }]}>
                No upcoming meetings scheduled
              </Text>
              <Text
                style={[
                  styles.emptySpotlightDesc,
                  { color: colors.textSecondary },
                ]}>
                Keep the momentum going by setting up your next sync.
              </Text>
            </View>
          )}
        </View>

        {/* Urgent & Today's Deadlines Spotlight */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithCount}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Focus & Immediate Deadlines
              </Text>
              {urgentOrTodayTasks.length > 0 && (
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: colors.dangerLight },
                  ]}>
                  <Text
                    style={[styles.countBadgeText, { color: colors.danger }]}>
                    {urgentOrTodayTasks.length}
                  </Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => setTaskModalVisible(true)}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>
                + Add Task
              </Text>
            </Pressable>
          </View>

          {urgentOrTodayTasks.length > 0 ? (
            urgentOrTodayTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptySpotlight,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check', web: 'check' }}
                size={28}
                tintColor={colors.success}
              />
              <Text
                style={[styles.emptySpotlightTitle, { color: colors.text }]}>
                All caught up!
              </Text>
              <Text
                style={[
                  styles.emptySpotlightDesc,
                  { color: colors.textSecondary },
                ]}>
                No urgent tasks or deadlines due today. Great job!
              </Text>
            </View>
          )}
        </View>

        {/* Recent LC Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent LC Activity
            </Text>
          </View>

          <View
            style={[
              styles.activityCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            {activities.length > 0 ? (
              activities.map((item, index) => {
                const isLast = index === activities.length - 1;
                const isMeeting = item.activity_type === 'meeting';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.activityItem,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.borderSubtle,
                      },
                    ]}>
                    <View
                      style={[
                        styles.activityIconCircle,
                        {
                          backgroundColor: isMeeting
                            ? isDark
                              ? 'rgba(139, 92, 246, 0.2)'
                              : '#F5F3FF'
                            : isDark
                            ? 'rgba(3, 126, 243, 0.2)'
                            : '#EFF6FF',
                        },
                      ]}>
                      <SymbolView
                        name={
                          isMeeting
                            ? {
                                ios: 'calendar',
                                android: 'calendar_today',
                                web: 'calendar_today',
                              }
                            : {
                                ios: 'checklist',
                                android: 'checklist',
                                web: 'checklist',
                              }
                        }
                        size={14}
                        tintColor={isMeeting ? '#8B5CF6' : colors.primary}
                      />
                    </View>

                    <View style={styles.activityBody}>
                      <View style={styles.activityHeader}>
                        <Text
                          numberOfLines={1}
                          style={[styles.activityTitle, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        <Text
                          style={[
                            styles.activityTime,
                            { color: colors.textSecondary },
                          ]}>
                          {formatTimeAgo(item.created_at)}
                        </Text>
                      </View>

                      {item.description && (
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.activityDesc,
                            { color: colors.textSecondary },
                          ]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text
                style={[
                  styles.emptyActivityText,
                  { color: colors.textSecondary },
                ]}>
                No recent activity recorded yet.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Task Creation Modal */}
      <CreateTaskModal
        visible={taskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onTaskCreated={loadData}
      />

      {/* Meeting Creation Modal */}
      <CreateMeetingModal
        visible={meetingModalVisible}
        onClose={() => setMeetingModalVisible(false)}
        onMeetingCreated={loadData}
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  lcBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lcBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricsCol: {
    flex: 1,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptySpotlight: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptySpotlightTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySpotlightDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  activityDesc: {
    fontSize: 12,
  },
  emptyActivityText: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
  },
});

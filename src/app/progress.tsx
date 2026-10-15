import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Task, Activity, Department } from '@/types/database';
import { getTasks } from '@/services/task-service';
import { getActivities } from '@/services/activity-service';
import { Colors, DepartmentColors } from '@/constants/theme';
import { DepartmentBadge } from '@/components/DepartmentBadge';

const ALL_DEPARTMENTS: Department[] = [
  'oGX',
  'iCX',
  'TM',
  'Finance',
  'Marketing',
  'BD',
  'General',
];

export default function ProgressScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [fetchedTasks, fetchedActivities] = await Promise.all([
        getTasks(),
        getActivities({ limit: 10 }),
      ]);
      setTasks(fetchedTasks);
      setActivities(fetchedActivities);
    } catch (err) {
      console.error('[ProgressScreen] Error loading data:', err);
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

  // Analytics computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const urgentTasks = tasks.filter(
    (t) => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high')
  ).length;

  const overallRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const momentumStatus = useMemo(() => {
    if (overallRate >= 80) {
      return { text: 'High Momentum 🚀', color: colors.success };
    }
    if (overallRate >= 50) {
      return { text: 'On Track ⚡️', color: colors.primary };
    }
    return { text: 'Action Needed ⚠️', color: colors.warning };
  }, [overallRate, colors]);

  // Department statistics
  const departmentStats = useMemo(() => {
    return ALL_DEPARTMENTS.map((dept) => {
      const deptTasks = tasks.filter(
        (t) => t.department.toLowerCase() === dept.toLowerCase()
      );
      const done = deptTasks.filter((t) => t.status === 'completed').length;
      const total = deptTasks.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        dept,
        done,
        total,
        rate,
        pending: total - done,
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [tasks]);

  // Priority distribution
  const priorityStats = useMemo(() => {
    const urgent = tasks.filter((t) => t.priority === 'urgent').length;
    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;

    return [
      { key: 'urgent', label: 'Urgent', count: urgent, color: '#EF4444' },
      { key: 'high', label: 'High', count: high, color: '#F97316' },
      { key: 'medium', label: 'Medium', count: medium, color: '#0284C7' },
      { key: 'low', label: 'Low', count: low, color: '#10B981' },
    ];
  }, [tasks]);

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

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          PERFORMANCE & MOMENTUM
        </Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          LC Bardo Cockpit
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Calculating LC metrics...
          </Text>
        </View>
      ) : (
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
          {/* Hero Performance Score Card */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={[styles.heroScoreLabel, { color: colors.textSecondary }]}>
                  EXECUTION INDEX
                </Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.heroScore, { color: colors.primary }]}>
                    {overallRate}%
                  </Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isDark ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight,
                        borderColor: colors.primary,
                      },
                    ]}>
                    <Text style={[styles.statusPillText, { color: momentumStatus.color }]}>
                      {momentumStatus.text}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.scoreIconBox,
                  { backgroundColor: isDark ? '#1E293B' : colors.primaryLight },
                ]}>
                <SymbolView
                  name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
                  size={26}
                  tintColor={colors.primary}
                />
              </View>
            </View>

            {/* Overall Progress Track */}
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: isDark ? '#1E293B' : colors.backgroundElement },
              ]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${overallRate}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            {/* Metrics Triple Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCol}>
                <Text style={[styles.metricValue, { color: colors.success }]}>
                  {completedTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Completed
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

              <View style={styles.metricCol}>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {inProgressTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  In Progress
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

              <View style={styles.metricCol}>
                <Text style={[styles.metricValue, { color: colors.urgent }]}>
                  {urgentTasks}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Priority Items
                </Text>
              </View>
            </View>
          </View>

          {/* Department Execution Comparison */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Department Progress
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Leaderboard
              </Text>
            </View>

            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              {departmentStats.map((item, idx) => {
                const deptConf =
                  DepartmentColors[item.dept] || DepartmentColors['General'];
                const isLast = idx === departmentStats.length - 1;

                return (
                  <View
                    key={item.dept}
                    style={[
                      styles.deptRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.borderSubtle,
                      },
                    ]}>
                    <View style={styles.deptTop}>
                      <DepartmentBadge department={item.dept} size="sm" />
                      <Text style={[styles.deptRateText, { color: colors.text }]}>
                        {item.rate}%
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View
                      style={[
                        styles.deptBarTrack,
                        { backgroundColor: isDark ? '#1E293B' : colors.backgroundElement },
                      ]}>
                      <View
                        style={[
                          styles.deptBarFill,
                          {
                            width: `${item.rate}%`,
                            backgroundColor: deptConf.color,
                          },
                        ]}
                      />
                    </View>

                    <Text style={[styles.deptSubText, { color: colors.textSecondary }]}>
                      {item.done} of {item.total} tasks completed • {item.pending} remaining
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Priority Distribution Matrix */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Priority Breakdown
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {totalTasks} total tasks
              </Text>
            </View>

            <View style={styles.priorityGrid}>
              {priorityStats.map((p) => {
                const pct =
                  totalTasks > 0 ? Math.round((p.count / totalTasks) * 100) : 0;
                return (
                  <View
                    key={p.key}
                    style={[
                      styles.priorityCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.priorityCardHeader}>
                      <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.priorityCardLabel, { color: colors.textSecondary }]}>
                        {p.label}
                      </Text>
                    </View>
                    <Text style={[styles.priorityCardCount, { color: colors.text }]}>
                      {p.count}
                    </Text>
                    <Text style={[styles.priorityCardPct, { color: p.color }]}>
                      {pct}% of tasks
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Live LC Activity Feed */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                LC Activity Feed
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Real-time
              </Text>
            </View>

            <View
              style={[
                styles.cardBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              {activities.length === 0 ? (
                <View style={styles.emptyActivity}>
                  <Text style={[styles.emptyActivityText, { color: colors.textSecondary }]}>
                    No recent activity logged yet.
                  </Text>
                </View>
              ) : (
                activities.map((act, index) => {
                  const isLast = index === activities.length - 1;
                  const isTask = act.activity_type === 'task';
                  const isMeeting = act.activity_type === 'meeting';

                  return (
                    <View
                      key={act.id}
                      style={[
                        styles.activityItem,
                        !isLast && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.borderSubtle,
                        },
                      ]}>
                      <View
                        style={[
                          styles.activityIconWrap,
                          {
                            backgroundColor: isTask
                              ? isDark
                                ? 'rgba(16, 185, 129, 0.2)'
                                : '#ECFDF5'
                              : isMeeting
                              ? isDark
                                ? 'rgba(3, 126, 243, 0.2)'
                                : '#EFF6FF'
                              : isDark
                              ? '#1E293B'
                              : colors.backgroundElement,
                          },
                        ]}>
                        <SymbolView
                          name={
                            isTask
                              ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                              : isMeeting
                              ? { ios: 'calendar', android: 'event', web: 'event' }
                              : { ios: 'bell.fill', android: 'notifications', web: 'notifications' }
                          }
                          size={14}
                          tintColor={
                            isTask
                              ? colors.success
                              : isMeeting
                              ? colors.primary
                              : colors.textSecondary
                          }
                        />
                      </View>

                      <View style={styles.activityBody}>
                        <View style={styles.activityTopRow}>
                          <Text
                            numberOfLines={1}
                            style={[styles.activityTitle, { color: colors.text }]}>
                            {act.title}
                          </Text>
                          <Text
                            style={[
                              styles.activityTimestamp,
                              { color: colors.textSecondary },
                            ]}>
                            {formatTimeAgo(act.created_at)}
                          </Text>
                        </View>

                        {act.description ? (
                          <Text
                            numberOfLines={2}
                            style={[
                              styles.activityDesc,
                              { color: colors.textSecondary },
                            ]}>
                            {act.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  header: {
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroScore: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scoreIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  metricCol: {
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  sectionWrap: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  deptRow: {
    paddingVertical: 12,
    gap: 6,
  },
  deptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deptRateText: {
    fontSize: 13,
    fontWeight: '800',
  },
  deptBarTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  deptBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  deptSubText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priorityCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  priorityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityCardLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityCardCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  priorityCardPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyActivity: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 13,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 11,
    gap: 10,
  },
  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityBody: {
    flex: 1,
    gap: 2,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  activityTimestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  activityDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});

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
import { PriorityBadge } from '@/components/PriorityBadge';

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

  const overallRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
    });
  }, [tasks]);

  // Priority distribution
  const priorityStats = useMemo(() => {
    const urgent = tasks.filter((t) => t.priority === 'urgent').length;
    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;

    return {
      urgent: { count: urgent, pct: totalTasks > 0 ? Math.round((urgent / totalTasks) * 100) : 0 },
      high: { count: high, pct: totalTasks > 0 ? Math.round((high / totalTasks) * 100) : 0 },
      medium: { count: medium, pct: totalTasks > 0 ? Math.round((medium / totalTasks) * 100) : 0 },
      low: { count: low, pct: totalTasks > 0 ? Math.round((low / totalTasks) * 100) : 0 },
    };
  }, [tasks, totalTasks]);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            LC Bardo Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Execution rate, department breakdown, and activity
          </Text>
        </View>

        {/* Hero Card: Overall Completion Rate */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroRate, { color: colors.primary }]}>
                {overallRate}%
              </Text>
              <Text
                style={[styles.heroSub, { color: colors.textSecondary }]}>
                Overall Task Completion
              </Text>
            </View>

            <View
              style={[
                styles.heroIconCircle,
                { backgroundColor: colors.primaryLight },
              ]}>
              <SymbolView
                name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
                size={24}
                tintColor={colors.primary}
              />
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: colors.backgroundElement },
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

          {/* Quick Stats Triple */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {completedTasks}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.textSecondary }]}>
                Completed
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {inProgressTasks}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.textSecondary }]}>
                In Progress
              </Text>
            </View>

            <View
              style={[
                styles.statDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {pendingTasks}
              </Text>
              <Text
                style={[styles.statLabel, { color: colors.textSecondary }]}>
                Pending
              </Text>
            </View>
          </View>
        </View>

        {/* Department Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Department Execution
          </Text>

          <View
            style={[
              styles.deptCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            {departmentStats.map((item, index) => {
              const isLast = index === departmentStats.length - 1;
              const deptColor =
                DepartmentColors[item.dept]?.color || colors.primary;

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
                  <View style={styles.deptInfoRow}>
                    <DepartmentBadge department={item.dept} size="sm" />
                    <Text
                      style={[
                        styles.deptCounts,
                        { color: colors.textSecondary },
                      ]}>
                      {item.done} of {item.total} done ({item.rate}%)
                    </Text>
                  </View>

                  {/* Horizontal mini bar */}
                  <View
                    style={[
                      styles.deptBarTrack,
                      { backgroundColor: colors.backgroundElement },
                    ]}>
                    <View
                      style={[
                        styles.deptBarFill,
                        {
                          width: `${item.rate}%`,
                          backgroundColor: deptColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Priority Distribution */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Priority Distribution
          </Text>

          <View
            style={[
              styles.priorityCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            {(
              [
                { p: 'urgent' as const, data: priorityStats.urgent, color: '#EF4444' },
                { p: 'high' as const, data: priorityStats.high, color: '#F97316' },
                { p: 'medium' as const, data: priorityStats.medium, color: '#0284C7' },
                { p: 'low' as const, data: priorityStats.low, color: '#10B981' },
              ] as const
            ).map((item, index) => {
              const isLast = index === 3;
              return (
                <View
                  key={item.p}
                  style={[
                    styles.priorityRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.borderSubtle,
                    },
                  ]}>
                  <View style={styles.priorityLabelRow}>
                    <PriorityBadge priority={item.p} size="sm" />
                    <Text
                      style={[
                        styles.priorityValueText,
                        { color: colors.text },
                      ]}>
                      {item.data.count} tasks ({item.data.pct}%)
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.priorityBarTrack,
                      { backgroundColor: colors.backgroundElement },
                    ]}>
                    <View
                      style={[
                        styles.priorityBarFill,
                        {
                          width: `${item.data.pct}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Member Activity Stream */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            LC Action Stream
          </Text>

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
                        styles.activityDot,
                        {
                          backgroundColor: isMeeting
                            ? '#8B5CF6'
                            : colors.primary,
                        },
                      ]}
                    />
                    <View style={styles.activityBody}>
                      <View style={styles.activityTopRow}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.activityTitle,
                            { color: colors.text },
                          ]}>
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
                No actions recorded yet.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
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
  heroCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroRate: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  deptCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  deptRow: {
    paddingVertical: 12,
  },
  deptInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deptCounts: {
    fontSize: 12,
    fontWeight: '600',
  },
  deptBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  deptBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  priorityCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  priorityRow: {
    paddingVertical: 12,
  },
  priorityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priorityValueText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  priorityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  activityCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityBody: {
    flex: 1,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 13,
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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Meeting, MeetingType } from '@/types/database';
import { getMeetings, deleteMeeting } from '@/services/meeting-service';
import { Colors } from '@/constants/theme';
import { MeetingCard } from '@/components/MeetingCard';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';

const MEETING_TYPE_FILTERS: { key: MeetingType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All Meetings', icon: 'tray.full.fill' },
  { key: 'core_team', label: 'EB / Core Team', icon: 'person.3.fill' },
  { key: 'general', label: 'General Assembly (LCM)', icon: 'megaphone.fill' },
  { key: 'departmental', label: 'Department Sync', icon: 'person.2.fill' },
  { key: 'one_on_one', label: '1-on-1 Catchup', icon: 'person.crop.circle' },
];

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function MeetingsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [typeFilter, setTypeFilter] = useState<MeetingType | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const loadMeetings = useCallback(async () => {
    try {
      const data = await getMeetings();
      setMeetings(data);
    } catch (err) {
      console.error('[MeetingsScreen] Failed to load meetings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMeetings();
  };

  const handleDeleteMeeting = (meeting: Meeting) => {
    Alert.alert(
      'Cancel Meeting',
      `Are you sure you want to cancel "${meeting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Meeting',
          style: 'destructive',
          onPress: async () => {
            setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
            await deleteMeeting(meeting.id);
          },
        },
      ]
    );
  };

  const filteredMeetings = useMemo(() => {
    if (typeFilter === 'all') return meetings;
    return meetings.filter((m) => m.meeting_type === typeFilter);
  }, [meetings, typeFilter]);

  const now = useMemo(() => new Date(), []);

  // Separate upcoming from past
  const { spotlightMeeting, todayMeetings, laterMeetings, pastMeetings } = useMemo(() => {
    const sorted = [...filteredMeetings].sort(
      (a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
    );

    const nowMs = now.getTime();
    const upcoming = sorted.filter(
      (m) => new Date(m.meeting_date).getTime() >= nowMs - 1000 * 60 * 60
    );
    const past = sorted
      .filter((m) => new Date(m.meeting_date).getTime() < nowMs - 1000 * 60 * 60)
      .reverse();

    const spotlight = upcoming.length > 0 ? upcoming[0] : null;
    const remainingUpcoming = spotlight ? upcoming.slice(1) : upcoming;

    const todayItems = remainingUpcoming.filter((m) =>
      isSameDay(new Date(m.meeting_date), now)
    );
    const laterItems = remainingUpcoming.filter(
      (m) => !isSameDay(new Date(m.meeting_date), now)
    );

    return {
      spotlightMeeting: spotlight,
      todayMeetings: todayItems,
      laterMeetings: laterItems,
      pastMeetings: past,
    };
  }, [filteredMeetings, now]);

  const handleFilterPress = (filterKey: MeetingType | 'all') => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {}
    }
    setTypeFilter(filterKey);
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            CALENDAR & SYNC
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>LC Meetings</Text>
        </View>

        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.scheduleBtn,
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
          <Text style={styles.scheduleBtnText}>Schedule</Text>
        </Pressable>
      </View>

      {/* Horizontal Filter Bar */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {MEETING_TYPE_FILTERS.map((f) => {
            const isSelected = typeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => handleFilterPress(f.key)}
                style={({ pressed }) => [
                  styles.filterPill,
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
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading meetings...
          </Text>
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
          {filteredMeetings.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{ ios: 'calendar', android: 'event', web: 'event' }}
                size={38}
                tintColor={colors.primary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No scheduled meetings
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap below to schedule an LCM, EB alignment, or departmental sync.
              </Text>
              <Pressable
                onPress={() => setModalVisible(true)}
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
                <Text style={styles.emptyCtaText}>Schedule Meeting</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Spotlight Section */}
              {spotlightMeeting && (
                <View style={styles.sectionWrap}>
                  <MeetingCard
                    meeting={spotlightMeeting}
                    spotlight
                    onDelete={handleDeleteMeeting}
                  />
                </View>
              )}

              {/* Today's Other Meetings */}
              {todayMeetings.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Today ({todayMeetings.length})
                      </Text>
                    </View>
                  </View>
                  {todayMeetings.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onDelete={handleDeleteMeeting}
                    />
                  ))}
                </View>
              )}

              {/* Later Upcoming Meetings */}
              {laterMeetings.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Upcoming ({laterMeetings.length})
                      </Text>
                    </View>
                  </View>
                  {laterMeetings.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onDelete={handleDeleteMeeting}
                    />
                  ))}
                </View>
              )}

              {/* Past Meetings */}
              {pastMeetings.length > 0 && (
                <View style={styles.sectionWrap}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[styles.statusDot, { backgroundColor: colors.textSecondary }]} />
                      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        Past Meetings ({pastMeetings.length})
                      </Text>
                    </View>
                  </View>
                  {pastMeetings.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onDelete={handleDeleteMeeting}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setModalVisible(true)}
        bottomOffset={96}
      />

      {/* Schedule Meeting Modal */}
      <CreateMeetingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onMeetingCreated={loadMeetings}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  scheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterWrap: {
    marginVertical: 6,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 7,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
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
    marginTop: 6,
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

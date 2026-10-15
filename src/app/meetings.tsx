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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Meeting, MeetingType } from '@/types/database';
import { getMeetings, deleteMeeting } from '@/services/meeting-service';
import { Colors } from '@/constants/theme';
import { MeetingCard } from '@/components/MeetingCard';
import { CreateMeetingModal } from '@/components/CreateMeetingModal';

const MEETING_TYPE_FILTERS: { key: MeetingType | 'all'; label: string }[] = [
  { key: 'all', label: 'All Types' },
  { key: 'general', label: 'General' },
  { key: 'departmental', label: 'Department' },
  { key: 'core_team', label: 'EB / Core' },
  { key: 'one_on_one', label: '1-on-1' },
];

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
      'Delete Meeting',
      `Are you sure you want to cancel and delete "${meeting.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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

  // Separate upcoming from past
  const now = new Date();
  const upcomingMeetings = filteredMeetings.filter(
    (m) => new Date(m.meeting_date).getTime() >= now.getTime() - 1000 * 60 * 60
  );
  const pastMeetings = filteredMeetings.filter(
    (m) => new Date(m.meeting_date).getTime() < now.getTime() - 1000 * 60 * 60
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            LC Meetings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {upcomingMeetings.length} upcoming syncs
          </Text>
        </View>

        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.createButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <SymbolView
            name={{
              ios: 'calendar.badge.plus',
              android: 'calendar_today',
              web: 'calendar_today',
            }}
            size={16}
            tintColor="#FFFFFF"
          />
          <Text style={styles.createButtonText}>Schedule</Text>
        </Pressable>
      </View>

      {/* Type Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}>
          {MEETING_TYPE_FILTERS.map((item) => {
            const isSelected = typeFilter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTypeFilter(item.key)}
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

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          {upcomingMeetings.length > 0 ? (
            <View style={styles.groupSection}>
              <Text
                style={[
                  styles.groupTitle,
                  { color: colors.textSecondary },
                ]}>
                UPCOMING
              </Text>
              {upcomingMeetings.map((meeting, index) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  spotlight={index === 0}
                  onDelete={handleDeleteMeeting}
                />
              ))}
            </View>
          ) : null}

          {pastMeetings.length > 0 && (
            <View style={styles.groupSection}>
              <Text
                style={[
                  styles.groupTitle,
                  { color: colors.textSecondary },
                ]}>
                PAST MEETINGS
              </Text>
              {pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onDelete={handleDeleteMeeting}
                />
              ))}
            </View>
          )}

          {filteredMeetings.length === 0 && (
            <View
              style={[
                styles.emptyState,
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
                size={38}
                tintColor={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No meetings found
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {typeFilter !== 'all'
                  ? 'No meetings found for this filter.'
                  : 'No meetings scheduled yet.'}
              </Text>

              <Pressable
                onPress={() => setModalVisible(true)}
                style={[
                  styles.emptyButton,
                  { backgroundColor: colors.primary },
                ]}>
                <Text style={styles.emptyButtonText}>+ Schedule Meeting</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Meeting Modal */}
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
    paddingBottom: 12,
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
  filterSection: {
    marginBottom: 10,
  },
  filterChipsRow: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 90,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyState: {
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
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
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

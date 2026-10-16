import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Linking,
  useColorScheme,
  StyleProp,
  ViewStyle,
  Vibration,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Meeting, MeetingType } from '@/types/database';
import { Colors } from '@/constants/theme';
import { showAlert } from '@/utils/alert';

interface MeetingCardProps {
  meeting: Meeting;
  onPress?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  spotlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TYPE_CONFIG: Record<
  MeetingType,
  { label: string; short: string; color: string; bgLight: string; bgDark: string }
> = {
  general: {
    label: 'General Assembly (LCM)',
    short: 'LCM',
    color: '#037EF3',
    bgLight: '#EFF6FF',
    bgDark: '#172554',
  },
  departmental: {
    label: 'Department Sync',
    short: 'Dept Sync',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgDark: '#2E1065',
  },
  core_team: {
    label: 'EB / Core Team',
    short: 'EB Meeting',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    bgDark: '#451A03',
  },
  one_on_one: {
    label: '1-on-1 Catchup',
    short: '1-on-1',
    color: '#10B981',
    bgLight: '#ECFDF5',
    bgDark: '#064E3B',
  },
};

export function MeetingCard({
  meeting,
  onPress,
  onDelete,
  spotlight = false,
  style,
}: MeetingCardProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const typeConfig = TYPE_CONFIG[meeting.meeting_type] || TYPE_CONFIG.general;

  const meetingDate = new Date(meeting.meeting_date);
  const now = new Date();

  // Time & relative date
  const timeStr = meetingDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isToday = meetingDate.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = meetingDate.toDateString() === tomorrow.toDateString();

  const dateLabel = isToday
    ? `Today at ${timeStr}`
    : isTomorrow
    ? `Tomorrow at ${timeStr}`
    : `${meetingDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })} at ${timeStr}`;

  // Time remaining countdown
  const diffMinutes = Math.round(
    (meetingDate.getTime() - now.getTime()) / (1000 * 60)
  );

  let countdownText = '';
  let countdownTone: 'urgent' | 'warning' | 'info' | 'normal' = 'normal';

  if (diffMinutes <= 0 && diffMinutes > -120) {
    countdownText = 'Ongoing Now';
    countdownTone = 'urgent';
  } else if (diffMinutes > 0 && diffMinutes <= 15) {
    countdownText = `Starts in ${diffMinutes}m`;
    countdownTone = 'urgent';
  } else if (diffMinutes > 15 && diffMinutes <= 60) {
    countdownText = `In ${diffMinutes} mins`;
    countdownTone = 'warning';
  } else if (diffMinutes > 60 && diffMinutes <= 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    countdownText = mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
    countdownTone = 'info';
  } else if (isToday) {
    countdownText = `Today at ${timeStr}`;
    countdownTone = 'info';
  }

  const handleOpenLink = async () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(15);
      } catch {}
    }

    if (!meeting.link) {
      showAlert(
        'No Meeting Link',
        'This meeting does not have a virtual link attached.'
      );
      return;
    }
    const url = meeting.link.startsWith('http')
      ? meeting.link
      : `https://${meeting.link}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      showAlert('Unable to open link', `Could not open: ${url}`);
    }
  };

  const isVirtual =
    !!meeting.link ||
    (meeting.location && meeting.location.toLowerCase().includes('meet')) ||
    (meeting.location && meeting.location.toLowerCase().includes('online'));

  if (spotlight) {
    return (
      <Pressable
        onPress={() => onPress?.(meeting)}
        style={({ pressed }) => [
          styles.spotlightContainer,
          {
            backgroundColor: isDark ? '#141D2C' : '#FFFFFF',
            borderColor: colors.primary,
            opacity: pressed ? 0.96 : 1,
          },
          style,
        ]}>
        {/* Spotlight top bar */}
        <View style={styles.spotlightTopBar}>
          <View style={styles.spotlightBadgeRow}>
            <View
              style={[
                styles.spotlightPill,
                { backgroundColor: colors.primary },
              ]}>
              <View style={styles.pulseDot} />
              <Text style={styles.spotlightPillText}>NEXT UP</Text>
            </View>

            <View
              style={[
                styles.typePill,
                {
                  backgroundColor: isDark ? typeConfig.bgDark : typeConfig.bgLight,
                },
              ]}>
              <Text style={[styles.typePillText, { color: typeConfig.color }]}>
                {typeConfig.short}
              </Text>
            </View>
          </View>

          {/* Countdown Pill */}
          {countdownText ? (
            <View
              style={[
                styles.countdownPill,
                {
                  backgroundColor:
                    countdownTone === 'urgent'
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.25)'
                        : colors.dangerLight
                      : countdownTone === 'warning'
                      ? isDark
                        ? 'rgba(245, 158, 11, 0.25)'
                        : colors.warningLight
                      : isDark
                      ? 'rgba(3, 126, 243, 0.2)'
                      : colors.primaryLight,
                },
              ]}>
              <SymbolView
                name={{ ios: 'timer', android: 'timer', web: 'timer' }}
                size={11}
                tintColor={
                  countdownTone === 'urgent'
                    ? colors.danger
                    : countdownTone === 'warning'
                    ? colors.warning
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.countdownText,
                  {
                    color:
                      countdownTone === 'urgent'
                        ? colors.danger
                        : countdownTone === 'warning'
                        ? colors.warning
                        : colors.primary,
                  },
                ]}>
                {countdownText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={[styles.spotlightTitle, { color: colors.text }]}>
          {meeting.title}
        </Text>

        {/* Date & Location Rows */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <SymbolView
              name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
              size={13}
              tintColor={colors.primary}
            />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {dateLabel}
            </Text>
          </View>

          {meeting.location ? (
            <View style={styles.metaItem}>
              <SymbolView
                name={
                  isVirtual
                    ? { ios: 'video.fill', android: 'videocam', web: 'videocam' }
                    : { ios: 'mappin.and.ellipse', android: 'place', web: 'place' }
                }
                size={13}
                tintColor={colors.primary}
              />
              <Text
                numberOfLines={1}
                style={[styles.metaText, { color: colors.textSecondary, maxWidth: 160 }]}>
                {meeting.location}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 1-tap Join Meeting button */}
        {meeting.link ? (
          <Pressable
            hitSlop={6}
            onPress={handleOpenLink}
            style={({ pressed }) => [
              styles.joinButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
              size={15}
              tintColor="#FFFFFF"
            />
            <Text style={styles.joinButtonText}>Join Meeting</Text>
            <SymbolView
              name={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
              size={12}
              tintColor="#FFFFFF"
            />
          </Pressable>
        ) : null}
      </Pressable>
    );
  }

  // Standard Meeting Card
  return (
    <Pressable
      onPress={() => onPress?.(meeting)}
      onLongPress={() => onDelete?.(meeting)}
      style={({ pressed }) => [
        styles.standardCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
        style,
      ]}>
      {/* Top row: Type badge & actions */}
      <View style={styles.standardHeader}>
        <View style={styles.typeBadgeRow}>
          <View
            style={[
              styles.typePill,
              {
                backgroundColor: isDark ? typeConfig.bgDark : typeConfig.bgLight,
              },
            ]}>
            <Text style={[styles.typePillText, { color: typeConfig.color }]}>
              {typeConfig.label}
            </Text>
          </View>

          {Boolean(countdownText) && (
            <View
              style={[
                styles.countdownPill,
                {
                  backgroundColor:
                    countdownTone === 'urgent'
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.25)'
                        : colors.dangerLight
                      : isDark
                      ? 'rgba(3, 126, 243, 0.15)'
                      : colors.primaryLight,
                },
              ]}>
              <Text
                style={[
                  styles.countdownText,
                  {
                    color:
                      countdownTone === 'urgent' ? colors.danger : colors.primary,
                  },
                ]}>
                {countdownText}
              </Text>
            </View>
          )}
        </View>

        {onDelete && (
          <Pressable
            hitSlop={8}
            onPress={() => onDelete(meeting)}
            style={({ pressed }) => [
              styles.deleteBtn,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={12}
              tintColor={colors.danger}
            />
          </Pressable>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.standardTitle, { color: colors.text }]}>
        {meeting.title}
      </Text>

      {/* Description snippet */}
      {meeting.description ? (
        <Text
          numberOfLines={2}
          style={[styles.standardDesc, { color: colors.textSecondary }]}>
          {meeting.description}
        </Text>
      ) : null}

      {/* Footer Info Row */}
      <View style={styles.standardFooter}>
        <View style={styles.metaItem}>
          <SymbolView
            name={{ ios: 'calendar', android: 'event', web: 'event' }}
            size={12}
            tintColor={colors.primary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {dateLabel}
          </Text>
        </View>

        {meeting.location ? (
          <View style={styles.metaItem}>
            <SymbolView
              name={{ ios: 'mappin', android: 'place', web: 'place' }}
              size={12}
              tintColor={colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: colors.textSecondary, maxWidth: 130 }]}>
              {meeting.location}
            </Text>
          </View>
        ) : null}

        {meeting.link ? (
          <Pressable
            hitSlop={8}
            onPress={handleOpenLink}
            style={({ pressed }) => [
              styles.quickJoinPill,
              {
                backgroundColor: isDark ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight,
                borderColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'video.fill', android: 'videocam', web: 'videocam' }}
              size={11}
              tintColor={colors.primary}
            />
            <Text style={[styles.quickJoinText, { color: colors.primary }]}>Join</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  spotlightContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#037EF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  spotlightTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spotlightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spotlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  spotlightPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
  spotlightTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  // Standard Card
  standardCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  standardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  standardDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 10,
  },
  standardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickJoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  quickJoinText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Linking,
  Alert,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Meeting, MeetingType } from '@/types/database';
import { Colors } from '@/constants/theme';

interface MeetingCardProps {
  meeting: Meeting;
  onPress?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  spotlight?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TYPE_CONFIG: Record<
  MeetingType,
  { label: string; color: string; bgLight: string; bgDark: string }
> = {
  general: {
    label: 'General Assembly',
    color: '#037EF3',
    bgLight: '#EFF6FF',
    bgDark: '#172554',
  },
  departmental: {
    label: 'Department Sync',
    color: '#8B5CF6',
    bgLight: '#F5F3FF',
    bgDark: '#2E1065',
  },
  core_team: {
    label: 'EB / Core Team',
    color: '#F59E0B',
    bgLight: '#FFFBEB',
    bgDark: '#451A03',
  },
  one_on_one: {
    label: '1-on-1 Catchup',
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

  const isToday =
    meetingDate.toDateString() === now.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    meetingDate.toDateString() === tomorrow.toDateString();

  const dateLabel = isToday
    ? `Today, ${timeStr}`
    : isTomorrow
    ? `Tomorrow, ${timeStr}`
    : `${meetingDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}, ${timeStr}`;

  // Time remaining
  const diffMinutes = Math.round(
    (meetingDate.getTime() - now.getTime()) / (1000 * 60)
  );

  let countdownText = '';
  let isImminent = false;

  if (diffMinutes > 0 && diffMinutes <= 60) {
    countdownText = `Starts in ${diffMinutes}m`;
    isImminent = true;
  } else if (diffMinutes > 60 && diffMinutes <= 1440) {
    const hours = Math.floor(diffMinutes / 60);
    countdownText = `In ${hours}h`;
  } else if (diffMinutes < 0 && diffMinutes > -120) {
    countdownText = 'Ongoing';
    isImminent = true;
  }

  const handleOpenLink = async () => {
    if (!meeting.link) {
      Alert.alert('No Meeting Link', 'This meeting does not have an online link attached.');
      return;
    }
    const url = meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link', `Could not open: ${url}`);
    }
  };

  return (
    <Pressable
      onPress={() => onPress?.(meeting)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: spotlight
            ? isDark
              ? 'rgba(3, 126, 243, 0.12)'
              : '#F0F7FF'
            : colors.card,
          borderColor: spotlight ? colors.primary : colors.border,
          opacity: pressed ? 0.95 : 1,
        },
        style,
      ]}>
      {/* Top row: Type badge, countdown, delete */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isDark
                ? typeConfig.bgDark
                : typeConfig.bgLight,
            },
          ]}>
          <Text style={[styles.typeText, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>

        {countdownText ? (
          <View
            style={[
              styles.countdownBadge,
              {
                backgroundColor: isImminent
                  ? colors.urgent
                  : colors.backgroundElement,
              },
            ]}>
            <Text
              style={[
                styles.countdownText,
                { color: isImminent ? '#FFFFFF' : colors.textSecondary },
              ]}>
              {countdownText}
            </Text>
          </View>
        ) : null}

        {onDelete && (
          <Pressable
            hitSlop={8}
            onPress={() => onDelete(meeting)}
            style={styles.deleteBtn}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={14}
              tintColor={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Meeting Title */}
      <Text style={[styles.title, { color: colors.text }]}>{meeting.title}</Text>

      {/* Description if present */}
      {meeting.description && (
        <Text
          numberOfLines={2}
          style={[styles.description, { color: colors.textSecondary }]}>
          {meeting.description}
        </Text>
      )}

      {/* Details Row: Date & Location */}
      <View style={styles.metaContainer}>
        <View style={styles.metaRow}>
          <SymbolView
            name={{
              ios: 'clock.fill',
              android: 'schedule',
              web: 'schedule',
            }}
            size={14}
            tintColor={colors.primary}
          />
          <Text style={[styles.metaText, { color: colors.text }]}>
            {dateLabel}
          </Text>
        </View>

        {meeting.location && (
          <View style={styles.metaRow}>
            <SymbolView
              name={{
                ios: 'location.fill',
                android: 'location_on',
                web: 'location_on',
              }}
              size={14}
              tintColor={colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[styles.metaText, { color: colors.textSecondary }]}>
              {meeting.location}
            </Text>
          </View>
        )}
      </View>

      {/* Action button if meet link exists */}
      {meeting.link && (
        <Pressable
          onPress={handleOpenLink}
          style={({ pressed }) => [
            styles.joinButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <SymbolView
            name={{
              ios: 'video.fill',
              android: 'videocam',
              web: 'videocam',
            }}
            size={16}
            tintColor="#FFFFFF"
          />
          <Text style={styles.joinButtonText}>
            Join via Google Meet
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
    marginLeft: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaContainer: {
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 2,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

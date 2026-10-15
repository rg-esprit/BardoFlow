import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { MeetingType, NewMeetingInput } from '@/types/database';
import { createMeeting } from '@/services/meeting-service';
import { Colors } from '@/constants/theme';

interface CreateMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onMeetingCreated: () => void;
}

const MEETING_TYPES: { type: MeetingType; label: string; desc: string }[] = [
  {
    type: 'general',
    label: 'General Assembly',
    desc: 'All LC Bardo members',
  },
  {
    type: 'departmental',
    label: 'Department Sync',
    desc: 'Functional team sync',
  },
  {
    type: 'core_team',
    label: 'EB / Core Team',
    desc: 'Executive Board',
  },
  {
    type: 'one_on_one',
    label: '1-on-1 Catchup',
    desc: 'Individual coaching / check-in',
  },
];

export function CreateMeetingModal({
  visible,
  onClose,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('general');
  const [timePreset, setTimePreset] = useState<
    'today_eve' | 'tomorrow_eve' | 'saturday' | 'next_week'
  >('today_eve');
  const [location, setLocation] = useState('Google Meet');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMeetingType('general');
    setTimePreset('today_eve');
    setLocation('Google Meet');
    setLink('');
    setError(null);
  };

  const calculateMeetingDate = (): string => {
    const now = new Date();
    if (timePreset === 'today_eve') {
      now.setHours(18, 0, 0, 0);
      if (now.getTime() < Date.now()) {
        now.setHours(20, 0, 0, 0);
      }
      return now.toISOString();
    }
    if (timePreset === 'tomorrow_eve') {
      const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      d.setHours(18, 30, 0, 0);
      return d.toISOString();
    }
    if (timePreset === 'saturday') {
      const d = new Date();
      const day = d.getDay();
      const diffToSat = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diffToSat);
      d.setHours(10, 0, 0, 0);
      return d.toISOString();
    }
    if (timePreset === 'next_week') {
      const d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      d.setHours(19, 0, 0, 0);
      return d.toISOString();
    }
    return new Date().toISOString();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const input: NewMeetingInput = {
        title: title.trim(),
        description: description.trim() || null,
        meeting_type: meetingType,
        meeting_date: calculateMeetingDate(),
        location: location.trim() || 'Online',
        link: link.trim() || null,
        status: 'scheduled',
      };

      await createMeeting(input);
      resetForm();
      onMeetingCreated();
      onClose();
    } catch (err: any) {
      console.error('[CreateMeetingModal] Failed to schedule meeting:', err);
      setError(err?.message || 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Schedule LC Meeting
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Sync, plan, and execute together
              </Text>
            </View>

            <Pressable
              hitSlop={12}
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.backgroundElement },
              ]}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={16}
                tintColor={colors.textSecondary}
              />
            </Pressable>
          </View>

          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.dangerLight },
              ]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Title */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Meeting Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="e.g., Weekly EB Sync & OKR Review"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Meeting Type */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Meeting Type
            </Text>
            <View style={styles.typeGrid}>
              {MEETING_TYPES.map((item) => {
                const isSelected = meetingType === item.type;
                return (
                  <Pressable
                    key={item.type}
                    onPress={() => setMeetingType(item.type)}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(3, 126, 243, 0.2)'
                            : '#EFF6FF'
                          : colors.backgroundElement,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.typeCardTitle,
                        {
                          color: isSelected ? colors.primary : colors.text,
                        },
                      ]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeCardDesc,
                        { color: colors.textSecondary },
                      ]}>
                      {item.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Date / Time Presets */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Date & Time Preset
            </Text>
            <View style={styles.presetsRow}>
              {[
                { key: 'today_eve', label: 'Today (18:00)' },
                { key: 'tomorrow_eve', label: 'Tomorrow (18:30)' },
                { key: 'saturday', label: 'Saturday (10:00 AM)' },
                { key: 'next_week', label: 'Next Week (19:00)' },
              ].map((item) => {
                const isSelected = timePreset === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      setTimePreset(item.key as typeof timePreset)
                    }
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.backgroundElement,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.presetChipText,
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
            </View>

            {/* Location */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Location / Platform
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Google Meet, Salle Bardo, Co-working"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Google Meet / Video Link */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Meeting Link (Google Meet / Zoom)
            </Text>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="e.g., https://meet.google.com/abc-defg-hij"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
              style={[
                styles.input,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Description / Agenda */}
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Agenda / Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Meeting agenda, topics, preparation requirements..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.backgroundElement,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            {/* Submit Button */}
            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isSubmitting ? 0.7 : pressed ? 0.9 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <SymbolView
                    name={{
                      ios: 'calendar.badge.plus',
                      android: 'calendar_today',
                      web: 'calendar_today',
                    }}
                    size={18}
                    tintColor="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>Schedule Meeting</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  typeCardDesc: {
    fontSize: 11,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 22,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

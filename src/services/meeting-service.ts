import { Meeting, MeetingFilter, NewMeetingInput } from '@/types/database';
import { logActivity } from './activity-service';
import { INITIAL_MEETINGS } from './mock-data';
import { supabase } from './supabase';

function loadLocalMeetings(): Meeting[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('bardoflow_meetings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [...INITIAL_MEETINGS];
}

function saveLocalMeetings(meetings: Meeting[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('bardoflow_meetings', JSON.stringify(meetings));
    } catch {}
  }
}

let fallbackMeetings: Meeting[] = loadLocalMeetings();

function generateId(): string {
  return 'mtg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

function mergeMeetings(existing: Meeting[], incoming: Meeting[]): Meeting[] {
  const map = new Map<string, Meeting>();
  for (const m of existing) {
    map.set(m.id, m);
  }
  for (const m of incoming) {
    map.set(m.id, m);
  }
  return Array.from(map.values());
}

function filterMeetings(meetings: Meeting[], filter?: MeetingFilter): Meeting[] {
  let result = [...meetings];

  if (filter?.status && filter.status !== 'all') {
    result = result.filter((m) => m.status === filter.status);
  }

  if (filter?.meeting_type && filter.meeting_type !== 'all') {
    result = result.filter((m) => m.meeting_type === filter.meeting_type);
  }

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    result = result.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.location && m.location.toLowerCase().includes(q))
    );
  }

  // Sort ascending by meeting_date (upcoming first)
  result.sort(
    (a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
  );

  return result;
}

/**
 * Fetch meetings with optional filters and safe offline fallback
 */
export async function getMeetings(filter?: MeetingFilter): Promise<Meeting[]> {
  try {
    let query = supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: true });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }
    if (filter?.meeting_type && filter.meeting_type !== 'all') {
      query = query.eq('meeting_type', filter.meeting_type);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn('[MeetingService] Supabase getMeetings failed, using fallback:', error?.message);
      return filterMeetings(fallbackMeetings, filter);
    }

    const typed = data as Meeting[];
    const hasActiveFilter = Boolean(
      (filter?.status && filter.status !== 'all') ||
      (filter?.meeting_type && filter.meeting_type !== 'all') ||
      (filter?.searchQuery && filter.searchQuery.trim().length > 0)
    );

    if (!hasActiveFilter || typed.length === 0) {
      fallbackMeetings = typed;
    } else {
      fallbackMeetings = mergeMeetings(fallbackMeetings, typed);
    }

    return filterMeetings(typed, filter);
  } catch (err) {
    console.warn('[MeetingService] Network error during getMeetings, using fallback:', err);
    return filterMeetings(fallbackMeetings, filter);
  }
}

/**
 * Get single meeting by ID
 */
export async function getMeetingById(id: string): Promise<Meeting | null> {
  try {
    const { data, error } = await supabase.from('meetings').select('*').eq('id', id).single();
    if (error || !data) {
      const local = fallbackMeetings.find((m) => m.id === id);
      return local || null;
    }
    return data as Meeting;
  } catch {
    const local = fallbackMeetings.find((m) => m.id === id);
    return local || null;
  }
}

/**
 * Schedule a new meeting in Supabase with safe offline fallback
 */
export async function createMeeting(meeting: NewMeetingInput): Promise<Meeting> {
  const payload = {
    title: meeting.title.trim(),
    description: meeting.description?.trim() || null,
    meeting_date: meeting.meeting_date,
    location: meeting.location?.trim() || null,
    meeting_type: meeting.meeting_type || 'general',
    status: meeting.status || 'scheduled',
    link: meeting.link?.trim() || null,
  };

  try {
    const { data, error } = await supabase
      .from('meetings')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.warn('[MeetingService] Supabase createMeeting failed, saving locally:', error?.message);
      const fallbackMeeting: Meeting = {
        id: generateId(),
        ...payload,
        created_at: new Date().toISOString(),
      };
      fallbackMeetings = [fallbackMeeting, ...fallbackMeetings];
      saveLocalMeetings(fallbackMeetings);

      logActivity(
        `Meeting Scheduled: ${fallbackMeeting.title}`,
        `Location: ${fallbackMeeting.location || 'Online'} (${fallbackMeeting.meeting_type})`,
        'meeting'
      ).catch(() => {});

      return fallbackMeeting;
    }

    const created = data as Meeting;
    fallbackMeetings = [created, ...fallbackMeetings.filter((m) => m.id !== created.id)];
    saveLocalMeetings(fallbackMeetings);

    logActivity(
      `Meeting Scheduled: ${created.title}`,
      `Location: ${created.location || 'Online'} (${created.meeting_type})`,
      'meeting'
    ).catch(() => {});

    return created;
  } catch (err) {
    console.warn('[MeetingService] Network error during createMeeting, saving locally:', err);
    const fallbackMeeting: Meeting = {
      id: generateId(),
      ...payload,
      created_at: new Date().toISOString(),
    };
    fallbackMeetings = [fallbackMeeting, ...fallbackMeetings];
    saveLocalMeetings(fallbackMeetings);

    logActivity(
      `Meeting Scheduled: ${fallbackMeeting.title}`,
      `Location: ${fallbackMeeting.location || 'Online'} (${fallbackMeeting.meeting_type})`,
      'meeting'
    ).catch(() => {});

    return fallbackMeeting;
  }
}

/**
 * Update an existing meeting by ID in Supabase with safe offline fallback
 */
export async function updateMeeting(
  id: string,
  updates: Partial<Meeting>
): Promise<Meeting> {
  const payload: Record<string, any> = { ...updates };
  delete payload.id;
  delete payload.created_at;

  try {
    const { data, error } = await supabase
      .from('meetings')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[MeetingService] Supabase updateMeeting failed, updating locally:', error?.message);
      const index = fallbackMeetings.findIndex((m) => m.id === id);
      if (index !== -1) {
        fallbackMeetings[index] = {
          ...fallbackMeetings[index],
          ...updates,
        };
        saveLocalMeetings(fallbackMeetings);
        return fallbackMeetings[index];
      }
      throw new Error(`Meeting with ID ${id} not found`);
    }

    const updated = data as Meeting;
    fallbackMeetings = fallbackMeetings.map((m) => (m.id === id ? updated : m));
    saveLocalMeetings(fallbackMeetings);
    return updated;
  } catch (err) {
    console.warn('[MeetingService] Network error during updateMeeting, updating locally:', err);
    const index = fallbackMeetings.findIndex((m) => m.id === id);
    if (index !== -1) {
      fallbackMeetings[index] = {
        ...fallbackMeetings[index],
        ...updates,
      };
      saveLocalMeetings(fallbackMeetings);
      return fallbackMeetings[index];
    }
    throw err;
  }
}

/**
 * Delete a meeting by ID
 */
export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) {
      console.warn('[MeetingService] Supabase deleteMeeting failed, updating local state:', error.message);
    }
    fallbackMeetings = fallbackMeetings.filter((m) => m.id !== id);
    saveLocalMeetings(fallbackMeetings);
    return true;
  } catch (err) {
    console.warn('[MeetingService] Network error during deleteMeeting, updating local state:', err);
    fallbackMeetings = fallbackMeetings.filter((m) => m.id !== id);
    saveLocalMeetings(fallbackMeetings);
    return true;
  }
}

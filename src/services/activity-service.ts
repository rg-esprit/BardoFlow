import { Activity, ActivityFilter, ActivityType } from '@/types/database';
import { INITIAL_ACTIVITIES } from './mock-data';
import { supabase } from './supabase';

function loadLocalActivities(): Activity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem('bardoflow_activities');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [...INITIAL_ACTIVITIES];
}

function saveLocalActivities(activities: Activity[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('bardoflow_activities', JSON.stringify(activities));
    } catch {}
  }
}

let fallbackActivities: Activity[] = loadLocalActivities();

function generateId(): string {
  return 'act-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

function filterActivities(activities: Activity[], filter?: ActivityFilter): Activity[] {
  let result = [...activities];

  if (filter?.activity_type && filter.activity_type !== 'all') {
    result = result.filter((a) => a.activity_type === filter.activity_type);
  }

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }

  // Sort descending by created_at
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filter?.limit && filter.limit > 0) {
    result = result.slice(0, filter.limit);
  }

  return result;
}

/**
 * Fetch activities with optional filtering and automatic fallback
 */
export async function getActivities(filter?: ActivityFilter): Promise<Activity[]> {
  try {
    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter?.limit && filter.limit > 0) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn('[ActivityService] Supabase fetch failed, falling back to local data:', error?.message);
      return filterActivities(fallbackActivities, filter);
    }

    const typedData = data as Activity[];
    // Sync with fallback cache
    fallbackActivities = typedData;
    return filterActivities(typedData, filter);
  } catch (err) {
    console.warn('[ActivityService] Network error during getActivities, using fallback:', err);
    return filterActivities(fallbackActivities, filter);
  }
}

/**
 * Log a new activity record to Supabase with fallback to local store
 */
export async function logActivity(
  title: string,
  description?: string,
  activityType: ActivityType | string = 'general'
): Promise<Activity> {
  const payload = {
    title,
    description: description || null,
    activity_type: activityType,
  };

  try {
    const { data, error } = await supabase
      .from('activities')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.warn('[ActivityService] Supabase logActivity failed, saving locally:', error?.message);
      const fallbackItem: Activity = {
        id: generateId(),
        title,
        description: description || null,
        activity_type: activityType,
        created_at: new Date().toISOString(),
      };
      fallbackActivities = [fallbackItem, ...fallbackActivities];
      saveLocalActivities(fallbackActivities);
      return fallbackItem;
    }

    const created = data as Activity;
    fallbackActivities = [created, ...fallbackActivities.filter((a) => a.id !== created.id)];
    saveLocalActivities(fallbackActivities);
    return created;
  } catch (err) {
    console.warn('[ActivityService] Network error during logActivity, saving locally:', err);
    const fallbackItem: Activity = {
      id: generateId(),
      title,
      description: description || null,
      activity_type: activityType,
      created_at: new Date().toISOString(),
    };
    fallbackActivities = [fallbackItem, ...fallbackActivities];
    saveLocalActivities(fallbackActivities);
    return fallbackItem;
  }
}

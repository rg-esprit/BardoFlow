import { NewTaskInput, Task, TaskFilter, TaskPriority, TaskStatus } from '@/types/database';
import { logActivity } from './activity-service';
import { INITIAL_TASKS } from './mock-data';
import { supabase } from './supabase';

let fallbackTasks: Task[] = [...INITIAL_TASKS];

function generateId(): string {
  return 'tsk-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
}

function mergeTasks(existing: Task[], incoming: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of existing) {
    map.set(t.id, t);
  }
  for (const t of incoming) {
    map.set(t.id, t);
  }
  return Array.from(map.values());
}

function filterTasks(tasks: Task[], filter?: TaskFilter): Task[] {
  let result = [...tasks];

  if (filter?.status && filter.status !== 'all') {
    result = result.filter((t) => t.status === filter.status);
  }

  if (filter?.department && filter.department !== 'all') {
    result = result.filter(
      (t) => t.department.toLowerCase() === filter.department?.toLowerCase()
    );
  }

  if (filter?.priority && filter.priority !== 'all') {
    result = result.filter((t) => t.priority === filter.priority);
  }

  if (filter?.assignee && filter.assignee.trim().length > 0) {
    const q = filter.assignee.toLowerCase().trim();
    result = result.filter(
      (t) => t.assignee_name && t.assignee_name.toLowerCase().includes(q)
    );
  }

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(q)) ||
        t.department.toLowerCase().includes(q)
    );
  }

  // Priority ranking
  const priorityWeight: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Sort: completed tasks last, otherwise priority desc, then deadline asc
  result.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    const diffWeight = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (diffWeight !== 0) return diffWeight;

    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return result;
}

/**
 * Fetch all tasks matching optional filters, with safe offline fallback
 */
export async function getTasks(filter?: TaskFilter): Promise<Task[]> {
  try {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }
    if (filter?.department && filter.department !== 'all') {
      query = query.eq('department', filter.department);
    }
    if (filter?.priority && filter.priority !== 'all') {
      query = query.eq('priority', filter.priority);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.warn('[TaskService] Supabase getTasks failed, using fallback:', error?.message);
      return filterTasks(fallbackTasks, filter);
    }

    const typed = data as Task[];
    fallbackTasks = mergeTasks(fallbackTasks, typed);
    return filterTasks(typed, filter);
  } catch (err) {
    console.warn('[TaskService] Network error during getTasks, using fallback:', err);
    return filterTasks(fallbackTasks, filter);
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error || !data) {
      const local = fallbackTasks.find((t) => t.id === id);
      return local || null;
    }
    return data as Task;
  } catch {
    const local = fallbackTasks.find((t) => t.id === id);
    return local || null;
  }
}

/**
 * Create a new task in Supabase with safe offline fallback
 */
export async function createTask(task: NewTaskInput): Promise<Task> {
  const payload = {
    title: task.title.trim(),
    description: task.description?.trim() || null,
    deadline: task.deadline || null,
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    department: task.department || 'General',
    assignee_name: task.assignee_name?.trim() || null,
  };

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.warn('[TaskService] Supabase createTask failed, saving locally:', error?.message);
      const nowStr = new Date().toISOString();
      const fallbackTask: Task = {
        id: generateId(),
        ...payload,
        created_at: nowStr,
        updated_at: nowStr,
      };
      fallbackTasks = [fallbackTask, ...fallbackTasks];

      logActivity(
        `Created task: ${fallbackTask.title}`,
        `Assigned to ${fallbackTask.assignee_name || 'Unassigned'} in ${fallbackTask.department}`,
        'task'
      ).catch(() => {});

      return fallbackTask;
    }

    const created = data as Task;
    fallbackTasks = [created, ...fallbackTasks.filter((t) => t.id !== created.id)];

    logActivity(
      `Created task: ${created.title}`,
      `Assigned to ${created.assignee_name || 'Unassigned'} in ${created.department}`,
      'task'
    ).catch(() => {});

    return created;
  } catch (err) {
    console.warn('[TaskService] Network error during createTask, saving locally:', err);
    const nowStr = new Date().toISOString();
    const fallbackTask: Task = {
      id: generateId(),
      ...payload,
      created_at: nowStr,
      updated_at: nowStr,
    };
    fallbackTasks = [fallbackTask, ...fallbackTasks];

    logActivity(
      `Created task: ${fallbackTask.title}`,
      `Assigned to ${fallbackTask.assignee_name || 'Unassigned'} in ${fallbackTask.department}`,
      'task'
    ).catch(() => {});

    return fallbackTask;
  }
}

/**
 * Update task by ID in Supabase with safe offline fallback
 */
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const payload: Record<string, any> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  delete payload.id;
  delete payload.created_at;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.warn('[TaskService] Supabase updateTask failed, updating locally:', error?.message);
      const index = fallbackTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        fallbackTasks[index] = {
          ...fallbackTasks[index],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return fallbackTasks[index];
      }
      throw new Error(`Task with ID ${id} not found`);
    }

    const updated = data as Task;
    fallbackTasks = fallbackTasks.map((t) => (t.id === id ? updated : t));
    return updated;
  } catch (err) {
    console.warn('[TaskService] Network error during updateTask, updating locally:', err);
    const index = fallbackTasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      fallbackTasks[index] = {
        ...fallbackTasks[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return fallbackTasks[index];
    }
    throw err;
  }
}

/**
 * Toggle task completion status between completed and pending/in_progress
 */
export async function toggleTaskComplete(
  id: string,
  currentStatus: Task['status']
): Promise<Task> {
  const newStatus: TaskStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const updated = await updateTask(id, { status: newStatus });

  const actionText = newStatus === 'completed' ? 'Task Completed' : 'Task Reopened';
  logActivity(
    `${actionText}: ${updated.title}`,
    `Status marked as ${newStatus}`,
    'task'
  ).catch(() => {});

  return updated;
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.warn('[TaskService] Supabase deleteTask failed, updating local state:', error.message);
    }
    fallbackTasks = fallbackTasks.filter((t) => t.id !== id);
    return true;
  } catch (err) {
    console.warn('[TaskService] Network error during deleteTask, updating local state:', err);
    fallbackTasks = fallbackTasks.filter((t) => t.id !== id);
    return true;
  }
}

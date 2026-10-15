export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type Department =
  | 'oGX'
  | 'iCX'
  | 'TM'
  | 'Finance'
  | 'Marketing'
  | 'BD'
  | 'General'
  | string;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  department: Department;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingType = 'general' | 'departmental' | 'core_team' | 'one_on_one';
export type MeetingStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  location: string | null;
  meeting_type: MeetingType;
  status: MeetingStatus;
  link: string | null;
  created_at: string;
}

export type ActivityType = 'task' | 'meeting' | 'general' | string;

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  activity_type: ActivityType;
  created_at: string;
}

export interface NewTaskInput {
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  department?: Department;
  assignee_name?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  department?: Department;
  assignee_name?: string | null;
}

export interface TaskFilter {
  status?: TaskStatus | 'all';
  department?: Department | 'all';
  priority?: TaskPriority | 'all';
  searchQuery?: string;
  assignee?: string;
}

export interface NewMeetingInput {
  title: string;
  description?: string | null;
  meeting_date: string;
  location?: string | null;
  meeting_type?: MeetingType;
  status?: MeetingStatus;
  link?: string | null;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string | null;
  meeting_date?: string;
  location?: string | null;
  meeting_type?: MeetingType;
  status?: MeetingStatus;
  link?: string | null;
}

export interface MeetingFilter {
  status?: MeetingStatus | 'all';
  meeting_type?: MeetingType | 'all';
  searchQuery?: string;
}

export interface NewActivityInput {
  title: string;
  description?: string | null;
  activity_type?: ActivityType;
}

export interface ActivityFilter {
  activity_type?: ActivityType | 'all';
  searchQuery?: string;
  limit?: number;
}

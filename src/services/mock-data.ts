import { Activity, Meeting, Task } from '@/types/database';

function getRelativeDate(daysOffset: number, hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-seed-1',
    title: 'Prepare Induction session slides for new recruits',
    description: 'Design onboarding deck covering AIESEC values, Bardo LC structure, and the 24.25 roadmap.',
    deadline: getRelativeDate(0, 18, 0), // Today 18:00
    priority: 'high',
    status: 'in_progress',
    department: 'TM',
    assignee_name: 'Yasmine Ben Salem',
    created_at: getRelativeDate(-1, 10, 0),
    updated_at: getRelativeDate(0, 9, 30),
  },
  {
    id: 'tsk-seed-2',
    title: 'Follow up with exchange participants for Summer Peak',
    description: 'Conduct preparation interviews and verify visa documentation for approved candidates going to Brazil and Italy.',
    deadline: getRelativeDate(0, 20, 0), // Today 20:00
    priority: 'urgent',
    status: 'pending',
    department: 'oGX',
    assignee_name: 'Mohamed Aziz Trabelsi',
    created_at: getRelativeDate(-2, 14, 0),
    updated_at: getRelativeDate(-1, 11, 0),
  },
  {
    id: 'tsk-seed-3',
    title: 'Submit monthly financial audit report',
    description: 'Compile receipts, bank statements, and LC balance sheet for Q3 national audit review.',
    deadline: getRelativeDate(1, 17, 0), // Tomorrow 17:00
    priority: 'high',
    status: 'in_progress',
    department: 'Finance',
    assignee_name: 'Sarra Gharbi',
    created_at: getRelativeDate(-2, 16, 0),
    updated_at: getRelativeDate(0, 8, 45),
  },
  {
    id: 'tsk-seed-4',
    title: 'Design recruitment promo posters & reels',
    description: 'Create Instagram stories, reels, and campus flyers for the Spring Recruitment Drive.',
    deadline: getRelativeDate(2, 19, 0), // In 2 days
    priority: 'medium',
    status: 'pending',
    department: 'Marketing',
    assignee_name: 'Ahmed Karray',
    created_at: getRelativeDate(-1, 15, 0),
    updated_at: getRelativeDate(-1, 15, 0),
  },
  {
    id: 'tsk-seed-5',
    title: 'Confirm venue for General Assembly',
    description: 'Finalize reservation with the youth center in Bardo and test sound/projector equipment.',
    deadline: getRelativeDate(3, 14, 0), // In 3 days
    priority: 'urgent',
    status: 'pending',
    department: 'General',
    assignee_name: 'Mariem Louati',
    created_at: getRelativeDate(-3, 12, 0),
    updated_at: getRelativeDate(-1, 16, 30),
  },
  {
    id: 'tsk-seed-6',
    title: 'Partnership pitch with local startup incubator',
    description: 'Schedule meeting with The Dot / Cogite representatives to secure co-working passes and event sponsorship.',
    deadline: getRelativeDate(4, 11, 0),
    priority: 'medium',
    status: 'pending',
    department: 'BD',
    assignee_name: 'Skander Jaziri',
    created_at: getRelativeDate(-2, 9, 0),
    updated_at: getRelativeDate(-2, 9, 0),
  },
  {
    id: 'tsk-seed-7',
    title: 'Organize incoming exchange trainees welcome package',
    description: 'Prepare local SIM cards, transport cards, and welcome guides for incoming interns arriving next week.',
    deadline: getRelativeDate(5, 16, 0),
    priority: 'medium',
    status: 'in_progress',
    department: 'iCX',
    assignee_name: 'Nourhene Ayari',
    created_at: getRelativeDate(-1, 18, 0),
    updated_at: getRelativeDate(0, 10, 0),
  },
  {
    id: 'tsk-seed-8',
    title: 'Review LC constitution and bylaws update',
    description: 'Draft amendments for the upcoming election cycle and consult MC VP Legal.',
    deadline: getRelativeDate(0, 12, 0),
    priority: 'low',
    status: 'completed',
    department: 'General',
    assignee_name: 'Youssef Chaabane',
    created_at: getRelativeDate(-4, 11, 0),
    updated_at: getRelativeDate(0, 11, 30),
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'mtg-seed-1',
    title: 'Weekly Executive Board Meeting',
    description: 'Review weekly KPIs across oGX, iCX, and TM. Budget allocation review for recruitment campaign.',
    meeting_date: getRelativeDate(0, 18, 30), // Today 18:30
    location: 'Bardo Youth Hub',
    meeting_type: 'core_team',
    status: 'scheduled',
    link: 'https://meet.google.com/xyz-bardo-eb',
    created_at: getRelativeDate(-2, 10, 0),
  },
  {
    id: 'mtg-seed-2',
    title: 'Talent Management Sync',
    description: 'Bi-weekly sync on member engagement scores, attendance tracking, and buddy system feedback.',
    meeting_date: getRelativeDate(1, 18, 0), // Tomorrow 18:00
    location: 'Online - Google Meet',
    meeting_type: 'departmental',
    status: 'scheduled',
    link: 'https://meet.google.com/tm-sync-bardo',
    created_at: getRelativeDate(-1, 16, 0),
  },
  {
    id: 'mtg-seed-3',
    title: 'Local Committee Meeting (LCM)',
    description: 'Monthly general assembly for all Bardo members. Department recognitions, announcements, and team activities.',
    meeting_date: getRelativeDate(3, 15, 0), // In 3 days
    location: 'Amphithéâtre Bardo Center',
    meeting_type: 'general',
    status: 'scheduled',
    link: 'https://meet.google.com/lcm-bardo-2026',
    created_at: getRelativeDate(-4, 14, 0),
  },
  {
    id: 'mtg-seed-4',
    title: 'Partnership Pitch with Local Sponsor',
    description: 'Exploratory partnership meeting with Bardo Tech Hub for event co-hosting and branding.',
    meeting_date: getRelativeDate(4, 14, 0),
    location: 'Bardo Tech Hub Offices',
    meeting_type: 'one_on_one',
    status: 'scheduled',
    link: 'https://meet.google.com/pitch-sponsor-2026',
    created_at: getRelativeDate(-2, 12, 0),
  },
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-seed-1',
    title: 'Task Completed: Constitution Review',
    description: 'Youssef Chaabane completed "Review LC constitution and bylaws update"',
    activity_type: 'task',
    created_at: getRelativeDate(0, -2, 0), // 2 hours ago
  },
  {
    id: 'act-seed-2',
    title: 'Executive Board Meeting Scheduled',
    description: 'Weekly Executive Board Meeting scheduled for today at Bardo Youth Hub',
    activity_type: 'meeting',
    created_at: getRelativeDate(0, -5, 0), // 5 hours ago
  },
  {
    id: 'act-seed-3',
    title: 'Task in Progress: Financial Audit',
    description: 'Sarra Gharbi moved "Submit monthly financial audit report" to in_progress',
    activity_type: 'task',
    created_at: getRelativeDate(-1, 14, 0),
  },
  {
    id: 'act-seed-4',
    title: 'Recruitment Campaign Launched',
    description: 'Spring Recruitment campaign kicked off on social media channels.',
    activity_type: 'general',
    created_at: getRelativeDate(-2, 10, 0),
  },
];

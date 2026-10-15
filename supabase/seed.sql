-- BardoFlow Seed Data
-- Strictly isolated in the `bardoflow` schema per AGENTS.md rules

INSERT INTO bardoflow.tasks (title, description, deadline, priority, status, department, assignee_name)
VALUES
('Prepare Induction session slides for new recruits', 'Design onboarding deck covering AIESEC values, Bardo LC structure, and the 24.25 roadmap.', now() + interval '3 days', 'high', 'in_progress', 'TM', 'Yasmine Ben Salem'),
('Follow up with exchange participants for Summer Peak', 'Conduct preparation interviews and verify visa documentation for approved candidates going to Brazil and Italy.', now() + interval '5 days', 'urgent', 'pending', 'oGX', 'Mohamed Aziz Trabelsi'),
('Submit monthly financial audit report', 'Compile receipts, bank statements, and LC balance sheet for Q3 national audit review.', now() + interval '2 days', 'high', 'in_progress', 'Finance', 'Sarra Gharbi'),
('Design recruitment promo posters & reels', 'Create Instagram stories, reels, and campus flyers for the Spring Recruitment Drive.', now() + interval '4 days', 'medium', 'pending', 'Marketing', 'Ahmed Karray'),
('Confirm venue for General Assembly', 'Finalize reservation with the youth center in Bardo and test sound/projector equipment.', now() + interval '7 days', 'urgent', 'pending', 'General', 'Mariem Louati'),
('Partnership pitch with local startup incubator', 'Schedule meeting with The Dot / Cogite representatives to secure co-working passes and event sponsorship.', now() + interval '8 days', 'medium', 'pending', 'BD', 'Skander Jaziri'),
('Organize incoming exchange trainees welcome package', 'Prepare local SIM cards, transport cards, and welcome guides for incoming interns arriving next week.', now() + interval '6 days', 'medium', 'in_progress', 'iCX', 'Nourhene Ayari'),
('Review LC constitution and bylaws update', 'Draft amendments for the upcoming election cycle and consult MC VP Legal.', now() + interval '12 days', 'low', 'completed', 'General', 'Youssef Chaabane');

INSERT INTO bardoflow.meetings (title, description, meeting_date, location, meeting_type, status, link)
VALUES
('Weekly Executive Board Meeting', 'Review weekly KPIs across oGX, iCX, and TM. Budget allocation review for recruitment campaign.', now() + interval '1 day' + interval '2 hours', 'Bardo Youth Hub', 'core_team', 'scheduled', 'https://meet.google.com/xyz-bardo-eb'),
('Local Committee Meeting (LCM)', 'Monthly general assembly for all Bardo members. Department recognitions, announcements, and team activities.', now() + interval '4 days' + interval '4 hours', 'Amphithéâtre Bardo Center', 'general', 'scheduled', 'https://meet.google.com/lcm-bardo-2026'),
('Talent Management Sync', 'Bi-weekly sync on member engagement scores, attendance tracking, and buddy system feedback.', now() + interval '2 days' + interval '1 hour', 'Online - Google Meet', 'departmental', 'scheduled', 'https://meet.google.com/tm-sync-bardo'),
('Partnership Pitch with Local Sponsor', 'Exploratory partnership meeting with Bardo Tech Hub for event co-hosting and branding.', now() + interval '3 days' + interval '3 hours', 'Bardo Tech Hub Offices', 'one_on_one', 'scheduled', 'https://meet.google.com/pitch-sponsor-2026');

INSERT INTO bardoflow.activities (title, description, activity_type, created_at)
VALUES
('Recruitment Campaign Launched', 'Spring Recruitment campaign kicked off on social media channels.', 'general', now() - interval '2 days'),
('Task in Progress: Financial Audit', 'Sarra Gharbi moved "Submit monthly financial audit report" to in_progress', 'task', now() - interval '1 day'),
('Executive Board Meeting Scheduled', 'Weekly Executive Board Meeting scheduled for tomorrow at Bardo Youth Hub', 'meeting', now() - interval '6 hours'),
('Task Completed: Constitution Review', 'Youssef Chaabane completed "Review LC constitution and bylaws update"', 'task', now() - interval '2 hours');

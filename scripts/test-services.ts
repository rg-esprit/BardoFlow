import {
  getTasks,
  createTask,
  updateTask,
  toggleTaskComplete,
  deleteTask,
} from '../src/services/task-service';
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../src/services/meeting-service';
import {
  getActivities,
  logActivity,
} from '../src/services/activity-service';

async function runTests() {
  console.log('--- 1. Testing Task Service ---');
  const tasks = await getTasks();
  console.log(`Fetched ${tasks.length} tasks successfully.`);
  if (tasks.length === 0) throw new Error('Expected tasks to exist');

  const pendingTasks = await getTasks({ status: 'pending' });
  console.log(`Filtered ${pendingTasks.length} pending tasks.`);

  const newTask = await createTask({
    title: 'Automated Test Task',
    description: 'Verifying end-to-end task creation in BardoFlow',
    priority: 'high',
    department: 'TM',
    assignee_name: 'Test Runner',
  });
  console.log('Created task with ID:', newTask.id, 'status:', newTask.status);

  const updatedTask = await updateTask(newTask.id, {
    description: 'Updated test description',
  });
  console.log('Updated task description:', updatedTask.description);

  const toggledTask = await toggleTaskComplete(newTask.id, updatedTask.status);
  console.log('Toggled task status to:', toggledTask.status);
  if (toggledTask.status !== 'completed') {
    throw new Error('Expected toggled status to be completed');
  }

  const deleted = await deleteTask(newTask.id);
  console.log('Deleted test task:', deleted);

  console.log('\n--- 2. Testing Meeting Service ---');
  const meetings = await getMeetings();
  console.log(`Fetched ${meetings.length} meetings successfully.`);

  const newMeeting = await createMeeting({
    title: 'Automated Test Sync',
    meeting_date: new Date(Date.now() + 86400000).toISOString(),
    location: 'Virtual Room',
    meeting_type: 'core_team',
    link: 'https://meet.google.com/test-room',
  });
  console.log('Created meeting with ID:', newMeeting.id);

  const updatedMeeting = await updateMeeting(newMeeting.id, {
    location: 'Updated Conference Room Bardo',
  });
  console.log('Updated meeting location:', updatedMeeting.location);

  await deleteMeeting(newMeeting.id);
  console.log('Cleaned up test meeting.');

  console.log('\n--- 3. Testing Activity Service ---');
  const activities = await getActivities();
  console.log(`Fetched ${activities.length} activities.`);

  const logged = await logActivity(
    'Automated Verification Passed',
    'Task 2 test suite successfully executed all operations',
    'general'
  );
  console.log('Logged new activity:', logged.id, logged.title);

  console.log('\n✅ ALL SERVICE TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

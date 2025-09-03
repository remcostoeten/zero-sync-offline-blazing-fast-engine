import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import {
  setupEnterpriseDatabase,
  createUser,
  getUsers,
  createProject,
  getProjects,
  updateProjectStatus,
  createTask,
  getTasks,
  updateTaskStatus,
  logTimeEntry,
  getTimeEntries,
  addComment,
  getComments,
  logAuditAction,
  getAuditLog,
  syncAllData,
  getSyncStatus,
  generateProjectReport,
  generateUserWorkloadReport,
  populateDemoData
} from './enterprise-app';

// Load environment variables
dotenv.config();

// Utility function to simulate delays
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility function to print section headers
function printSectionHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 ${title}`);
  console.log('='.repeat(60));
}

// Utility function to print subsection headers
function printSubsectionHeader(title: string) {
  console.log('\n' + '─'.repeat(50));
  console.log(`📋 ${title}`);
  console.log('─'.repeat(50));
}

// Demo 1: Complete User Onboarding Workflow
async function demoUserOnboarding() {
  printSectionHeader('USER ONBOARDING WORKFLOW');
  
  console.log('🎭 Simulating a new employee onboarding process...');
  await delay(1000);
  
  // Create new employee
  console.log('\n👤 Creating new employee: Sarah Chen');
  await createUser('schen', 'sarah.chen@company.com', 'Sarah Chen', 'employee', 'Engineering');
  await delay(500);
  
  // Create new manager
  console.log('\n👤 Creating new manager: David Rodriguez');
  await createUser('drodriguez', 'david.rodriguez@company.com', 'David Rodriguez', 'manager', 'Product');
  await delay(500);
  
  // Create new admin
  console.log('\n👤 Creating new admin: Lisa Thompson');
  await createUser('lthompson', 'lisa.thompson@company.com', 'Lisa Thompson', 'admin', 'IT');
  await delay(500);
  
  console.log('✅ User onboarding completed successfully!');
}

// Demo 2: Project Lifecycle Management
async function demoProjectLifecycle() {
  printSectionHeader('PROJECT LIFECYCLE MANAGEMENT');
  
  console.log('🎭 Simulating a complete project lifecycle...');
  await delay(1000);
  
  // Get users for project assignment
  const users = await getUsers();
  const manager = users.find((u: any) => u.role === 'manager');
  const developer = users.find((u: any) => u.role === 'employee' && u.department === 'Engineering');
  const designer = users.find((u: any) => u.role === 'employee' && u.department === 'Design');
  
  if (!manager || !developer || !designer) {
    console.log('❌ Required users not found for project demo');
    return;
  }
  
  // Phase 1: Project Planning
  printSubsectionHeader('Phase 1: Project Planning');
  console.log('📋 Creating new project: "Customer Portal Redesign"');
  await createProject(
    'Customer Portal Redesign',
    'Modernize the customer-facing portal with improved UX and mobile responsiveness',
    'planning',
    'high',
    manager.id,
    75000,
    '2025-01-15',
    '2025-07-31'
  );
  await delay(500);
  
  // Get the created project
  const projects = await getProjects();
  const customerPortalProject = projects.find((p: any) => p.name.includes('Customer Portal'));
  
  if (!customerPortalProject) {
    console.log('❌ Project not found');
    return;
  }
  
  // Phase 2: Task Creation and Assignment
  printSubsectionHeader('Phase 2: Task Creation and Assignment');
  console.log('✅ Creating project tasks...');
  
  await createTask(
    'User Research and Personas',
    'Conduct user interviews and create detailed personas for target users',
    customerPortalProject.id,
    designer.id,
    'high',
    24,
    '2025-02-15'
  );
  await delay(300);
  
  await createTask(
    'Wireframe Design',
    'Create low-fidelity wireframes for all portal pages',
    customerPortalProject.id,
    designer.id,
    'high',
    32,
    '2025-02-28'
  );
  await delay(300);
  
  await createTask(
    'Frontend Architecture',
    'Design the frontend architecture and component structure',
    customerPortalProject.id,
    developer.id,
    'critical',
    40,
    '2025-03-15'
  );
  await delay(300);
  
  await createTask(
    'API Integration',
    'Integrate with existing backend APIs and create new endpoints',
    customerPortalProject.id,
    developer.id,
    'critical',
    48,
    '2025-04-01'
  );
  await delay(300);
  
  // Phase 3: Project Activation
  printSubsectionHeader('Phase 3: Project Activation');
  console.log('🔄 Activating project...');
  await updateProjectStatus(customerPortalProject.id, 'active');
  await delay(500);
  
  // Phase 4: Task Progress Updates
  printSubsectionHeader('Phase 4: Task Progress Updates');
  console.log('🔄 Updating task progress...');
  
  const tasks = await getTasks(customerPortalProject.id);
  const researchTask = tasks.find((t: any) => t.title.includes('User Research'));
  const wireframeTask = tasks.find((t: any) => t.title.includes('Wireframe'));
  
  if (researchTask) {
    await updateTaskStatus(researchTask.id, 'done', 22);
    console.log('✅ User Research task completed (22 hours)');
  }
  
  if (wireframeTask) {
    await updateTaskStatus(wireframeTask.id, 'in-progress', 18);
    console.log('🔄 Wireframe Design task in progress (18 hours)');
  }
  
  await delay(500);
  
  console.log('✅ Project lifecycle demo completed successfully!');
}

// Demo 3: Time Tracking and Collaboration
async function demoTimeTrackingAndCollaboration() {
  printSectionHeader('TIME TRACKING AND COLLABORATION');
  
  console.log('🎭 Simulating team collaboration and time tracking...');
  await delay(1000);
  
  // Get users and tasks
  const users = await getUsers();
  const projects = await getProjects();
  const tasks = await getTasks();
  
  const developer = users.find((u: any) => u.role === 'employee' && u.department === 'Engineering');
  const designer = users.find((u: any) => u.role === 'employee' && u.department === 'Design');
  const project = projects[0];
  
  if (!developer || !designer || !project || tasks.length === 0) {
    console.log('❌ Required data not found for time tracking demo');
    return;
  }
  
  // Time tracking simulation
  printSubsectionHeader('Time Tracking Simulation');
  console.log('⏱️  Logging time entries for team members...');
  
  // Developer time entries
  await logTimeEntry(developer.id, tasks[0].id, project.id, '2025-01-20', 8, 'Frontend development and component building');
  await delay(200);
  await logTimeEntry(developer.id, tasks[0].id, project.id, '2025-01-21', 7.5, 'API integration and testing');
  await delay(200);
  await logTimeEntry(developer.id, tasks[0].id, project.id, '2025-01-22', 6, 'Bug fixes and code review');
  await delay(200);
  
  // Designer time entries
  await logTimeEntry(designer.id, tasks[1].id, project.id, '2025-01-20', 6, 'User research and persona creation');
  await delay(200);
  await logTimeEntry(designer.id, tasks[1].id, project.id, '2025-01-21', 8, 'Wireframe design and iteration');
  await delay(200);
  
  console.log('✅ Time tracking completed');
  
  // Collaboration simulation
  printSubsectionHeader('Team Collaboration');
  console.log('💬 Adding team comments and feedback...');
  
  await addComment('Great work on the user research! The personas are very detailed.', developer.id, project.id);
  await delay(200);
  await addComment('Thanks! The wireframes are coming along nicely too.', designer.id, project.id);
  await delay(200);
  await addComment('Looking forward to seeing the final designs!', developer.id, project.id);
  await delay(200);
  
  console.log('✅ Collaboration demo completed successfully!');
}

// Demo 4: Reporting and Analytics
async function demoReportingAndAnalytics() {
  printSectionHeader('REPORTING AND ANALYTICS');
  
  console.log('🎭 Generating comprehensive reports...');
  await delay(1000);
  
  const projects = await getProjects();
  const users = await getUsers();
  
  if (projects.length === 0 || users.length === 0) {
    console.log('❌ No data available for reporting demo');
    return;
  }
  
  // Project Report
  printSubsectionHeader('Project Performance Report');
  const projectReport = await generateProjectReport(projects[0].id);
  
  if (projectReport) {
    console.log(`📊 Project: ${projectReport.project.name}`);
    console.log(`📈 Status: ${projectReport.project.status}`);
    console.log(`🎯 Priority: ${projectReport.project.priority}`);
    console.log(`💰 Budget: $${projectReport.project.budget?.toLocaleString() || 'N/A'}`);
    console.log(`✅ Tasks: ${projectReport.summary.completedTasks}/${projectReport.summary.totalTasks} completed`);
    console.log(`⏱️  Hours: ${projectReport.summary.totalActualHours}/${projectReport.summary.totalEstimatedHours} estimated`);
    console.log(`📊 Completion Rate: ${projectReport.summary.completionRate}%`);
    console.log(`⏰ Time Variance: ${projectReport.summary.timeVariance}h`);
    console.log(`💬 Comments: ${projectReport.summary.totalComments}`);
    console.log(`📝 Time Entries: ${projectReport.summary.totalTimeEntries}`);
  }
  
  await delay(1000);
  
  // User Workload Report
  printSubsectionHeader('User Workload Analysis');
  const employee = users.find((u: any) => u.role === 'employee');
  
  if (employee) {
    const workloadReport = await generateUserWorkloadReport(employee.id);
    
    if (workloadReport) {
      console.log(`👤 User: ${workloadReport.user.full_name}`);
      console.log(`🏢 Role: ${workloadReport.user.role}`);
      console.log(`📁 Department: ${workloadReport.user.department || 'N/A'}`);
      console.log(`📋 Total Assigned Tasks: ${workloadReport.workload.totalAssignedTasks}`);
      console.log(`🔄 Active Tasks: ${workloadReport.workload.activeTasks}`);
      console.log(`✅ Completed Tasks: ${workloadReport.workload.completedTasks}`);
      console.log(`⏱️  Total Hours: ${workloadReport.workload.totalHours}`);
      console.log(`📊 Average Hours Per Day: ${workloadReport.workload.averageHoursPerDay}`);
    }
  }
  
  await delay(1000);
  
  console.log('✅ Reporting and analytics demo completed successfully!');
}

// Demo 5: Offline Sync and Conflict Resolution
async function demoOfflineSyncAndConflictResolution() {
  printSectionHeader('OFFLINE SYNC AND CONFLICT RESOLUTION');
  
  console.log('🎭 Demonstrating offline capabilities and sync management...');
  await delay(1000);
  
  // Show current sync status
  printSubsectionHeader('Current Sync Status');
  const syncStatus = await getSyncStatus();
  
  console.log('📊 Database Sync Status:');
  for (const [table, status] of Object.entries(syncStatus)) {
    const syncIcon = status.unsynced > 0 ? '⏳' : '✅';
    console.log(`${syncIcon} ${table}: ${status.synced}/${status.total} synced (${status.unsynced} pending)`);
  }
  
  await delay(1000);
  
  // Simulate offline work
  printSubsectionHeader('Simulating Offline Work');
  console.log('🌐 Simulating network disconnection...');
  await delay(1000);
  
  console.log('📝 Creating data while offline...');
  
  // Create offline data
  const users = await getUsers();
  const projects = await getProjects();
  
  if (users.length > 0 && projects.length > 0) {
    const user = users[0];
    const project = projects[0];
    
    // Create offline task
    await createTask(
      'Offline Created Task',
      'This task was created while the application was offline',
      project.id,
      user.id,
      'medium',
      16,
      '2025-02-15'
    );
    
    // Create offline comment
    await addComment('This comment was added offline and will sync later!', user.id, project.id);
    
    // Log offline time
    await logTimeEntry(user.id, 1, project.id, '2025-01-23', 4, 'Working offline on new features');
    
    console.log('✅ Offline data created successfully');
  }
  
  await delay(1000);
  
  // Show updated sync status
  printSubsectionHeader('Updated Sync Status (After Offline Work)');
  const updatedSyncStatus = await getSyncStatus();
  
  console.log('📊 Updated Database Sync Status:');
  for (const [table, status] of Object.entries(updatedSyncStatus)) {
    const syncIcon = status.unsynced > 0 ? '⏳' : '✅';
    console.log(`${syncIcon} ${table}: ${status.synced}/${status.total} synced (${status.unsynced} pending)`);
  }
  
  await delay(1000);
  
  // Simulate reconnection and sync
  printSubsectionHeader('Reconnecting and Syncing');
  console.log('🌐 Simulating network reconnection...');
  await delay(1000);
  
  console.log('🔄 Starting data synchronization...');
  const syncSuccess = await syncAllData();
  
  if (syncSuccess) {
    console.log('✅ All data synchronized successfully!');
  } else {
    console.log('⚠️  Some data may still be pending sync');
  }
  
  await delay(1000);
  
  // Final sync status
  printSubsectionHeader('Final Sync Status');
  const finalSyncStatus = await getSyncStatus();
  
  console.log('📊 Final Database Sync Status:');
  for (const [table, status] of Object.entries(finalSyncStatus)) {
    const syncIcon = status.unsynced > 0 ? '⏳' : '✅';
    console.log(`${syncIcon} ${table}: ${status.synced}/${status.total} synced (${status.unsynced} pending)`);
  }
  
  console.log('✅ Offline sync and conflict resolution demo completed successfully!');
}

// Demo 6: Audit Trail and Compliance
async function demoAuditTrailAndCompliance() {
  printSectionHeader('AUDIT TRAIL AND COMPLIANCE');
  
  console.log('🎭 Demonstrating comprehensive audit logging...');
  await delay(1000);
  
  // Show audit log
  printSubsectionHeader('Recent Audit Log');
  const auditLog = await getAuditLog();
  
  console.log('📝 Recent System Activities:');
  console.log('─'.repeat(100));
  console.log('ID  | Action | Table        | User ID | Record ID | Timestamp');
  console.log('─'.repeat(100));
  
  // Show last 10 audit entries
  const recentEntries = auditLog.slice(0, 10);
  recentEntries.forEach((entry: any) => {
    const table = entry.table_name.padEnd(13);
    const user = entry.user_id || 'System';
    const userDisplay = user.toString().padEnd(8);
    const record = entry.record_id || 'N/A';
    const recordDisplay = record.toString().padEnd(9);
    const timestamp = entry.created_at.substring(0, 19);
    console.log(`${entry.id.toString().padEnd(3)} | ${entry.action.padEnd(6)} | ${table} | ${userDisplay} | ${recordDisplay} | ${timestamp}`);
  });
  
  await delay(1000);
  
  // Demonstrate audit trail for specific actions
  printSubsectionHeader('Audit Trail for User Actions');
  console.log('🔍 Tracking specific user actions...');
  
  const userActions = auditLog.filter((entry: any) => entry.table_name === 'users');
  console.log(`📊 Total user-related actions: ${userActions.length}`);
  
  const createActions = userActions.filter((entry: any) => entry.action === 'CREATE');
  const updateActions = userActions.filter((entry: any) => entry.action === 'UPDATE');
  
  console.log(`👤 User creation actions: ${createActions.length}`);
  console.log(`🔄 User update actions: ${updateActions.length}`);
  
  await delay(1000);
  
  console.log('✅ Audit trail and compliance demo completed successfully!');
}

// Main demo function
async function runCompleteDemo() {
  console.log('🎬 TURSO ENTERPRISE APPLICATION COMPLETE DEMO');
  console.log('='.repeat(60));
  console.log('This comprehensive demo showcases all features of the enterprise application');
  console.log('including offline sync, project management, time tracking, and more.');
  console.log('='.repeat(60));
  
  // Check if environment variables are set
  if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log('⚠️  Environment variables not set. Please create a .env file with:');
    console.log('   TURSO_SYNC_URL=your_sync_url_here');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
    return;
  }

  try {
    console.log('\n🏗️  Setting up enterprise database...');
    await setupEnterpriseDatabase();
    console.log('✅ Database setup complete');
    
    await delay(1000);
    
    // Run all demos
    await demoUserOnboarding();
    await delay(1000);
    
    await demoProjectLifecycle();
    await delay(1000);
    
    await demoTimeTrackingAndCollaboration();
    await delay(1000);
    
    await demoReportingAndAnalytics();
    await delay(1000);
    
    await demoOfflineSyncAndConflictResolution();
    await delay(1000);
    
    await demoAuditTrailAndCompliance();
    
    // Final summary
    printSectionHeader('DEMO COMPLETION SUMMARY');
    console.log('🎉 All enterprise application features have been demonstrated!');
    console.log('\n📊 Final System Overview:');
    
    const users = await getUsers();
    const projects = await getProjects();
    const tasks = await getTasks();
    const timeEntries = await getTimeEntries();
    const comments = await getComments();
    
    console.log(`👥 Users: ${users.length}`);
    console.log(`📋 Projects: ${projects.length}`);
    console.log(`✅ Tasks: ${tasks.length}`);
    console.log(`⏱️  Time Entries: ${timeEntries.length}`);
    console.log(`💬 Comments: ${comments.length}`);
    
    console.log('\n🚀 The application is now ready for production use with:');
    console.log('   • Full offline capabilities');
    console.log('   • Automatic sync when online');
    console.log('   • Comprehensive audit logging');
    console.log('   • Advanced reporting and analytics');
    console.log('   • Multi-user collaboration features');
    console.log('   • Project and task management');
    console.log('   • Time tracking and billing');
    
    console.log('\n🎯 You can now:');
    console.log('   • Run the interactive CLI: npm run cli');
    console.log('   • Run the enterprise app: npm run enterprise');
    console.log('   • Explore individual features in the source code');
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runCompleteDemo().catch(console.error);
}

export { runCompleteDemo };

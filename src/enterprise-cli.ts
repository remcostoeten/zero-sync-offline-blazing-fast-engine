import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import * as readline from 'readline';
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to prompt user
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Utility function to display menu
function displayMenu() {
  console.log('\n🏢 Enterprise Application CLI');
  console.log('=============================');
  console.log('1.  👥 User Management');
  console.log('2.  📋 Project Management');
  console.log('3.  ✅ Task Management');
  console.log('4.  ⏱️  Time Tracking');
  console.log('5.  💬 Collaboration');
  console.log('6.  📊 Reports & Analytics');
  console.log('7.  🔄 Sync Management');
  console.log('8.  📝 Audit Log');
  console.log('9.  🎭 Populate Demo Data');
  console.log('0.  🚪 Exit');
  console.log('─'.repeat(50));
}

// User Management Menu
async function userManagementMenu() {
  while (true) {
    console.log('\n👥 User Management');
    console.log('1. Create User');
    console.log('2. List Users');
    console.log('3. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await createUserCLI();
        break;
      case '2':
        await listUsersCLI();
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function createUserCLI() {
  try {
    const username = await askQuestion('Username: ');
    const email = await askQuestion('Email: ');
    const fullName = await askQuestion('Full Name: ');
    const role = await askQuestion('Role (admin/manager/employee/viewer): ');
    const department = await askQuestion('Department (optional): ');
    
    const success = await createUser(username, email, fullName, role, department);
    if (success) {
      console.log('✅ User created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

async function listUsersCLI() {
  try {
    const users = await getUsers();
    console.log('\n👥 Users:');
    console.log('─'.repeat(80));
    console.log('ID  | Username      | Full Name           | Role      | Department');
    console.log('─'.repeat(80));
    
    users.forEach((user: any) => {
      console.log(`${user.id.toString().padEnd(3)} | ${user.username.padEnd(13)} | ${user.full_name.padEnd(19)} | ${user.role.padEnd(9)} | ${user.department || 'N/A'}`);
    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

// Project Management Menu
async function projectManagementMenu() {
  while (true) {
    console.log('\n📋 Project Management');
    console.log('1. Create Project');
    console.log('2. List Projects');
    console.log('3. Update Project Status');
    console.log('4. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await createProjectCLI();
        break;
      case '2':
        await listProjectsCLI();
        break;
      case '3':
        await updateProjectStatusCLI();
        break;
      case '4':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function createProjectCLI() {
  try {
    const name = await askQuestion('Project Name: ');
    const description = await askQuestion('Description: ');
    const status = await askQuestion('Status (planning/active/on-hold/completed/cancelled): ');
    const priority = await askQuestion('Priority (low/medium/high/critical): ');
    const managerId = parseInt(await askQuestion('Manager ID: '));
    const budget = parseFloat(await askQuestion('Budget (optional): ') || '0');
    const startDate = await askQuestion('Start Date (YYYY-MM-DD, optional): ');
    const endDate = await askQuestion('End Date (YYYY-MM-DD, optional): ');
    
    const success = await createProject(name, description, status, priority, managerId, budget, startDate || undefined, endDate || undefined);
    if (success) {
      console.log('✅ Project created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating project:', error);
  }
}

async function listProjectsCLI() {
  try {
    const projects = await getProjects();
    console.log('\n📋 Projects:');
    console.log('─'.repeat(100));
    console.log('ID  | Name                    | Status    | Priority  | Manager           | Budget   ');
    console.log('─'.repeat(100));
    
    projects.forEach((project: any) => {
      const name = project.name.length > 22 ? project.name.substring(0, 19) + '...' : project.name.padEnd(22);
      const manager = project.manager_name || 'Unassigned';
      const managerDisplay = manager.length > 17 ? manager.substring(0, 14) + '...' : manager.padEnd(17);
      console.log(`${project.id.toString().padEnd(3)} | ${name} | ${project.status.padEnd(9)} | ${project.priority.padEnd(9)} | ${managerDisplay} | $${(project.budget || 0).toLocaleString().padEnd(8)}`);
    });
  } catch (error) {
    console.error('❌ Error listing projects:', error);
  }
}

async function updateProjectStatusCLI() {
  try {
    const projectId = parseInt(await askQuestion('Project ID: '));
    const newStatus = await askQuestion('New Status (planning/active/on-hold/completed/cancelled): ');
    
    const success = await updateProjectStatus(projectId, newStatus);
    if (success) {
      console.log('✅ Project status updated successfully');
    }
  } catch (error) {
    console.error('❌ Error updating project status:', error);
  }
}

// Task Management Menu
async function taskManagementMenu() {
  while (true) {
    console.log('\n✅ Task Management');
    console.log('1. Create Task');
    console.log('2. List Tasks');
    console.log('3. Update Task Status');
    console.log('4. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await createTaskCLI();
        break;
      case '2':
        await listTasksCLI();
        break;
      case '3':
        await updateTaskStatusCLI();
        break;
      case '4':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function createTaskCLI() {
  try {
    const title = await askQuestion('Task Title: ');
    const description = await askQuestion('Description: ');
    const projectId = parseInt(await askQuestion('Project ID: '));
    const assignedTo = parseInt(await askQuestion('Assigned To ID (optional): ') || '0');
    const priority = await askQuestion('Priority (low/medium/high/critical): ');
    const estimatedHours = parseFloat(await askQuestion('Estimated Hours (optional): ') || '0');
    const dueDate = await askQuestion('Due Date (YYYY-MM-DD, optional): ');
    
    const success = await createTask(title, description, projectId, assignedTo || undefined, priority, estimatedHours || undefined, dueDate || undefined);
    if (success) {
      console.log('✅ Task created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating task:', error);
  }
}

async function listTasksCLI() {
  try {
    const tasks = await getTasks();
    console.log('\n✅ Tasks:');
    console.log('─'.repeat(120));
    console.log('ID  | Title                  | Status        | Priority  | Project            | Assigned To');
    console.log('─'.repeat(120));
    
    tasks.forEach((task: any) => {
      const title = task.title.length > 24 ? task.title.substring(0, 21) + '...' : task.title.padEnd(24);
      const project = task.project_name || 'Unknown';
      const projectDisplay = project.length > 19 ? project.substring(0, 16) + '...' : project.padEnd(19);
      const assignedTo = task.assigned_to_name || 'Unassigned';
      const assignedDisplay = assignedTo.length > 12 ? assignedTo.substring(0, 9) + '...' : assignedTo.padEnd(12);
      console.log(`${task.id.toString().padEnd(3)} | ${title} | ${task.status.padEnd(13)} | ${task.priority.padEnd(9)} | ${projectDisplay} | ${assignedDisplay}`);
    });
  } catch (error) {
    console.error('❌ Error listing tasks:', error);
  }
}

async function updateTaskStatusCLI() {
  try {
    const taskId = parseInt(await askQuestion('Task ID: '));
    const newStatus = await askQuestion('New Status (todo/in-progress/review/done): ');
    const actualHours = parseFloat(await askQuestion('Actual Hours (optional): ') || '0');
    
    const success = await updateTaskStatus(taskId, newStatus, actualHours || undefined);
    if (success) {
      console.log('✅ Task status updated successfully');
    }
  } catch (error) {
    console.error('❌ Error updating task status:', error);
  }
}

// Time Tracking Menu
async function timeTrackingMenu() {
  while (true) {
    console.log('\n⏱️  Time Tracking');
    console.log('1. Log Time Entry');
    console.log('2. List Time Entries');
    console.log('3. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await logTimeEntryCLI();
        break;
      case '2':
        await listTimeEntriesCLI();
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function logTimeEntryCLI() {
  try {
    const userId = parseInt(await askQuestion('User ID: '));
    const taskId = parseInt(await askQuestion('Task ID: '));
    const projectId = parseInt(await askQuestion('Project ID: '));
    const date = await askQuestion('Date (YYYY-MM-DD): ');
    const hours = parseFloat(await askQuestion('Hours: '));
    const description = await askQuestion('Description (optional): ');
    const billable = (await askQuestion('Billable (y/n): ')).toLowerCase() === 'y';
    
    const success = await logTimeEntry(userId, taskId, projectId, date, hours, description, billable);
    if (success) {
      console.log('✅ Time entry logged successfully');
    }
  } catch (error) {
    console.error('❌ Error logging time entry:', error);
  }
}

async function listTimeEntriesCLI() {
  try {
    const timeEntries = await getTimeEntries();
    console.log('\n⏱️  Time Entries:');
    console.log('─'.repeat(100));
    console.log('ID  | User           | Task                    | Project            | Date       | Hours | Description');
    console.log('─'.repeat(100));
    
    timeEntries.forEach((entry: any) => {
      const user = entry.user_name || 'Unknown';
      const userDisplay = user.length > 15 ? user.substring(0, 12) + '...' : user.padEnd(15);
      const task = entry.task_title || 'Unknown';
      const taskDisplay = task.length > 23 ? task.substring(0, 20) + '...' : task.padEnd(23);
      const project = entry.project_name || 'Unknown';
      const projectDisplay = project.length > 19 ? project.substring(0, 16) + '...' : project.padEnd(19);
      const description = entry.description || 'No description';
      const descDisplay = description.length > 20 ? description.substring(0, 17) + '...' : description.padEnd(20);
      console.log(`${entry.id.toString().padEnd(3)} | ${userDisplay} | ${taskDisplay} | ${projectDisplay} | ${entry.date.padEnd(10)} | ${entry.hours.toString().padEnd(5)} | ${descDisplay}`);
    });
  } catch (error) {
    console.error('❌ Error listing time entries:', error);
  }
}

// Collaboration Menu
async function collaborationMenu() {
  while (true) {
    console.log('\n💬 Collaboration');
    console.log('1. Add Comment');
    console.log('2. List Comments');
    console.log('3. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await addCommentCLI();
        break;
      case '2':
        await listCommentsCLI();
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function addCommentCLI() {
  try {
    const content = await askQuestion('Comment: ');
    const userId = parseInt(await askQuestion('User ID: '));
    const projectId = parseInt(await askQuestion('Project ID (optional, 0 for none): ') || '0');
    const taskId = parseInt(await askQuestion('Task ID (optional, 0 for none): ') || '0');
    
    const success = await addComment(content, userId, projectId || undefined, taskId || undefined);
    if (success) {
      console.log('✅ Comment added successfully');
    }
  } catch (error) {
    console.error('❌ Error adding comment:', error);
  }
}

async function listCommentsCLI() {
  try {
    const comments = await getComments();
    console.log('\n💬 Comments:');
    console.log('─'.repeat(100));
    console.log('ID  | User           | Content                    | Project            | Created');
    console.log('─'.repeat(100));
    
    comments.forEach((comment: any) => {
      const user = comment.user_name || 'Unknown';
      const userDisplay = user.length > 15 ? user.substring(0, 12) + '...' : user.padEnd(15);
      const content = comment.content.length > 27 ? comment.content.substring(0, 24) + '...' : comment.content.padEnd(27);
      const project = comment.project_id || 'General';
      const projectDisplay = project.toString().padEnd(19);
      const created = comment.created_at.substring(0, 10);
      console.log(`${comment.id.toString().padEnd(3)} | ${userDisplay} | ${content} | ${projectDisplay} | ${created}`);
    });
  } catch (error) {
    console.error('❌ Error listing comments:', error);
  }
}

// Reports Menu
async function reportsMenu() {
  while (true) {
    console.log('\n📊 Reports & Analytics');
    console.log('1. Project Report');
    console.log('2. User Workload Report');
    console.log('3. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await projectReportCLI();
        break;
      case '2':
        await userWorkloadReportCLI();
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function projectReportCLI() {
  try {
    const projectId = parseInt(await askQuestion('Project ID: '));
    const report = await generateProjectReport(projectId);
    
    if (report) {
      console.log('\n📈 Project Report:');
      console.log('─'.repeat(50));
      console.log(`Project: ${report.project.name}`);
      console.log(`Status: ${report.project.status}`);
      console.log(`Priority: ${report.project.priority}`);
      console.log(`Budget: $${report.project.budget?.toLocaleString() || 'N/A'}`);
      console.log(`Tasks: ${report.summary.completedTasks}/${report.summary.totalTasks} completed`);
      console.log(`Hours: ${report.summary.totalActualHours}/${report.summary.totalEstimatedHours} estimated`);
      console.log(`Completion Rate: ${report.summary.completionRate}%`);
      console.log(`Time Variance: ${report.summary.timeVariance}h`);
      console.log(`Comments: ${report.summary.totalComments}`);
      console.log(`Time Entries: ${report.summary.totalTimeEntries}`);
    } else {
      console.log('❌ Could not generate project report');
    }
  } catch (error) {
    console.error('❌ Error generating project report:', error);
  }
}

async function userWorkloadReportCLI() {
  try {
    const userId = parseInt(await askQuestion('User ID: '));
    const report = await generateUserWorkloadReport(userId);
    
    if (report) {
      console.log('\n👤 User Workload Report:');
      console.log('─'.repeat(50));
      console.log(`User: ${report.user.full_name}`);
      console.log(`Role: ${report.user.role}`);
      console.log(`Department: ${report.user.department || 'N/A'}`);
      console.log(`Total Assigned Tasks: ${report.workload.totalAssignedTasks}`);
      console.log(`Active Tasks: ${report.workload.activeTasks}`);
      console.log(`Completed Tasks: ${report.workload.completedTasks}`);
      console.log(`Total Hours: ${report.workload.totalHours}`);
      console.log(`Average Hours Per Day: ${report.workload.averageHoursPerDay}`);
    } else {
      console.log('❌ Could not generate user workload report');
    }
  } catch (error) {
    console.error('❌ Error generating user workload report:', error);
  }
}

// Sync Management Menu
async function syncManagementMenu() {
  while (true) {
    console.log('\n🔄 Sync Management');
    console.log('1. Show Sync Status');
    console.log('2. Sync All Data');
    console.log('3. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await showSyncStatusCLI();
        break;
      case '2':
        await syncAllDataCLI();
        break;
      case '3':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function showSyncStatusCLI() {
  try {
    const syncStatus = await getSyncStatus();
    console.log('\n🔄 Sync Status:');
    console.log('─'.repeat(50));
    
    for (const [table, status] of Object.entries(syncStatus)) {
      const statusData = status as { synced: number; total: number; unsynced: number };
      console.log(`${table}: ${statusData.synced}/${statusData.total} synced (${statusData.unsynced} pending)`);
    }
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
  }
}

async function syncAllDataCLI() {
  try {
    console.log('🔄 Starting synchronization...');
    const success = await syncAllData();
    
    if (success) {
      console.log('✅ Synchronization completed successfully');
    } else {
      console.log('❌ Synchronization failed');
    }
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
  }
}

// Audit Log Menu
async function auditLogMenu() {
  while (true) {
    console.log('\n📝 Audit Log');
    console.log('1. Show Recent Audit Log');
    console.log('2. Back to Main Menu');
    
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await showAuditLogCLI();
        break;
      case '2':
        return;
      default:
        console.log('❌ Invalid option');
    }
  }
}

async function showAuditLogCLI() {
  try {
    const auditLog = await getAuditLog();
    console.log('\n📝 Recent Audit Log:');
    console.log('─'.repeat(100));
    console.log('ID  | Action | Table        | User ID | Record ID | Timestamp');
    console.log('─'.repeat(100));
    
    auditLog.forEach((entry: any) => {
      const table = entry.table_name.padEnd(13);
      const user = entry.user_id || 'System';
      const userDisplay = user.toString().padEnd(8);
      const record = entry.record_id || 'N/A';
      const recordDisplay = record.toString().padEnd(9);
      const timestamp = entry.created_at.substring(0, 19);
      console.log(`${entry.id.toString().padEnd(3)} | ${entry.action.padEnd(6)} | ${table} | ${userDisplay} | ${recordDisplay} | ${timestamp}`);
    });
  } catch (error) {
    console.error('❌ Error showing audit log:', error);
  }
}

// Main CLI function
async function mainCLI() {
  console.log('🚀 Starting Enterprise Application CLI...');
  
  // Check if environment variables are set
  if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log('⚠️  Environment variables not set. Please create a .env file with:');
    console.log('   TURSO_SYNC_URL=your_sync_url_here');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
    return;
  }

  try {
    // Setup the database
    console.log('🏗️  Setting up enterprise database...');
    await setupEnterpriseDatabase();
    console.log('✅ Database setup complete');
    
    while (true) {
      displayMenu();
      const choice = await askQuestion('Select option: ');
      
      switch (choice) {
        case '1':
          await userManagementMenu();
          break;
        case '2':
          await projectManagementMenu();
          break;
        case '3':
          await taskManagementMenu();
          break;
        case '4':
          await timeTrackingMenu();
          break;
        case '5':
          await collaborationMenu();
          break;
        case '6':
          await reportsMenu();
          break;
        case '7':
          await syncManagementMenu();
          break;
        case '8':
          await auditLogMenu();
          break;
        case '9':
          console.log('🎭 Populating demo data...');
          await populateDemoData();
          console.log('✅ Demo data populated');
          break;
        case '0':
          console.log('👋 Goodbye!');
          rl.close();
          return;
        default:
          console.log('❌ Invalid option');
      }
    }
  } catch (error) {
    console.error('❌ CLI error:', error);
    rl.close();
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  mainCLI().catch(console.error);
}

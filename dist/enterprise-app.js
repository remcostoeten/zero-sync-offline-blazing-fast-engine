import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Create the Turso client with offline sync enabled
const client = createClient({
    url: 'file:enterprise.db',
    syncUrl: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || '',
});
// ============================================================================
// DATABASE SCHEMA SETUP
// ============================================================================
async function setupEnterpriseDatabase() {
    console.log('🏗️  Setting up enterprise database schema...');
    try {
        // Users table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee', 'viewer')),
        department TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_login TEXT,
        is_active INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0
      )
    `);
        // Projects table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        start_date TEXT,
        end_date TEXT,
        budget REAL,
        manager_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (manager_id) REFERENCES users (id)
      )
    `);
        // Tasks table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        project_id INTEGER NOT NULL,
        assigned_to INTEGER,
        estimated_hours REAL,
        actual_hours REAL,
        due_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (assigned_to) REFERENCES users (id)
      )
    `);
        // Time entries table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        hours REAL NOT NULL,
        description TEXT,
        billable INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `);
        // Comments table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        task_id INTEGER,
        parent_comment_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        FOREIGN KEY (parent_comment_id) REFERENCES comments (id)
      )
    `);
        // Attachments table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        task_id INTEGER,
        comment_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id),
        FOREIGN KEY (comment_id) REFERENCES comments (id)
      )
    `);
        // Audit log table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        user_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
      )
    `);
        console.log('✅ Enterprise database schema created successfully');
    }
    catch (error) {
        console.error('❌ Error setting up database schema:', error);
    }
}
// ============================================================================
// USER MANAGEMENT
// ============================================================================
async function createUser(username, email, fullName, role, department) {
    try {
        await client.execute({
            sql: `INSERT INTO users (username, email, full_name, role, department) 
             VALUES (?, ?, ?, ?, ?)`,
            args: [username, email, fullName, role, department],
        });
        console.log(`👤 User created: ${fullName} (${username})`);
        // Log the action
        await logAuditAction('CREATE', 'users', undefined, username, undefined, JSON.stringify({ username, email, fullName, role, department }));
        return true;
    }
    catch (error) {
        console.error('❌ Error creating user:', error);
        return false;
    }
}
async function getUsers() {
    try {
        const result = await client.execute('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error fetching users:', error);
        return [];
    }
}
// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================
async function createProject(name, description, status, priority, managerId, budget, startDate, endDate) {
    try {
        await client.execute({
            sql: `INSERT INTO projects (name, description, status, priority, manager_id, budget, start_date, end_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [name, description, status, priority, managerId, budget, startDate, endDate],
        });
        console.log(`📋 Project created: ${name}`);
        // Log the action
        await logAuditAction('CREATE', 'projects', undefined, managerId.toString(), undefined, JSON.stringify({ name, description, status, priority, managerId, budget, startDate, endDate }));
        return true;
    }
    catch (error) {
        console.error('❌ Error creating project:', error);
        return false;
    }
}
async function getProjects() {
    try {
        const result = await client.execute(`
      SELECT p.*, u.full_name as manager_name 
      FROM projects p 
      LEFT JOIN users u ON p.manager_id = u.id 
      ORDER BY p.created_at DESC
    `);
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error fetching projects:', error);
        return [];
    }
}
async function updateProjectStatus(projectId, newStatus) {
    try {
        await client.execute({
            sql: `UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?`,
            args: [newStatus, projectId],
        });
        console.log(`🔄 Project ${projectId} status updated to: ${newStatus}`);
        // Log the action
        await logAuditAction('UPDATE', 'projects', projectId, undefined, JSON.stringify({ status: newStatus }), JSON.stringify({ status: newStatus }));
        return true;
    }
    catch (error) {
        console.error('❌ Error updating project status:', error);
        return false;
    }
}
// ============================================================================
// TASK MANAGEMENT
// ============================================================================
async function createTask(title, description, projectId, assignedTo, priority = 'medium', estimatedHours, dueDate) {
    try {
        await client.execute({
            sql: `INSERT INTO tasks (title, description, project_id, assigned_to, priority, estimated_hours, due_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [title, description, projectId, assignedTo, priority, estimatedHours, dueDate],
        });
        console.log(`✅ Task created: ${title}`);
        // Log the action
        await logAuditAction('CREATE', 'tasks', undefined, assignedTo?.toString() || 'unassigned', undefined, JSON.stringify({ title, description, projectId, assignedTo, priority, estimatedHours, dueDate }));
        return true;
    }
    catch (error) {
        console.error('❌ Error creating task:', error);
        return false;
    }
}
async function getTasks(projectId) {
    try {
        let sql = `
      SELECT t.*, p.name as project_name, u.full_name as assigned_to_name 
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      LEFT JOIN users u ON t.assigned_to = u.id
    `;
        if (projectId) {
            sql += ' WHERE t.project_id = ?';
            const result = await client.execute(sql, [projectId]);
            return result.rows;
        }
        else {
            sql += ' ORDER BY t.created_at DESC';
            const result = await client.execute(sql);
            return result.rows;
        }
    }
    catch (error) {
        console.error('❌ Error fetching tasks:', error);
        return [];
    }
}
async function updateTaskStatus(taskId, newStatus, actualHours) {
    try {
        let sql = `UPDATE tasks SET status = ?, updated_at = datetime('now')`;
        let args = [newStatus];
        if (actualHours !== undefined) {
            sql += `, actual_hours = ?`;
            args.push(actualHours.toString());
        }
        sql += ` WHERE id = ?`;
        args.push(taskId.toString());
        await client.execute({ sql, args });
        console.log(`🔄 Task ${taskId} status updated to: ${newStatus}`);
        // Log the action
        await logAuditAction('UPDATE', 'tasks', taskId, undefined, JSON.stringify({ status: newStatus, actualHours }), JSON.stringify({ status: newStatus, actualHours }));
        return true;
    }
    catch (error) {
        console.error('❌ Error updating task status:', error);
        return false;
    }
}
// ============================================================================
// TIME TRACKING
// ============================================================================
async function logTimeEntry(userId, taskId, projectId, date, hours, description, billable = true) {
    try {
        await client.execute({
            sql: `INSERT INTO time_entries (user_id, task_id, project_id, date, hours, description, billable) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [userId, taskId, projectId, date, hours, description, billable ? 1 : 0],
        });
        console.log(`⏱️  Time logged: ${hours}h on ${date}`);
        // Log the action
        await logAuditAction('CREATE', 'time_entries', undefined, userId.toString(), undefined, JSON.stringify({ userId, taskId, projectId, date, hours, description, billable }));
        return true;
    }
    catch (error) {
        console.error('❌ Error logging time entry:', error);
        return false;
    }
}
async function getTimeEntries(userId, projectId, startDate, endDate) {
    try {
        let sql = `
      SELECT te.*, u.full_name as user_name, t.title as task_title, p.name as project_name
      FROM time_entries te 
      LEFT JOIN users u ON te.user_id = u.id 
      LEFT JOIN tasks t ON te.task_id = t.id 
      LEFT JOIN projects p ON te.project_id = p.id
      WHERE 1=1
    `;
        let args = [];
        if (userId) {
            sql += ' AND te.user_id = ?';
            args.push(userId);
        }
        if (projectId) {
            sql += ' AND te.project_id = ?';
            args.push(projectId);
        }
        if (startDate) {
            sql += ' AND te.date >= ?';
            args.push(startDate);
        }
        if (endDate) {
            sql += ' AND te.date <= ?';
            args.push(endDate);
        }
        sql += ' ORDER BY te.date DESC, te.created_at DESC';
        const result = await client.execute({ sql, args });
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error fetching time entries:', error);
        return [];
    }
}
// ============================================================================
// COLLABORATION FEATURES
// ============================================================================
async function addComment(content, userId, projectId, taskId, parentCommentId) {
    try {
        await client.execute({
            sql: `INSERT INTO comments (content, user_id, project_id, task_id, parent_comment_id) 
             VALUES (?, ?, ?, ?, ?)`,
            args: [content, userId, projectId, taskId, parentCommentId],
        });
        console.log(`💬 Comment added by user ${userId}`);
        // Log the action
        await logAuditAction('CREATE', 'comments', undefined, userId.toString(), undefined, JSON.stringify({ content, userId, projectId, taskId, parentCommentId }));
        return true;
    }
    catch (error) {
        console.error('❌ Error adding comment:', error);
        return false;
    }
}
async function getComments(projectId, taskId) {
    try {
        let sql = `
      SELECT c.*, u.full_name as user_name, u.username
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;
        let args = [];
        if (projectId) {
            sql += ' AND c.project_id = ?';
            args.push(projectId);
        }
        if (taskId) {
            sql += ' AND c.task_id = ?';
            args.push(taskId);
        }
        sql += ' ORDER BY c.created_at ASC';
        const result = await client.execute({ sql, args });
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error fetching comments:', error);
        return [];
    }
}
// ============================================================================
// AUDIT LOGGING
// ============================================================================
async function logAuditAction(action, tableName, recordId, userId, oldValues, newValues) {
    try {
        await client.execute({
            sql: `INSERT INTO audit_log (action, table_name, record_id, user_id, old_values, new_values) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            args: [action, tableName, recordId || null, userId || null, oldValues || null, newValues || null],
        });
    }
    catch (error) {
        console.error('❌ Error logging audit action:', error);
    }
}
async function getAuditLog(tableName, userId, startDate, endDate) {
    try {
        let sql = `
      SELECT al.*, u.full_name as user_name
      FROM audit_log al 
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
        let args = [];
        if (tableName) {
            sql += ' AND al.table_name = ?';
            args.push(tableName);
        }
        if (userId) {
            sql += ' AND al.user_id = ?';
            args.push(userId);
        }
        if (startDate) {
            sql += ' AND al.created_at >= ?';
            args.push(startDate);
        }
        if (endDate) {
            sql += ' AND al.created_at <= ?';
            args.push(endDate);
        }
        sql += ' ORDER BY al.created_at DESC LIMIT 100';
        const result = await client.execute({ sql, args });
        return result.rows;
    }
    catch (error) {
        console.error('❌ Error fetching audit log:', error);
        return [];
    }
}
// ============================================================================
// SYNC MANAGEMENT
// ============================================================================
async function syncAllData() {
    try {
        console.log('🔄 Starting full data synchronization...');
        // Get counts of unsynced records
        const tables = ['users', 'projects', 'tasks', 'time_entries', 'comments', 'attachments', 'audit_log'];
        let totalUnsynced = 0;
        for (const table of tables) {
            const result = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE synced = 0`);
            const count = result.rows[0]?.count || 0;
            totalUnsynced += Number(count);
            if (Number(count) > 0) {
                console.log(`  📊 ${table}: ${count} unsynced records`);
            }
        }
        if (totalUnsynced === 0) {
            console.log('✅ All data is already synced');
            return true;
        }
        // Attempt to sync
        await client.sync();
        console.log('✅ Sync completed successfully');
        // Mark all records as synced
        for (const table of tables) {
            await client.execute(`UPDATE ${table} SET synced = 1 WHERE synced = 0`);
        }
        console.log('✅ All records marked as synced');
        return true;
    }
    catch (error) {
        console.error('❌ Sync failed:', error);
        return false;
    }
}
async function getSyncStatus() {
    try {
        const tables = ['users', 'projects', 'tasks', 'time_entries', 'comments', 'attachments', 'audit_log'];
        const status = {};
        for (const table of tables) {
            const totalResult = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
            const unsyncedResult = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE synced = 0`);
            status[table] = {
                total: Number(totalResult.rows[0]?.count || 0),
                synced: Number(totalResult.rows[0]?.count || 0) - Number(unsyncedResult.rows[0]?.count || 0),
                unsynced: Number(unsyncedResult.rows[0]?.count || 0)
            };
        }
        return status;
    }
    catch (error) {
        console.error('❌ Error getting sync status:', error);
        return {};
    }
}
// ============================================================================
// REPORTING AND ANALYTICS
// ============================================================================
async function generateProjectReport(projectId) {
    try {
        const project = await client.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
        const tasks = await getTasks(projectId);
        const timeEntries = await getTimeEntries(undefined, projectId);
        const comments = await getComments(projectId);
        const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
        const totalActualHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const completedTasks = tasks.filter((task) => task.status === 'done').length;
        const totalTasks = tasks.length;
        return {
            project: project.rows[0],
            summary: {
                totalTasks,
                completedTasks,
                completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
                totalEstimatedHours,
                totalActualHours,
                timeVariance: totalEstimatedHours - totalActualHours,
                totalComments: comments.length,
                totalTimeEntries: timeEntries.length
            },
            tasks,
            timeEntries,
            comments
        };
    }
    catch (error) {
        console.error('❌ Error generating project report:', error);
        return null;
    }
}
async function generateUserWorkloadReport(userId, startDate, endDate) {
    try {
        const user = await client.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const assignedTasks = await client.execute('SELECT * FROM tasks WHERE assigned_to = ?', [userId]);
        const timeEntries = await getTimeEntries(userId, undefined, startDate, endDate);
        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const activeTasks = assignedTasks.rows.filter((task) => task.status === 'in-progress').length;
        const completedTasks = assignedTasks.rows.filter((task) => task.status === 'done').length;
        return {
            user: user.rows[0],
            workload: {
                totalAssignedTasks: assignedTasks.rows.length,
                activeTasks,
                completedTasks,
                totalHours,
                averageHoursPerDay: timeEntries.length > 0 ? (totalHours / timeEntries.length).toFixed(2) : 0
            },
            assignedTasks: assignedTasks.rows,
            timeEntries
        };
    }
    catch (error) {
        console.error('❌ Error generating user workload report:', error);
        return null;
    }
}
// ============================================================================
// DEMO DATA POPULATION
// ============================================================================
async function populateDemoData() {
    console.log('🎭 Populating demo data...');
    try {
        // Create demo users
        await createUser('admin', 'admin@company.com', 'System Administrator', 'admin', 'IT');
        await createUser('manager1', 'manager1@company.com', 'Project Manager One', 'manager', 'Engineering');
        await createUser('manager2', 'manager2@company.com', 'Project Manager Two', 'manager', 'Marketing');
        await createUser('dev1', 'dev1@company.com', 'Developer One', 'employee', 'Engineering');
        await createUser('dev2', 'dev2@company.com', 'Developer Two', 'employee', 'Engineering');
        await createUser('designer1', 'designer1@company.com', 'Designer One', 'employee', 'Design');
        await createUser('analyst1', 'analyst1@company.com', 'Business Analyst', 'employee', 'Business');
        // Get user IDs
        const users = await getUsers();
        const admin = users.find((u) => u.username === 'admin');
        const manager1 = users.find((u) => u.username === 'manager1');
        const manager2 = users.find((u) => u.username === 'manager2');
        const dev1 = users.find((u) => u.username === 'dev1');
        const dev2 = users.find((u) => u.username === 'dev2');
        const designer1 = users.find((u) => u.username === 'designer1');
        const analyst1 = users.find((u) => u.username === 'analyst1');
        // Create demo projects
        await createProject('E-commerce Platform Redesign', 'Modernize our online store with new UI/UX', 'active', 'high', Number(manager1?.id) || 1, 50000, '2025-01-01', '2025-06-30');
        await createProject('Mobile App Development', 'Create iOS and Android apps for our service', 'planning', 'medium', Number(manager2?.id) || 1, 75000, '2025-03-01', '2025-12-31');
        await createProject('Data Analytics Dashboard', 'Build comprehensive reporting system', 'active', 'critical', Number(manager1?.id) || 1, 40000, '2025-02-01', '2025-05-31');
        // Get project IDs
        const projects = await getProjects();
        const ecommerceProject = projects.find((p) => p.name.includes('E-commerce'));
        const mobileProject = projects.find((p) => p.name.includes('Mobile App'));
        const analyticsProject = projects.find((p) => p.name.includes('Data Analytics'));
        // Create demo tasks
        if (ecommerceProject) {
            await createTask('Design new homepage layout', 'Create wireframes and mockups for homepage', Number(ecommerceProject.id), Number(designer1?.id), 'high', 16, '2025-02-15');
            await createTask('Implement responsive navigation', 'Build mobile-friendly navigation component', Number(ecommerceProject.id), Number(dev1?.id), 'medium', 24, '2025-02-28');
            await createTask('Set up e-commerce backend', 'Configure product catalog and payment system', Number(ecommerceProject.id), Number(dev2?.id), 'critical', 40, '2025-03-15');
        }
        if (mobileProject) {
            await createTask('Create app wireframes', 'Design user interface mockups', Number(mobileProject.id), Number(designer1?.id), 'high', 20, '2025-04-01');
            await createTask('Set up development environment', 'Configure iOS and Android development tools', Number(mobileProject.id), Number(dev1?.id), 'medium', 8, '2025-03-15');
        }
        if (analyticsProject) {
            await createTask('Design database schema', 'Plan data structure for analytics', Number(analyticsProject.id), Number(analyst1?.id), 'high', 12, '2025-02-28');
            await createTask('Build data ingestion pipeline', 'Create ETL process for data collection', Number(analyticsProject.id), Number(dev2?.id), 'critical', 32, '2025-03-31');
        }
        // Get task IDs and log some time
        const tasks = await getTasks();
        for (let i = 0; i < Math.min(5, tasks.length); i++) {
            const task = tasks[i];
            const user = users[Math.floor(Math.random() * users.length)];
            if (user && task) {
                await logTimeEntry(Number(user.id), Number(task.id), Number(task.project_id), '2025-01-15', Math.floor(Math.random() * 8) + 1, 'Working on task implementation');
                await logTimeEntry(Number(user.id), Number(task.id), Number(task.project_id), '2025-01-16', Math.floor(Math.random() * 8) + 1, 'Continued development work');
            }
        }
        // Add some comments
        if (ecommerceProject) {
            await addComment('Great progress on the homepage design!', Number(designer1?.id) || 1, Number(ecommerceProject.id));
            await addComment('The navigation looks excellent on mobile devices', Number(manager1?.id) || 1, Number(ecommerceProject.id));
        }
        if (analyticsProject) {
            await addComment('Database schema looks solid, ready to proceed with implementation', Number(analyst1?.id) || 1, Number(analyticsProject.id));
            await addComment('Starting work on the ETL pipeline this week', Number(dev2?.id) || 1, Number(analyticsProject.id));
        }
        console.log('✅ Demo data populated successfully');
    }
    catch (error) {
        console.error('❌ Error populating demo data:', error);
    }
}
// ============================================================================
// MAIN APPLICATION
// ============================================================================
async function main() {
    console.log('🏢 Enterprise Application Demo');
    console.log('==============================\n');
    // Check if environment variables are set
    if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
        console.log('⚠️  Environment variables not set. Please create a .env file with:');
        console.log('   TURSO_SYNC_URL=your_sync_url_here');
        console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
        return;
    }
    try {
        // Setup the database
        await setupEnterpriseDatabase();
        // Populate with demo data
        await populateDemoData();
        // Display system overview
        console.log('\n📊 System Overview:');
        console.log('─'.repeat(50));
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
        // Show sync status
        console.log('\n🔄 Sync Status:');
        console.log('─'.repeat(50));
        const syncStatus = await getSyncStatus();
        for (const [table, status] of Object.entries(syncStatus)) {
            const statusData = status;
            console.log(`${table}: ${statusData.synced}/${statusData.total} synced (${statusData.unsynced} pending)`);
        }
        // Generate and display a sample report
        if (projects.length > 0) {
            console.log('\n📈 Sample Project Report:');
            console.log('─'.repeat(50));
            const report = await generateProjectReport(Number(projects[0].id));
            if (report) {
                console.log(`Project: ${report.project.name}`);
                console.log(`Status: ${report.project.status}`);
                console.log(`Tasks: ${report.summary.completedTasks}/${report.summary.totalTasks} completed`);
                console.log(`Hours: ${report.summary.totalActualHours}/${report.summary.totalEstimatedHours} estimated`);
                console.log(`Completion Rate: ${report.summary.completionRate}%`);
            }
        }
        // Attempt to sync
        console.log('\n🔄 Attempting to sync with Turso Cloud...');
        await syncAllData();
        console.log('\n🎉 Enterprise application demo completed successfully!');
    }
    catch (error) {
        console.error('❌ Enterprise application error:', error);
    }
}
// Run the application if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
export { setupEnterpriseDatabase, createUser, getUsers, createProject, getProjects, updateProjectStatus, createTask, getTasks, updateTaskStatus, logTimeEntry, getTimeEntries, addComment, getComments, logAuditAction, getAuditLog, syncAllData, getSyncStatus, generateProjectReport, generateUserWorkloadReport, populateDemoData };
//# sourceMappingURL=enterprise-app.js.map
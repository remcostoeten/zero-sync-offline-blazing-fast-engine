declare function setupEnterpriseDatabase(): Promise<void>;
declare function createUser(username: string, email: string, fullName: string, role: string, department?: string): Promise<boolean>;
declare function getUsers(): Promise<import("@libsql/client").Row[]>;
declare function createProject(name: string, description: string, status: string, priority: string, managerId: number, budget?: number, startDate?: string, endDate?: string): Promise<boolean>;
declare function getProjects(): Promise<import("@libsql/client").Row[]>;
declare function updateProjectStatus(projectId: number, newStatus: string): Promise<boolean>;
declare function createTask(title: string, description: string, projectId: number, assignedTo?: number, priority?: string, estimatedHours?: number, dueDate?: string): Promise<boolean>;
declare function getTasks(projectId?: number): Promise<import("@libsql/client").Row[]>;
declare function updateTaskStatus(taskId: number, newStatus: string, actualHours?: number): Promise<boolean>;
declare function logTimeEntry(userId: number, taskId: number, projectId: number, date: string, hours: number, description?: string, billable?: boolean): Promise<boolean>;
declare function getTimeEntries(userId?: number, projectId?: number, startDate?: string, endDate?: string): Promise<import("@libsql/client").Row[]>;
declare function addComment(content: string, userId: number, projectId?: number, taskId?: number, parentCommentId?: number): Promise<boolean>;
declare function getComments(projectId?: number, taskId?: number): Promise<import("@libsql/client").Row[]>;
declare function logAuditAction(action: string, tableName: string, recordId?: number, userId?: string, oldValues?: string, newValues?: string): Promise<void>;
declare function getAuditLog(tableName?: string, userId?: string, startDate?: string, endDate?: string): Promise<import("@libsql/client").Row[]>;
declare function syncAllData(): Promise<boolean>;
declare function getSyncStatus(): Promise<any>;
declare function generateProjectReport(projectId: number): Promise<{
    project: import("@libsql/client").Row;
    summary: {
        totalTasks: number;
        completedTasks: number;
        completionRate: string | number;
        totalEstimatedHours: any;
        totalActualHours: any;
        timeVariance: number;
        totalComments: number;
        totalTimeEntries: number;
    };
    tasks: import("@libsql/client").Row[];
    timeEntries: import("@libsql/client").Row[];
    comments: import("@libsql/client").Row[];
}>;
declare function generateUserWorkloadReport(userId: number, startDate?: string, endDate?: string): Promise<{
    user: import("@libsql/client").Row;
    workload: {
        totalAssignedTasks: number;
        activeTasks: number;
        completedTasks: number;
        totalHours: any;
        averageHoursPerDay: string | number;
    };
    assignedTasks: import("@libsql/client").Row[];
    timeEntries: import("@libsql/client").Row[];
}>;
declare function populateDemoData(): Promise<void>;
export { setupEnterpriseDatabase, createUser, getUsers, createProject, getProjects, updateProjectStatus, createTask, getTasks, updateTaskStatus, logTimeEntry, getTimeEntries, addComment, getComments, logAuditAction, getAuditLog, syncAllData, getSyncStatus, generateProjectReport, generateUserWorkloadReport, populateDemoData };
//# sourceMappingURL=enterprise-app.d.ts.map
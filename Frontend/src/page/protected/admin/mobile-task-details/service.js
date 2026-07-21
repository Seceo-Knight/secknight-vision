import apiService from "@/services/api.service";
import * as XLSX from "xlsx";

// ─── Projects ────────────────────────────────────────────────────────────────

// Controller: getProjectsList()
// GET /mobile/admin-dashboard/fetch-project?skip=&limit=&search=&sort=
const cleanProject = (p) => ({
    ...p,
    assigned_users: (p.assigned_users || []).filter(Boolean),
    assigned_non_admin_users: (p.assigned_non_admin_users || []).filter(Boolean),
});

const getProjects = async ({ skip = 0, limit = 10, search = "", sortOrder = "" } = {}) => {
    try {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (search) params.set("search", search);
        if (sortOrder) params.set("sort", sortOrder === "D" ? "DESC" : "ASC");
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-project?${params}`);
        if (data?.code === 200) {
            const rows = Array.isArray(data.data) ? data.data.map(cleanProject) : [];
            const count = data.count ?? data.totalCount ?? rows.length;
            return { rows, count };
        }
        return { rows: [], count: 0 };
    } catch { return { rows: [], count: 0 }; }
};

// Fetch all projects for dropdown selects (no pagination)
const getAllProjects = async () => {
    try {
        const { data } = await apiService.apiInstance.get("/mobile/admin-dashboard/fetch-project?skip=0&limit=999999");
        if (data?.code === 200 && Array.isArray(data.data)) {
            return data.data.map(cleanProject);
        }
        return [];
    } catch { return []; }
};

// POST /mobile/admin-dashboard/create-project
const createProject = async (projectData) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/create-project", projectData);
        const code = data?.data?.code ?? data?.code;
        return { success: code === 200, message: data?.data?.message || data?.message || "" };
    } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to create project";
        return { success: false, message: msg };
    }
};

// PUT /mobile/admin-dashboard/update-project
const updateProject = async (projectData) => {
    try {
        const { data } = await apiService.apiInstance.put("/mobile/admin-dashboard/update-project", projectData);
        return { success: data?.code === 200, message: data?.message || "" };
    } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to update project";
        return { success: false, message: msg };
    }
};

// DELETE /mobile/admin-dashboard/delete-project
const deleteProject = async (projectId) => {
    try {
        const { data } = await apiService.apiInstance.delete("/mobile/admin-dashboard/delete-project", { data: { _id: projectId } });
        return { success: data?.code === 200 || data?.data === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to delete project" }; }
};

// GET /mobile/admin-dashboard/assign-all-employee-to-all-projects
const assignAllEmployeesToProjects = async () => {
    try {
        const { data } = await apiService.apiInstance.get("/mobile/admin-dashboard/assign-all-employee-to-all-projects");
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to assign" }; }
};

// POST /mobile/admin-dashboard/bulk-create-project (multipart)
const bulkImportProjects = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/bulk-create-project", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return { success: data?.data?.code === 200 || data?.code === 200, message: data?.data?.message || data?.msg || "", resultData: data?.data?.data };
    } catch { return { success: false, message: "Failed to import projects" }; }
};

// ─── Folders ─────────────────────────────────────────────────────────────────

// GET /mobile/admin-dashboard/fetch-project-folder?skip=0&limit=...&project_id=
const getFolders = async (projectId) => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-project-folder?skip=0&limit=999999&project_id=${projectId}`);
        return data?.code === 200 ? (data.data || []) : [];
    } catch { return []; }
};

// GET /mobile/admin-dashboard/fetch-project-details?project_id=
const getProjectDetails = async (projectId) => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-project-details?project_id=${projectId}`);
        return data?.code === 200 ? data.data : null;
    } catch { return null; }
};

// ─── Admin Tasks ─────────────────────────────────────────────────────────────

// GET /mobile/admin-dashboard/fetch-task-list-multiple-employee?...
const getTaskList = async ({ skip = 0, limit = 10, search = "", employeeIds, taskId, managerId, projectId, folderId, startDate, endDate, sortColumn, sortOrder } = {}) => {
    try {
        const params = new URLSearchParams();
        params.set("skip", String(skip));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (employeeIds?.length) params.set("employee_ids", employeeIds.join(","));
        if (taskId) params.set("task_id", taskId);
        if (managerId) params.set("manager_id", managerId);
        if (projectId) params.set("project_id", projectId);
        if (folderId) params.set("folder_id", folderId);
        if (startDate) params.set("start_date", `${startDate}T00:00:00.000Z`);
        if (endDate) params.set("end_date", `${endDate}T00:00:00.000Z`);
        if (sortColumn) params.set("sortColumn", sortColumn);
        if (sortOrder) params.set("sortOrder", sortOrder);

        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-task-list-multiple-employee?${params}`);
        if (data?.code === 200) return { rows: data.data || [], count: data.count || 0 };
        return { rows: [], count: 0 };
    } catch { return { rows: [], count: 0 }; }
};

// POST /mobile/admin-dashboard/create-project-task
const createTask = async ({ title, projectId, folderId, employeeId }) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/create-project-task", {
            title, project_id: projectId, folder_id: folderId, employee_id: employeeId,
        });
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to create task" }; }
};

// PUT /mobile/admin-dashboard/update-project-task
const updateTask = async ({ taskId, title, projectId, folderId }) => {
    try {
        const { data } = await apiService.apiInstance.put("/mobile/admin-dashboard/update-project-task", {
            task_id: taskId, title, project_id: projectId, folder_id: folderId,
        });
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to update task" }; }
};

// DELETE /mobile/admin-dashboard/delete-project-task?_id=
const deleteTask = async (taskId) => {
    try {
        const { data } = await apiService.apiInstance.delete(`/mobile/admin-dashboard/delete-project-task?_id=${taskId}`);
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to delete task" }; }
};

// POST /mobile/admin-dashboard/bulk-create-project-task (multipart)
const bulkImportTasks = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/bulk-create-project-task", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return { success: data?.data?.code === 200 || data?.code === 200, message: data?.data?.message || data?.msg || "", resultData: data?.data?.data };
    } catch { return { success: false, message: "Failed to import tasks" }; }
};

// ─── Task Downloads ──────────────────────────────────────────────────────────

const buildDownloadParams = ({ search, employeeIds, taskId, managerId, projectId, folderId, startDate, endDate, sortColumn, sortOrder }) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (employeeIds?.length) params.set("employee_ids", employeeIds.join(","));
    if (taskId) params.set("task_id", taskId);
    if (managerId) params.set("manager_id", managerId);
    if (projectId) params.set("project_id", projectId);
    if (folderId) params.set("folder_id", folderId);
    if (startDate) params.set("start_date", `${startDate}T00:00:00.000Z`);
    if (endDate) params.set("end_date", `${endDate}T00:00:00.000Z`);
    if (sortColumn) params.set("sortColumn", sortColumn);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return params.toString();
};

// GET /mobile/admin-dashboard/fetch-task-list-download-multiple-employee?...
const downloadTasksCsv = async (filters) => {
    try {
        const qs = buildDownloadParams(filters);
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-task-list-download-multiple-employee?${qs}`);
        if (data?.code === 200 && Array.isArray(data.data)) {
            const headers = ["Employee", "Project", "Folder", "Task", "Status", "Start Date", "End Date", "Duration"];
            const rows = data.data.map((t) => [
                t.employee_name || "-", t.project_name || "-", t.folder_name || "-",
                t.title || "-", t.status || "-", t.start_date || "-", t.end_date || "-", t.duration || "-",
            ]);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Tasks");
            XLSX.writeFile(wb, "Task_Report.xlsx");
            return true;
        }
        return false;
    } catch { return false; }
};

// GET /mobile/admin-dashboard/fetch-task-list-download-non-consolidated-multiple-employee?...
const downloadTasksConsolidated = async (filters) => {
    try {
        const qs = buildDownloadParams(filters);
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/fetch-task-list-download-non-consolidated-multiple-employee?${qs}`);
        if (data?.code === 200 && Array.isArray(data.data)) {
            const headers = ["Employee", "Project", "Folder", "Task", "Status", "Date", "Time Spent"];
            const rows = data.data.map((t) => [
                t.employee_name || "-", t.project_name || "-", t.folder_name || "-",
                t.title || "-", t.status || "-", t.date || "-", t.time_spent || "-",
            ]);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Consolidated Tasks");
            XLSX.writeFile(wb, "Task_Report_Consolidated.xlsx");
            return true;
        }
        return false;
    } catch { return false; }
};

// ─── GPS Tracking ────────────────────────────────────────────────────────────

// GET /mobile/geo-location/get-all-employees?status=
const getGpsEmployees = async (status = "") => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/geo-location/get-all-employees?status=${status}`);
        return data?.code === 200 ? (data.data || []) : [];
    } catch { return []; }
};

// POST /mobile/geo-location/get-geo-log
// Backend wraps the points: { code, data: { geoLog: [...], timezone, status, ... } }
const getGeoLog = async ({ employeeId, startDate, endDate }) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/geo-location/get-geo-log", {
            employee_id: employeeId, start_date: startDate, end_date: endDate,
        });
        return data?.code === 200 ? (data.data?.geoLog || []) : [];
    } catch { return []; }
};

// POST /mobile/geo-location/get-total-task-time
const getTaskTime = async ({ employeeId, startDate, endDate }) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/geo-location/get-total-task-time", {
            employee_id: employeeId, start_date: startDate, end_date: endDate,
        });
        return data?.code === 200 ? data.data : null;
    } catch { return null; }
};

// ─── Employee Tasks ──────────────────────────────────────────────────────────

// GET /mobile/admin-dashboard/get-project-silah?skip=&limit=
const getEmployeeProjects = async () => {
    try {
        const { data } = await apiService.apiInstance.get("/mobile/admin-dashboard/get-project-silah?skip=0&limit=999999");
        return data?.code === 200 ? (data.data || []) : [];
    } catch { return []; }
};

// GET /mobile/admin-dashboard/get-project-folder-silah?skip=0&limit=...&project_id=
const getEmployeeFolders = async (projectId) => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/get-project-folder-silah?skip=0&limit=999999&project_id=${projectId}`);
        return data?.code === 200 ? (data.data || []) : [];
    } catch { return []; }
};

// GET /mobile/admin-dashboard/get-project-task-silah?...
const getEmployeeTaskList = async ({ skip = 0, limit = 10, search = "", taskId, projectId, folderName, sortColumn, sortOrder } = {}) => {
    try {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (search) params.set("search", search);
        if (taskId) params.set("task_id", taskId);
        if (projectId) params.set("project_id", projectId);
        if (folderName) params.set("folder_name", folderName);
        if (sortColumn) params.set("sortColumn", sortColumn);
        if (sortOrder) params.set("sortOrder", sortOrder);
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/get-project-task-silah?${params}`);
        if (data?.code === 200) return { rows: data.data || [], count: data.count || 0 };
        return { rows: [], count: 0 };
    } catch { return { rows: [], count: 0 }; }
};

// POST /mobile/admin-dashboard/create-project-tasks
const createEmployeeTask = async ({ title, projectId, folderName, employeeId, description }) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/create-project-tasks", {
            title, project_id: projectId, folder_name: folderName, employee_id: employeeId, description,
        });
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to create task" }; }
};

// POST /mobile/admin-dashboard/update-project-task-employee
const updateEmployeeTask = async ({ taskId, title, projectId, folderName, description }) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/update-project-task-employee", {
            task_id: taskId, title, project_id: projectId, folder_name: folderName, description,
        });
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to update task" }; }
};

// DELETE /mobile/admin-dashboard/delete-project-task-employee?_id=
const deleteEmployeeTask = async (taskId) => {
    try {
        const { data } = await apiService.apiInstance.delete(`/mobile/admin-dashboard/delete-project-task-employee?_id=${taskId}`);
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to delete task" }; }
};

// GET /mobile/admin-dashboard/start-project-task?task_id=
const startTask = async (taskId) => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/start-project-task?task_id=${taskId}`);
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to start task" }; }
};

// GET /mobile/admin-dashboard/stop-project-task?task_id=
const stopTask = async (taskId) => {
    try {
        const { data } = await apiService.apiInstance.get(`/mobile/admin-dashboard/stop-project-task?task_id=${taskId}`);
        return { success: data?.code === 200, message: data?.message || "" };
    } catch { return { success: false, message: "Failed to stop task" }; }
};

// POST /mobile/admin-dashboard/add-remaining-time
const setRemainingTime = async (taskId, remainingTime) => {
    try {
        const { data } = await apiService.apiInstance.post("/mobile/admin-dashboard/add-remaining-time", {
            task_id: taskId, remaining_time: remainingTime,
        });
        return { success: data?.statusCode === 200 || data?.code === 200, message: data?.data?.message || data?.message || "" };
    } catch { return { success: false, message: "Failed to set remaining time" }; }
};

// ─── Shared: Employees & Managers ────────────────────────────────────────────

const getEmployeeList = async () => {
    try {
        const { data } = await apiService.apiInstance.post("/user/users", {
            skip: "", limit: "",
        });
        const users = Array.isArray(data?.data) ? data.data : [];
        return users.map((u) => ({ value: String(u.id ?? u.u_id ?? u.emp_id), label: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email }));
    } catch { return []; }
};

const getManagerList = async () => {
    // Try both endpoint variants — Laravel helper uses /user/get-non-admin, some envs use /user/get-all-nonadmin
    const endpoints = ["/user/get-non-admin", "/user/get-all-nonadmin"];
    for (const endpoint of endpoints) {
        try {
            const { data } = await apiService.apiInstance.get(endpoint);
            const users = Array.isArray(data?.data) ? data.data : [];
            if (users.length > 0) {
                return users.map((m) => ({ value: String(m.emp_id ?? m.id ?? m.u_id ?? m._id), label: `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.name || m.email }));
            }
        } catch { /* try next endpoint */ }
    }
    return [];
};

export {
    // Projects
    getProjects, getAllProjects, createProject, updateProject, deleteProject, assignAllEmployeesToProjects, bulkImportProjects,
    // Folders
    getFolders, getProjectDetails,
    // Admin Tasks
    getTaskList, createTask, updateTask, deleteTask, bulkImportTasks,
    // Downloads
    downloadTasksCsv, downloadTasksConsolidated,
    // GPS
    getGpsEmployees, getGeoLog, getTaskTime,
    // Employee Tasks
    getEmployeeProjects, getEmployeeFolders, getEmployeeTaskList,
    createEmployeeTask, updateEmployeeTask, deleteEmployeeTask,
    startTask, stopTask, setRemainingTime,
    // Shared
    getEmployeeList, getManagerList,
};

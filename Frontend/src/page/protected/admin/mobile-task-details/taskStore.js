import { create } from "zustand";
import moment from "moment-timezone";
import {
    getTaskList, createTask, updateTask, deleteTask,
    getAllProjects, getFolders, getEmployeeList, getManagerList,
    downloadTasksCsv, downloadTasksConsolidated, bulkImportTasks,
} from "./service";

const today = moment().format("YYYY-MM-DD");

export const useTaskStore = create((set, get) => ({
    rows: [],
    totalCount: 0,
    projects: [],
    folders: [],
    employees: [],
    managers: [],
    loading: false,
    tableLoading: false,
    error: null,
    successMsg: null,

    // Filters
    filters: {
        project: "", folder: "", employee: [], manager: "",
        startDate: today, endDate: today, search: "",
    },
    pagination: { page: 1, pageSize: 10, sortColumn: "", sortOrder: "" },

    // Modal
    taskModalOpen: false,
    editingTask: null,
    importModalOpen: false,

    clearMessages: () => set({ error: null, successMsg: null }),

    setFilter: (key, value) => set((s) => ({
        filters: { ...s.filters, [key]: value },
        pagination: { ...s.pagination, page: 1 },
    })),

    setPagination: (key, value) => set((s) => ({
        pagination: { ...s.pagination, [key]: value },
    })),

    loadInitialData: async () => {
        set({ loading: true });
        const [projects, employees, managers] = await Promise.all([
            getAllProjects(), getEmployeeList(), getManagerList(),
        ]);
        const { filters, pagination } = get();
        const result = await getTaskList({ startDate: filters.startDate, endDate: filters.endDate, limit: pagination.pageSize });
        set({
            projects: projects.map((p) => ({ value: p._id, label: p.title })),
            employees, managers,
            rows: result.rows, totalCount: result.count, loading: false,
        });
    },

    fetchTasks: async () => {
        set({ tableLoading: true });
        const { filters, pagination } = get();
        const result = await getTaskList({
            skip: (pagination.page - 1) * pagination.pageSize,
            limit: pagination.pageSize,
            search: filters.search,
            employeeIds: filters.employee.length ? filters.employee : undefined,
            managerId: filters.manager || undefined,
            projectId: filters.project || undefined,
            folderId: filters.folder || undefined,
            startDate: filters.startDate, endDate: filters.endDate,
            sortColumn: pagination.sortColumn, sortOrder: pagination.sortOrder,
        });
        set({ rows: result.rows, totalCount: result.count, tableLoading: false });
    },

    fetchFolders: async (projectId) => {
        if (!projectId) { set({ folders: [] }); return; }
        const data = await getFolders(projectId);
        set({ folders: data.map((f) => ({ value: f._id, label: f.title || f.name })) });
    },

    createTask: async (taskData) => {
        const result = await createTask(taskData);
        if (result.success) {
            set({ successMsg: result.message || "Task created", taskModalOpen: false, editingTask: null });
            get().fetchTasks();
        } else set({ error: result.message });
        return result.success;
    },

    updateTask: async (taskData) => {
        const result = await updateTask(taskData);
        if (result.success) {
            set({ successMsg: result.message || "Task updated", taskModalOpen: false, editingTask: null });
            get().fetchTasks();
        } else set({ error: result.message });
        return result.success;
    },

    deleteTask: async (taskId) => {
        const result = await deleteTask(taskId);
        if (result.success) {
            set((s) => ({ rows: s.rows.filter((r) => r._id !== taskId), totalCount: s.totalCount - 1, successMsg: "Task deleted" }));
        } else set({ error: result.message });
        return result.success;
    },

    downloadCsv: async () => {
        const { filters } = get();
        const ok = await downloadTasksCsv(filters);
        if (!ok) set({ error: "Failed to download" });
    },

    downloadConsolidated: async () => {
        const { filters } = get();
        const ok = await downloadTasksConsolidated(filters);
        if (!ok) set({ error: "Failed to download" });
    },

    bulkImport: async (file) => {
        const result = await bulkImportTasks(file);
        if (result.success) {
            set({ successMsg: result.message || "Tasks imported", importModalOpen: false });
            get().fetchTasks();
        } else set({ error: result.message });
        return result.success;
    },

    openEdit: (task) => set({ editingTask: task, taskModalOpen: true }),
    openCreate: () => set({ editingTask: null, taskModalOpen: true }),

    handleSort: (col) => {
        const { pagination } = get();
        const order = pagination.sortColumn === col && pagination.sortOrder === "D" ? "A" : "D";
        set({ pagination: { ...pagination, sortColumn: col, sortOrder: order, page: 1 } });
    },
}));

import { create } from "zustand";
import moment from "moment-timezone";
import {
    getEmployeeProjects, getEmployeeFolders, getEmployeeTaskList,
    createEmployeeTask, updateEmployeeTask, deleteEmployeeTask,
    startTask, stopTask, setRemainingTime,
} from "./service";

const TIMER_STORAGE_KEY = "emp_running_tasks";

const loadTimers = () => {
    try { return JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY)) || {}; } catch { return {}; }
};
const saveTimers = (timers) => localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));

const today = moment().format("YYYY-MM-DD");

export const useEmployeeTaskStore = create((set, get) => ({
    rows: [],
    totalCount: 0,
    projects: [],
    folders: [],
    loading: false,
    tableLoading: false,
    error: null,
    successMsg: null,

    runningTimers: loadTimers(), // { [taskId]: { startedAt: timestamp, elapsed: seconds } }
    intervals: {},

    filters: { project: "", folder: "", search: "", startDate: today, endDate: today },
    pagination: { page: 1, pageSize: 10, sortColumn: "", sortOrder: "" },

    taskModalOpen: false,
    editingTask: null,

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
        const projects = await getEmployeeProjects();
        set({ projects: projects.map((p) => ({ value: p._id, label: p.title })) });
        await get().fetchTasks();
        set({ loading: false });
        get().restoreTimers();
    },

    fetchTasks: async () => {
        set({ tableLoading: true });
        const { filters, pagination } = get();
        const result = await getEmployeeTaskList({
            skip: (pagination.page - 1) * pagination.pageSize,
            limit: pagination.pageSize,
            search: filters.search,
            projectId: filters.project || undefined,
            folderName: filters.folder || undefined,
            sortColumn: pagination.sortColumn,
            sortOrder: pagination.sortOrder,
        });
        set({ rows: result.rows, totalCount: result.count, tableLoading: false });
    },

    fetchFolders: async (projectId) => {
        if (!projectId) { set({ folders: [] }); return; }
        const data = await getEmployeeFolders(projectId);
        set({ folders: data.map((f) => ({ value: f._id || f.name, label: f.title || f.name })) });
    },

    createTask: async (taskData) => {
        const result = await createEmployeeTask(taskData);
        if (result.success) {
            set({ successMsg: "Task created", taskModalOpen: false, editingTask: null });
            get().fetchTasks();
        } else set({ error: result.message });
        return result.success;
    },

    updateTask: async (taskData) => {
        const result = await updateEmployeeTask(taskData);
        if (result.success) {
            set({ successMsg: "Task updated", taskModalOpen: false, editingTask: null });
            get().fetchTasks();
        } else set({ error: result.message });
        return result.success;
    },

    deleteTask: async (taskId) => {
        const result = await deleteEmployeeTask(taskId);
        if (result.success) {
            set((s) => ({ rows: s.rows.filter((r) => r._id !== taskId), totalCount: s.totalCount - 1, successMsg: "Task deleted" }));
            get().clearTimer(taskId);
        } else set({ error: result.message });
        return result.success;
    },

    // ─── Timer Management ──────────────────────────────────────────────
    startTimer: async (taskId) => {
        const result = await startTask(taskId);
        if (result.success) {
            const timers = { ...get().runningTimers };
            timers[taskId] = { startedAt: Date.now(), elapsed: timers[taskId]?.elapsed || 0 };
            saveTimers(timers);
            set({ runningTimers: timers, successMsg: "Task started" });
            get().tickTimer(taskId);
            get().fetchTasks();
        } else set({ error: result.message });
    },

    stopTimer: async (taskId) => {
        const result = await stopTask(taskId);
        if (result.success) {
            get().clearTimer(taskId);
            set({ successMsg: "Task stopped" });
            get().fetchTasks();
        } else set({ error: result.message });
    },

    tickTimer: (taskId) => {
        const { intervals } = get();
        if (intervals[taskId]) clearInterval(intervals[taskId]);
        const id = setInterval(() => {
            set((s) => {
                const timers = { ...s.runningTimers };
                if (!timers[taskId]) { clearInterval(id); return s; }
                const elapsed = timers[taskId].elapsed + 1;
                timers[taskId] = { ...timers[taskId], elapsed };
                // Save to localStorage every 10 seconds
                if (elapsed % 10 === 0) saveTimers(timers);
                return { runningTimers: timers };
            });
        }, 1000);
        set((s) => ({ intervals: { ...s.intervals, [taskId]: id } }));
    },

    clearTimer: (taskId) => {
        const { intervals, runningTimers } = get();
        if (intervals[taskId]) clearInterval(intervals[taskId]);
        const newIntervals = { ...intervals };
        delete newIntervals[taskId];
        const newTimers = { ...runningTimers };
        delete newTimers[taskId];
        saveTimers(newTimers);
        set({ intervals: newIntervals, runningTimers: newTimers });
    },

    restoreTimers: () => {
        const timers = get().runningTimers;
        Object.keys(timers).forEach((taskId) => {
            // Resume elapsed time from when it was saved
            const timer = timers[taskId];
            if (timer.startedAt) {
                const secondsSinceSave = Math.floor((Date.now() - timer.startedAt) / 1000);
                timer.elapsed = (timer.elapsed || 0) + secondsSinceSave;
                timer.startedAt = Date.now();
            }
            get().tickTimer(taskId);
        });
        saveTimers(timers);
        set({ runningTimers: { ...timers } });
    },

    setRemainingTime: async (taskId, time) => {
        const result = await setRemainingTime(taskId, time);
        if (result.success) set({ successMsg: "Remaining time updated" });
        else set({ error: result.message });
    },

    formatElapsed: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },

    openEdit: (task) => set({ editingTask: task, taskModalOpen: true }),
    openCreate: () => set({ editingTask: null, taskModalOpen: true }),

    // Cleanup all intervals on unmount
    cleanup: () => {
        const { intervals } = get();
        Object.values(intervals).forEach(clearInterval);
        set({ intervals: {} });
    },
}));

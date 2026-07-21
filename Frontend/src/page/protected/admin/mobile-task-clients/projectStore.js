import { create } from "zustand";
import {
    getProjects, getAllProjects, createProject, updateProject, deleteProject,
    assignAllEmployeesToProjects, bulkImportProjects,
    getEmployeeList, getManagerList,
} from "../mobile-task-details/service";

export const useProjectStore = create((set, get) => ({
    projects: [],
    totalCount: 0,
    employees: [],
    managers: [],
    loading: false,
    tableLoading: false,
    error: null,
    successMsg: null,

    pagination: { page: 1, pageSize: 10, sortOrder: "", search: "" },

    createModalOpen: false,
    editModalOpen: false,
    editingProject: null,
    importModalOpen: false,

    clearMessages: () => set({ error: null, successMsg: null }),

    setPagination: (key, value) => {
        set((s) => ({ pagination: { ...s.pagination, [key]: value } }));
    },

    loadInitialData: async () => {
        set({ loading: true });
        const [employees, managers] = await Promise.all([getEmployeeList(), getManagerList()]);
        set({ employees, managers });
        await get().fetchProjects();
        set({ loading: false });
    },

    fetchProjects: async () => {
        set({ tableLoading: true });
        const { pagination } = get();
        const result = await getProjects({
            skip: (pagination.page - 1) * pagination.pageSize,
            limit: pagination.pageSize,
            search: pagination.search,
            sortOrder: pagination.sortOrder,
        });
        set({ projects: result.rows, totalCount: result.count, tableLoading: false });
    },

    createProject: async (projectData) => {
        const result = await createProject(projectData);
        if (result.success) {
            set({ successMsg: result.message || "Project created", createModalOpen: false });
            get().fetchProjects();
        } else set({ error: result.message });
        return result.success;
    },

    updateProject: async (projectData) => {
        const result = await updateProject(projectData);
        if (result.success) {
            set({ successMsg: result.message || "Project updated", editModalOpen: false, editingProject: null });
            get().fetchProjects();
        } else set({ error: result.message });
        return result.success;
    },

    deleteProject: async (projectId) => {
        const result = await deleteProject(projectId);
        if (result.success) {
            set({ successMsg: "Project deleted" });
            get().fetchProjects();
        } else set({ error: result.message });
        return result.success;
    },

    assignAllEmployees: async () => {
        const result = await assignAllEmployeesToProjects();
        if (result.success) set({ successMsg: result.message || "Assigned all employees" });
        else set({ error: result.message });
        return result.success;
    },

    bulkImport: async (file) => {
        const result = await bulkImportProjects(file);
        if (result.success) {
            set({ successMsg: result.message || "Projects imported", importModalOpen: false });
            get().fetchProjects();
        } else set({ error: result.message });
        return result.success;
    },

    openEdit: (project) => set({ editingProject: project, editModalOpen: true }),
    openCreate: () => set({ editingProject: null, createModalOpen: true }),
}));

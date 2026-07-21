import { create } from "zustand";
import {
    getEmailReports,
    getEmailReportById,
    addEmailReport,
    editEmailReport,
    deleteEmailReport,
    sendTestEmail,
    getDepartments,
    getEmployees,
    getLocations,
    getShifts,
    buildReportPayload,
    buildEditPayload,
    validateReportForm,
    exportReportsCsv,
    exportReportsPdf,
} from "./service";

export const useAutoEmailReportStore = create((set, get) => ({
    // ── Data ──────────────────────────────────────────────────────────────
    reports: [],
    totalCount: 0,

    // ── Filter Options ────────────────────────────────────────────────────
    departments: [],
    employees: [],
    locations: [],
    shifts: [],

    // ── UI State ──────────────────────────────────────────────────────────
    loading: false,
    tableLoading: false,
    saving: false,
    deleting: false,
    testingEmail: false,
    error: null,

    // ── Pagination / Search / Sort ────────────────────────────────────────
    pagination: {
        page: 1,
        pageSize: 10,
        sortColumn: "",
        sortOrder: "",
    },
    search: "",

    // ── Dialog State ──────────────────────────────────────────────────────
    dialogOpen: false,
    dialogMode: "create", // "create" | "edit"
    editReportData: null,
    initialSelections: { employees: [], departments: [], locations: [], shifts: [] },

    deleteDialogOpen: false,
    deleteReportId: null,

    // ── Setters ───────────────────────────────────────────────────────────
    setSearch: (value) => {
        set({ search: value, pagination: { ...get().pagination, page: 1 } });
    },

    setPagination: (key, value) => {
        set((state) => ({
            pagination: { ...state.pagination, [key]: value },
        }));
    },

    openCreateDialog: () => {
        set({ dialogOpen: true, dialogMode: "create", editReportData: null, initialSelections: { employees: [], departments: [], locations: [], shifts: [] } });
    },

    openEditDialog: async (reportId) => {
        try {
            set({ dialogOpen: true, dialogMode: "edit", editReportData: null });
            const result = await getEmailReportById(reportId);
            if (result.success) {
                const initSelections = {
                    employees: (result.data.employees || []).map((e) => e.id),
                    departments: (result.data.departments || []).map((d) => d.id),
                    locations: (result.data.locations || []).map((l) => l.id),
                    shifts: (result.data.shifts || []).map((s) => s.id),
                };
                set({ editReportData: result.data, initialSelections: initSelections });
            } else {
                set({ dialogOpen: false, error: result.message });
            }
        } catch (error) {
            console.error("Open edit dialog error:", error);
            set({ dialogOpen: false, error: "Failed to load report for editing" });
        }
    },

    closeDialog: () => {
        set({ dialogOpen: false, editReportData: null, dialogMode: "create" });
    },

    openDeleteDialog: (reportId) => {
        set({ deleteDialogOpen: true, deleteReportId: reportId });
    },

    closeDeleteDialog: () => {
        set({ deleteDialogOpen: false, deleteReportId: null });
    },

    clearError: () => set({ error: null }),

    // ── Actions ───────────────────────────────────────────────────────────

    loadInitialData: async () => {
        try {
            set({ loading: true, error: null });

            const [reportsResult, departments, employees, locations, shifts] = await Promise.all([
                getEmailReports({ skip: 0, limit: get().pagination.pageSize }),
                getDepartments(),
                getEmployees(),
                getLocations(),
                getShifts(),
            ]);

            set({
                reports: reportsResult.reports,
                totalCount: reportsResult.totalCount,
                departments,
                employees,
                locations,
                shifts,
                loading: false,
            });
        } catch (error) {
            console.error("Load initial data error:", error);
            set({ loading: false, error: "Failed to load data" });
        }
    },

    fetchReports: async () => {
        try {
            set({ tableLoading: true });
            const { pagination, search } = get();

            const result = await getEmailReports({
                skip: (pagination.page - 1) * pagination.pageSize,
                limit: pagination.pageSize,
                name: search,
                sortColumn: pagination.sortColumn,
                sortOrder: pagination.sortOrder,
            });

            set({
                reports: result.reports,
                totalCount: result.totalCount,
                tableLoading: false,
            });
        } catch (error) {
            console.error("Fetch reports error:", error);
            set({ tableLoading: false });
        }
    },

    saveReport: async (formData) => {
        const validationError = validateReportForm(formData);
        if (validationError) return { success: false, message: validationError };

        try {
            set({ saving: true });
            const { dialogMode, initialSelections } = get();
            let result;

            if (dialogMode === "create") {
                const payload = buildReportPayload(formData);
                result = await addEmailReport(payload);
            } else {
                const payload = buildEditPayload(formData, initialSelections);
                result = await editEmailReport(payload);
            }

            set({ saving: false });

            if (result.success) {
                get().closeDialog();
                get().fetchReports();
            }

            return result;
        } catch (error) {
            console.error("Save report error:", error);
            set({ saving: false });
            return { success: false, message: "Failed to save report" };
        }
    },

    confirmDelete: async () => {
        const { deleteReportId } = get();
        if (!deleteReportId) return;

        try {
            set({ deleting: true });
            const result = await deleteEmailReport(deleteReportId);

            set({ deleting: false });

            if (result.success) {
                get().closeDeleteDialog();
                get().fetchReports();
            }

            return result;
        } catch (error) {
            console.error("Delete report error:", error);
            set({ deleting: false });
            return { success: false, message: "Failed to delete report" };
        }
    },

    sendTestEmail: async (formData) => {
        const validationError = validateReportForm(formData);
        if (validationError) return { success: false, message: validationError };

        try {
            set({ testingEmail: true });
            const payload = buildReportPayload(formData);
            const result = await sendTestEmail(payload);
            set({ testingEmail: false });
            return result;
        } catch (error) {
            console.error("Test email error:", error);
            set({ testingEmail: false });
            return { success: false, message: "Failed to send test email" };
        }
    },

    exportCsv: async () => {
        try {
            const { search, pagination } = get();
            const result = await getEmailReports({ skip: 0, limit: 50000, name: search, sortColumn: pagination.sortColumn, sortOrder: pagination.sortOrder });
            exportReportsCsv(result.reports);
        } catch (error) {
            console.error("Export CSV error:", error);
        }
    },

    exportPdf: async () => {
        try {
            const { search, pagination } = get();
            const result = await getEmailReports({ skip: 0, limit: 50000, name: search, sortColumn: pagination.sortColumn, sortOrder: pagination.sortOrder });
            exportReportsPdf(result.reports);
        } catch (error) {
            console.error("Export PDF error:", error);
        }
    },
}));

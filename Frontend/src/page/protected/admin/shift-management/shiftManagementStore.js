import { create } from "zustand";
import {
    getShifts,
    getShiftById,
    createShift,
    updateShift,
    deleteShift,
    exportToExcel,
    exportToCSV,
    exportToPDF,
} from "./service";

export const useShiftManagementStore = create((set, get) => ({
    // ── Data ────────────────────────────────────────────────────────────────
    shifts: [],
    totalCount: 0,

    // ── UI State ────────────────────────────────────────────────────────────
    loading: false,
    saving: false,
    deleting: false,
    error: null,
    successMsg: null,

    // ── Pagination ──────────────────────────────────────────────────────────
    pagination: { page: 1, pageSize: 10 },
    search: "",

    // ── Dialog State ────────────────────────────────────────────────────────
    createDialogOpen: false,

    editDialogOpen: false,
    editShiftData: null,

    deleteDialogOpen: false,
    deleteShiftId: null,

    // ── Setters ─────────────────────────────────────────────────────────────
    setSearch: (value) => {
        set({ search: value, pagination: { ...get().pagination, page: 1 } });
    },

    clearError: () => set({ error: null }),
    clearSuccess: () => set({ successMsg: null }),

    // ── Dialog Openers / Closers ────────────────────────────────────────────

    openCreateDialog: () => set({ createDialogOpen: true }),
    closeCreateDialog: () => set({ createDialogOpen: false }),

    openEditDialog: async (shiftId) => {
        try {
            const result = await getShiftById(shiftId);
            if (result.success) {
                set({ editDialogOpen: true, editShiftData: result.data });
            } else {
                set({ error: result.message });
            }
        } catch {
            set({ error: "Failed to load shift details" });
        }
    },
    closeEditDialog: () => set({ editDialogOpen: false, editShiftData: null }),

    openDeleteDialog: (shiftId) => set({ deleteDialogOpen: true, deleteShiftId: shiftId }),
    closeDeleteDialog: () => set({ deleteDialogOpen: false, deleteShiftId: null }),

    // ── Actions ─────────────────────────────────────────────────────────────

    loadInitialData: async () => {
        try {
            set({ loading: true, error: null });
            const result = await getShifts({ skip: 0, limit: get().pagination.pageSize });
            const updates = { loading: false };

            if (result.success) {
                updates.shifts = result.data;
                updates.totalCount = result.totalCount;
            } else {
                updates.error = result.message;
            }
            set(updates);
        } catch (error) {
            console.error("Load initial data error:", error);
            set({ loading: false, error: "Failed to load data" });
        }
    },

    fetchShifts: async (skip, limit) => {
        try {
            const result = await getShifts({ skip, limit });
            if (result.success) {
                set({
                    shifts: result.data,
                    totalCount: result.totalCount,
                });
            }
            return result;
        } catch (error) {
            console.error("Fetch shifts error:", error);
            return { success: false };
        }
    },

    refreshShifts: async () => {
        const { pagination } = get();
        const skip = (pagination.page - 1) * pagination.pageSize;
        await get().fetchShifts(skip, pagination.pageSize);
    },

    changePage: async (page) => {
        set((state) => ({ pagination: { ...state.pagination, page } }));
        const { pagination } = get();
        const skip = (page - 1) * pagination.pageSize;
        await get().fetchShifts(skip, pagination.pageSize);
    },

    changePageSize: async (pageSize) => {
        set({ pagination: { page: 1, pageSize } });
        await get().fetchShifts(0, pageSize);
    },

    // ── CRUD Actions ────────────────────────────────────────────────────────

    saveShift: async (formData) => {
        try {
            set({ saving: true, error: null });
            const result = await createShift(formData);
            set({ saving: false });

            if (result.success) {
                get().closeCreateDialog();
                set({ successMsg: result.message });
                await get().refreshShifts();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Save shift error:", error);
            set({ saving: false, error: "Failed to create shift" });
            return { success: false, message: "Failed to create shift" };
        }
    },

    saveEditShift: async (shiftId, formData) => {
        try {
            set({ saving: true, error: null });
            const result = await updateShift(shiftId, formData);
            set({ saving: false });

            if (result.success) {
                get().closeEditDialog();
                set({ successMsg: result.message });
                await get().refreshShifts();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Edit shift error:", error);
            set({ saving: false, error: "Failed to update shift" });
            return { success: false, message: "Failed to update shift" };
        }
    },

    confirmDeleteShift: async () => {
        const { deleteShiftId } = get();
        if (!deleteShiftId) return;

        try {
            set({ deleting: true, error: null });
            const result = await deleteShift(deleteShiftId);
            set({ deleting: false });

            if (result.success) {
                get().closeDeleteDialog();
                set({ successMsg: result.message });
                await get().refreshShifts();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Delete shift error:", error);
            set({ deleting: false, error: "Failed to delete shift" });
            return { success: false };
        }
    },

    // ── Export ───────────────────────────────────────────────────────────────

    exportExcel: () => exportToExcel(get().shifts),
    exportCsv: () => exportToCSV(get().shifts),
    exportPdf: () => exportToPDF(get().shifts),
}));

import { create } from "zustand";
import {
    getLocationsDept,
    getAllDepartments,
    addLocation,
    updateLocation,
    deleteLocation,
    addDepartmentToLocation,
    getDepartmentsByLocation,
    deleteDeptFromLocation,
    deleteDepartment,
    exportLocationsCsv,
    exportLocationsPdf,
} from "./service";

export const useLocationDepartmentStore = create((set, get) => ({
    // ── Data ──────────────────────────────────────────────────────────────
    locations: [],
    allDepartments: [],
    orgTimezone: "",

    // ── UI State ──────────────────────────────────────────────────────────
    loading: false,
    saving: false,
    deleting: false,
    error: null,
    successMsg: null,

    // ── Pagination ───────────────────────────────────────────────────────
    pagination: { page: 1, pageSize: 10 },
    search: "",

    // ── Selection ────────────────────────────────────────────────────────
    selectedRows: [],

    // ── Dialog State ─────────────────────────────────────────────────────
    addLocationDialogOpen: false,
    editLocationDialogOpen: false,
    editLocationData: null,

    addDeptDialogOpen: false,
    addDeptLocationId: null,

    deleteDeptDialogOpen: false,
    deleteDeptLocationId: null,
    deleteDeptLocationDepts: [],

    deleteLocationDialogOpen: false,
    deleteLocationId: null,

    deleteDepartmentsDialogOpen: false,

    // ── Setters ──────────────────────────────────────────────────────────
    setSearch: (value) => {
        set({ search: value, pagination: { ...get().pagination, page: 1 } });
    },

    setPagination: (key, value) => {
        set((state) => ({ pagination: { ...state.pagination, [key]: value } }));
    },

    setSelectedRows: (rows) => set({ selectedRows: rows }),

    toggleRow: (id) => {
        const { selectedRows } = get();
        set({
            selectedRows: selectedRows.includes(id)
                ? selectedRows.filter((r) => r !== id)
                : [...selectedRows, id],
        });
    },

    toggleAll: (pageIds) => {
        const { selectedRows } = get();
        const allSelected = pageIds.every((id) => selectedRows.includes(id));
        set({ selectedRows: allSelected ? [] : pageIds });
    },

    clearError: () => set({ error: null }),
    clearSuccess: () => set({ successMsg: null }),

    // ── Dialog Openers / Closers ─────────────────────────────────────────

    openAddLocationDialog: () => set({ addLocationDialogOpen: true }),
    closeAddLocationDialog: () => set({ addLocationDialogOpen: false }),

    openEditLocationDialog: (location) => set({ editLocationDialogOpen: true, editLocationData: location }),
    closeEditLocationDialog: () => set({ editLocationDialogOpen: false, editLocationData: null }),

    openAddDeptDialog: (locationId) => set({ addDeptDialogOpen: true, addDeptLocationId: locationId }),
    closeAddDeptDialog: () => set({ addDeptDialogOpen: false, addDeptLocationId: null }),

    openDeleteDeptDialog: async (locationId) => {
        set({ deleteDeptDialogOpen: true, deleteDeptLocationId: locationId, deleteDeptLocationDepts: [] });
        const result = await getDepartmentsByLocation(locationId);
        if (result.success) {
            set({ deleteDeptLocationDepts: result.data });
        }
    },
    closeDeleteDeptDialog: () => set({ deleteDeptDialogOpen: false, deleteDeptLocationId: null, deleteDeptLocationDepts: [] }),

    openDeleteLocationDialog: (locationId) => set({ deleteLocationDialogOpen: true, deleteLocationId: locationId }),
    closeDeleteLocationDialog: () => set({ deleteLocationDialogOpen: false, deleteLocationId: null }),

    openDeleteDepartmentsDialog: () => set({ deleteDepartmentsDialogOpen: true }),
    closeDeleteDepartmentsDialog: () => set({ deleteDepartmentsDialogOpen: false }),

    // ── Actions ──────────────────────────────────────────────────────────

    loadInitialData: async () => {
        try {
            set({ loading: true, error: null });
            const [locResult, deptResult] = await Promise.all([
                getLocationsDept(),
                getAllDepartments(),
            ]);

            set({
                locations: locResult.success ? locResult.data : [],
                orgTimezone: locResult.orgTimezone || "",
                allDepartments: deptResult.success ? deptResult.data : [],
                loading: false,
            });

            if (!locResult.success) {
                set({ error: locResult.message });
            }
        } catch (error) {
            console.error("Load initial data error:", error);
            set({ loading: false, error: "Failed to load data" });
        }
    },

    refreshLocations: async () => {
        try {
            const result = await getLocationsDept();
            if (result.success) {
                set({ locations: result.data, orgTimezone: result.orgTimezone || "" });
            }
        } catch (error) {
            console.error("Refresh locations error:", error);
        }
    },

    refreshDepartments: async () => {
        try {
            const result = await getAllDepartments();
            if (result.success) {
                set({ allDepartments: result.data });
            }
        } catch (error) {
            console.error("Refresh departments error:", error);
        }
    },

    saveLocation: async (formData) => {
        try {
            set({ saving: true, error: null });
            const result = await addLocation(formData);
            set({ saving: false });

            if (result.success) {
                get().closeAddLocationDialog();
                set({ successMsg: result.message });
                await Promise.all([get().refreshLocations(), get().refreshDepartments()]);
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Save location error:", error);
            set({ saving: false, error: "Failed to add location" });
            return { success: false, message: "Failed to add location" };
        }
    },

    saveEditLocation: async (formData) => {
        try {
            set({ saving: true, error: null });
            const result = await updateLocation(formData);
            set({ saving: false });

            if (result.success) {
                get().closeEditLocationDialog();
                set({ successMsg: result.message });
                await get().refreshLocations();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Edit location error:", error);
            set({ saving: false, error: "Failed to update location" });
            return { success: false, message: "Failed to update location" };
        }
    },

    confirmDeleteLocation: async () => {
        const { deleteLocationId } = get();
        if (!deleteLocationId) return;

        try {
            set({ deleting: true, error: null });
            const result = await deleteLocation(deleteLocationId);
            set({ deleting: false });

            if (result.success) {
                get().closeDeleteLocationDialog();
                set({ successMsg: result.message, selectedRows: [] });
                await get().refreshLocations();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Delete location error:", error);
            set({ deleting: false, error: "Failed to delete location" });
            return { success: false, message: "Failed to delete location" };
        }
    },

    saveAddDept: async ({ departmentIds, departmentNames }) => {
        const { addDeptLocationId } = get();
        if (!addDeptLocationId) return;

        try {
            set({ saving: true, error: null });
            const result = await addDepartmentToLocation({
                locationId: addDeptLocationId,
                departmentIds,
                departmentNames,
            });
            set({ saving: false });

            if (result.success) {
                get().closeAddDeptDialog();
                set({ successMsg: result.message });
                await Promise.all([get().refreshLocations(), get().refreshDepartments()]);
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Add dept to location error:", error);
            set({ saving: false, error: "Failed to add department" });
            return { success: false, message: "Failed to add department" };
        }
    },

    confirmDeleteDeptFromLocation: async (departmentId) => {
        const { deleteDeptLocationId } = get();
        if (!deleteDeptLocationId || !departmentId) return;

        try {
            set({ deleting: true, error: null });
            const result = await deleteDeptFromLocation({
                locationId: deleteDeptLocationId,
                departmentId,
            });
            set({ deleting: false });

            if (result.success) {
                set((state) => ({
                    deleteDeptLocationDepts: state.deleteDeptLocationDepts.filter(
                        (d) => d.department_id !== departmentId
                    ),
                    successMsg: result.message,
                }));
                await get().refreshLocations();
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Delete dept from location error:", error);
            set({ deleting: false, error: "Failed to remove department" });
            return { success: false, message: "Failed to remove department" };
        }
    },

    confirmDeleteDepartment: async (departmentId) => {
        try {
            set({ deleting: true, error: null });
            const result = await deleteDepartment(departmentId);
            set({ deleting: false });

            if (result.success) {
                set({ successMsg: result.message });
                await Promise.all([get().refreshLocations(), get().refreshDepartments()]);
            } else {
                set({ error: result.message });
            }
            return result;
        } catch (error) {
            console.error("Delete department error:", error);
            set({ deleting: false, error: "Failed to delete department" });
            return { success: false, message: "Failed to delete department" };
        }
    },

    // ── Export ────────────────────────────────────────────────────────────

    exportCsv: () => {
        const { locations } = get();
        exportLocationsCsv(locations);
    },

    exportPdf: () => {
        const { locations } = get();
        exportLocationsPdf(locations);
    },
}));

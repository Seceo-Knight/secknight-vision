import { create } from "zustand";
import {
    getAlertPolicies,
    deletePolicy,
    applyRules,
} from "@/page/protected/admin/alerts/service";

export const useAlertPoliciesStore = create((set, get) => ({
    rows: [],
    totalCount: 0,
    loading: false,
    tableLoading: false,
    error: null,
    successMsg: null,
    selectedIds: [],

    pagination: {
        page: 1,
        pageSize: 10,
        sortColumn: "",
        sortOrder: "",
    },

    search: "",

    setSearch: (value) => {
        set({ search: value, pagination: { ...get().pagination, page: 1 } });
    },

    setPagination: (key, value) => {
        set((state) => ({
            pagination: { ...state.pagination, [key]: value },
        }));
    },

    toggleSelectRow: (id) => {
        set((state) => {
            const ids = state.selectedIds;
            return {
                selectedIds: ids.includes(id)
                    ? ids.filter((i) => i !== id)
                    : [...ids, id],
            };
        });
    },

    toggleSelectAll: () => {
        set((state) => {
            if (state.selectedIds.length === state.rows.length) {
                return { selectedIds: [] };
            }
            return { selectedIds: state.rows.map((r) => r.id) };
        });
    },

    clearMessages: () => set({ error: null, successMsg: null }),

    loadPolicies: async () => {
        try {
            set({ loading: true, error: null });
            const { pagination, search } = get();
            const result = await getAlertPolicies({
                skip: (pagination.page - 1) * pagination.pageSize,
                limit: pagination.pageSize,
                sortName: pagination.sortColumn,
                sortOrder: pagination.sortOrder,
                search,
            });
            set({
                rows: result.rows,
                totalCount: result.totalCount,
                loading: false,
                selectedIds: [],
            });
        } catch {
            set({ loading: false, error: "Failed to load alert policies" });
        }
    },

    fetchPolicies: async () => {
        try {
            set({ tableLoading: true });
            const { pagination, search } = get();
            const result = await getAlertPolicies({
                skip: (pagination.page - 1) * pagination.pageSize,
                limit: pagination.pageSize,
                sortName: pagination.sortColumn,
                sortOrder: pagination.sortOrder,
                search,
            });
            set({
                rows: result.rows,
                totalCount: result.totalCount,
                tableLoading: false,
                selectedIds: [],
            });
        } catch {
            set({ tableLoading: false });
        }
    },

    deletePolicy: async (policyId) => {
        const success = await deletePolicy(policyId);
        if (success) {
            set((state) => ({
                rows: state.rows.filter((r) => r.id !== policyId),
                totalCount: state.totalCount - 1,
                selectedIds: state.selectedIds.filter((id) => id !== policyId),
                successMsg: "Rule deleted successfully",
            }));
        } else {
            set({ error: "Failed to delete policy" });
        }
        return success;
    },

    applySelectedRules: async () => {
        const { selectedIds } = get();
        if (selectedIds.length === 0) {
            set({ error: "Please select at least one policy" });
            return false;
        }
        const result = await applyRules(selectedIds, 0);
        if (result.success) {
            set({ successMsg: result.message || "Rules applied successfully", selectedIds: [] });
        } else {
            set({ error: result.message });
        }
        return result.success;
    },

    applyAllRules: async () => {
        const result = await applyRules([], 1);
        if (result.success) {
            set({ successMsg: result.message || "All rules applied successfully" });
        } else {
            set({ error: result.message });
        }
        return result.success;
    },

    handleSort: (columnKey) => {
        const { pagination } = get();
        const newOrder =
            pagination.sortColumn === columnKey && pagination.sortOrder === "D"
                ? "A"
                : "D";
        set({
            pagination: {
                ...pagination,
                sortColumn: columnKey,
                sortOrder: newOrder,
                page: 1,
            },
        });
    },
}));

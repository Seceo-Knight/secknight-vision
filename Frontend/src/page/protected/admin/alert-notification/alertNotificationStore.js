import { create } from "zustand";
import moment from "moment-timezone";
import {
    getLocations,
    getDepartments,
    getEmployeeList,
    getAlertList,
} from "@/page/protected/admin/alerts/service";

const today = moment().format("YYYY-MM-DD");

export const useAlertNotificationStore = create((set, get) => ({
    rows: [],
    totalCount: 0,
    locations: [],
    departments: [],
    employees: [],
    loading: false,
    tableLoading: false,
    error: null,

    filters: {
        location: "all",
        department: "all",
        employee: "all",
        startDate: today,
        endDate: today,
        search: "",
    },

    pagination: {
        page: 1,
        pageSize: 10,
        sortColumn: "",
        sortOrder: "",
    },

    setFilter: (key, value) => {
        set((state) => ({
            filters: { ...state.filters, [key]: value },
            pagination: { ...state.pagination, page: 1 },
        }));
    },

    setPagination: (key, value) => {
        set((state) => ({
            pagination: { ...state.pagination, [key]: value },
        }));
    },

    loadInitialData: async () => {
        try {
            set({ loading: true, error: null });
            const { filters } = get();

            const [locations, departments, employees, result] = await Promise.all([
                getLocations(),
                getDepartments(),
                getEmployeeList(),
                getAlertList({
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                }),
            ]);

            set({
                locations,
                departments,
                employees,
                rows: result.rows,
                totalCount: result.totalCount,
                loading: false,
            });
        } catch {
            set({ loading: false, error: "Failed to load alert notifications" });
        }
    },

    fetchAlerts: async () => {
        try {
            set({ tableLoading: true });
            const { filters, pagination } = get();

            const result = await getAlertList({
                locationId: filters.location,
                departmentId: filters.department,
                employeeId: filters.employee,
                startDate: filters.startDate,
                endDate: filters.endDate,
                skip: (pagination.page - 1) * pagination.pageSize,
                limit: pagination.pageSize,
                sortName: pagination.sortColumn,
                sortOrder: pagination.sortOrder,
                search: filters.search,
            });

            set({
                rows: result.rows,
                totalCount: result.totalCount,
                tableLoading: false,
            });
        } catch {
            set({ tableLoading: false });
        }
    },

    fetchDepartmentsByLocation: async (locationId) => {
        const departments = await getDepartments(locationId);
        set({ departments });
    },

    fetchEmployeesByFilters: async (locationId, departmentId) => {
        const employees = await getEmployeeList({ locationId, departmentId });
        set({ employees });
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

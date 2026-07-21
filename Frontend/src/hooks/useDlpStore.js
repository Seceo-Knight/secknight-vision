import { create } from "zustand";
import moment from "moment-timezone";
import { getLocations, getDepartments, getEmployeeList } from "@/services/dlp.service";

/**
 * Factory that creates a Zustand store for any DLP module.
 *
 * @param {Object} config
 * @param {string}   config.name           - Module name for error messages
 * @param {Object}   [config.extraFilters] - Additional filter defaults (e.g. { type: "0" })
 * @param {function} config.fetchLogs      - (filters) => Promise<{ rows, totalDocs }>
 * @param {function} config.fetchExport    - (filters) => Promise<rows[]>
 * @param {function} config.exportCsv      - (rows, filters) => Promise
 * @param {function} config.exportPdf      - (rows, filters) => Promise
 * @returns {import('zustand').UseBoundStore}
 */
export const createDlpStore = (config) => {
    const { name, extraFilters = {}, fetchLogs, fetchExport, exportCsv, exportPdf } = config;

    return create((set, get) => ({
        rows: [],
        totalDocs: 0,
        tableLoading: false,

        locations: [],
        departments: [],
        employees: [],

        loading: false,
        exportLoading: false,

        filters: {
            locationId: "all",
            departmentId: "all",
            employeeId: "all",
            startDate: moment().format("YYYY-MM-DD"),
            endDate: moment().format("YYYY-MM-DD"),
            searchText: "",
            sortName: "",
            sortOrder: "",
            skip: 0,
            limit: 10,
            page: 1,
            ...extraFilters,
        },

        setFilter: (key, value) =>
            set((state) => ({ filters: { ...state.filters, [key]: value } })),

        setFilters: (updates) =>
            set((state) => ({ filters: { ...state.filters, ...updates } })),

        loadInitialData: async () => {
            try {
                set({ loading: true });
                const { filters } = get();

                const [locationRes, departmentRes, employeeRes, logsRes] = await Promise.all([
                    getLocations(),
                    getDepartments(),
                    getEmployeeList(),
                    fetchLogs(filters),
                ]);

                set({
                    locations: locationRes || [],
                    departments: departmentRes || [],
                    employees: employeeRes || [],
                    rows: logsRes?.rows || [],
                    totalDocs: logsRes?.totalDocs || 0,
                    loading: false,
                });
            } catch (error) {
                console.error(`${name}: Initial Load Error:`, error);
                set({ loading: false });
            }
        },

        fetchLogs: async () => {
            try {
                set({ tableLoading: true });
                const res = await fetchLogs(get().filters);
                set({
                    rows: res?.rows || [],
                    totalDocs: res?.totalDocs || 0,
                    tableLoading: false,
                });
            } catch (error) {
                console.error(`${name}: Fetch Logs Error:`, error);
                set({ tableLoading: false });
            }
        },

        fetchDepartmentsByLocation: async (locationId) => {
            try {
                const res = await getDepartments(
                    locationId && locationId !== "all" ? locationId : undefined
                );
                set({ departments: res || [] });
            } catch (error) {
                console.error(`${name}: Fetch Departments Error:`, error);
            }
        },

        fetchEmployeesByFilters: async () => {
            try {
                const { filters } = get();
                const res = await getEmployeeList({
                    locationId: filters.locationId,
                    departmentId: filters.departmentId,
                });
                set({ employees: res || [] });
            } catch (error) {
                console.error(`${name}: Fetch Employees Error:`, error);
            }
        },

        exportCsv: async () => {
            try {
                set({ exportLoading: true });
                const { filters } = get();
                const allRows = await fetchExport(filters);
                await exportCsv(allRows, filters);
                set({ exportLoading: false });
            } catch (error) {
                console.error(`${name}: Export CSV Error:`, error);
                set({ exportLoading: false });
            }
        },

        exportPdf: async () => {
            try {
                set({ exportLoading: true });
                const { filters } = get();
                const allRows = await fetchExport(filters);
                await exportPdf(allRows, filters);
                set({ exportLoading: false });
            } catch (error) {
                console.error(`${name}: Export PDF Error:`, error);
                set({ exportLoading: false });
            }
        },
    }));
};

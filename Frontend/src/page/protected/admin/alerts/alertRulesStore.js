import { create } from "zustand";
import useAdminSession from "@/sessions/adminSession";
import {
    getLocationsWithDepartments,
    getAllUsers,
    createRule,
    updateRule,
} from "./service";

const DEFAULT_FORM = {
    ruleName: "",
    ruleType: "",
    riskLevel: "MR",
    isMultipleAlerts: true,
    isDesktopNotify: false,
    note: "",
    allLocations: false,
    allDepartments: false,
    allEmployees: false,
    conditions: [{ type: "", cmp_operator: ">", cmp_argument: "" }],
    webAppType: "DMN",
    webAppValue: "",
};

export const useAlertRulesStore = create((set, get) => ({
    // Form state
    form: { ...DEFAULT_FORM },
    editId: null,
    isEditMode: false,

    // Data
    locationsWithDepts: [],
    selectedLocationIds: [],
    selectedDepartmentIds: [],
    selectedEmployeeIds: [],
    allEmployees: [],
    notifyUsers: [],
    selectedNotifyIds: [],

    // UI
    loading: false,
    saving: false,
    error: null,
    successMsg: null,

    clearMessages: () => set({ error: null, successMsg: null }),

    setFormField: (key, value) => {
        set((state) => ({ form: { ...state.form, [key]: value } }));
    },

    setRuleType: (type) => {
        const form = { ...get().form, ruleType: type };
        // Reset conditions based on rule type
        switch (type) {
            case "DWT":
                form.conditions = [{ type: "HUR", cmp_operator: ">", cmp_argument: "8" }];
                break;
            case "SEE": case "SSE": case "SSL":
                form.conditions = [{ type: "MNT", cmp_operator: ">", cmp_argument: "10" }];
                break;
            case "ABT":
                form.conditions = [{ type: "ABT", cmp_operator: ">", cmp_argument: "2" }];
                break;
            case "IDL":
                form.conditions = [{ type: "MNT", cmp_operator: ">", cmp_argument: "15" }];
                break;
            case "OFFL":
                form.conditions = [{ type: "MNT", cmp_operator: ">", cmp_argument: "15" }];
                break;
            case "STA":
                form.conditions = [{ type: "HUR", cmp_operator: ">", cmp_argument: "30" }];
                break;
            case "WDO": case "ASA":
                form.conditions = [];
                break;
            default:
                form.conditions = [];
        }
        set({ form });
    },

    addCondition: () => {
        set((state) => ({
            form: {
                ...state.form,
                conditions: [...state.form.conditions, { type: "MNT", cmp_operator: ">", cmp_argument: "" }],
            },
        }));
    },

    removeCondition: (index) => {
        set((state) => ({
            form: {
                ...state.form,
                conditions: state.form.conditions.filter((_, i) => i !== index),
            },
        }));
    },

    updateCondition: (index, field, value) => {
        set((state) => {
            const conditions = [...state.form.conditions];
            conditions[index] = { ...conditions[index], [field]: value };
            return { form: { ...state.form, conditions } };
        });
    },

    toggleLocation: (locId) => {
        set((state) => {
            const ids = state.selectedLocationIds.includes(locId)
                ? state.selectedLocationIds.filter((id) => id !== locId)
                : [...state.selectedLocationIds, locId];
            return { selectedLocationIds: ids };
        });
    },

    selectAllLocations: (select) => {
        if (select) {
            set((state) => ({
                selectedLocationIds: state.locationsWithDepts.map((l) => l.location_id),
            }));
        } else {
            set({ selectedLocationIds: [] });
        }
    },

    toggleDepartment: (deptId) => {
        set((state) => {
            const ids = state.selectedDepartmentIds.includes(deptId)
                ? state.selectedDepartmentIds.filter((id) => id !== deptId)
                : [...state.selectedDepartmentIds, deptId];
            return { selectedDepartmentIds: ids };
        });
    },

    selectAllDepartments: (select) => {
        if (select) {
            const depts = [];
            get().locationsWithDepts
                .filter((l) => get().selectedLocationIds.includes(l.location_id))
                .forEach((l) => (l.department || []).forEach((d) => depts.push(d.department_id)));
            set({ selectedDepartmentIds: [...new Set(depts)] });
        } else {
            set({ selectedDepartmentIds: [] });
        }
    },

    toggleEmployee: (empId) => {
        set((state) => {
            const ids = state.selectedEmployeeIds.includes(empId)
                ? state.selectedEmployeeIds.filter((id) => id !== empId)
                : [...state.selectedEmployeeIds, empId];
            return { selectedEmployeeIds: ids };
        });
    },

    selectAllEmployees: (select) => {
        if (select) {
            set((state) => ({
                selectedEmployeeIds: state.allEmployees.map((e) => e.id ?? e.u_id),
            }));
        } else {
            set({ selectedEmployeeIds: [] });
        }
    },

    toggleNotifyUser: (userId) => {
        set((state) => {
            const ids = state.selectedNotifyIds.includes(userId)
                ? state.selectedNotifyIds.filter((id) => id !== userId)
                : [...state.selectedNotifyIds, userId];
            return { selectedNotifyIds: ids };
        });
    },

    loadInitialData: async () => {
        try {
            set({ loading: true });
            const locationsWithDepts = await getLocationsWithDepartments();
            const allLocationIds = locationsWithDepts.map((l) => l.location_id);
            const users = await getAllUsers({ locationIds: allLocationIds });

            // Prepend "Myself" option for notify users
            // admin.user_id is the admin's own ID (same as Laravel's getMyId() → Session['token']['my_self'])
            const admin = useAdminSession.getState().admin;
            const adminUserId = admin?.user_id;
            let notifyList = [...users];

            if (adminUserId) {
                // Find and move admin to top, or create a standalone "Myself" entry
                const adminIdx = notifyList.findIndex((u) => (u.u_id ?? u.id) === adminUserId);
                if (adminIdx > -1) {
                    const [adminUser] = notifyList.splice(adminIdx, 1);
                    notifyList.unshift({
                        ...adminUser,
                        first_name: "Myself",
                        last_name: "",
                    });
                } else {
                    // Admin not in employee list — add as standalone entry
                    notifyList.unshift({
                        u_id: adminUserId,
                        id: adminUserId,
                        first_name: "Myself",
                        last_name: "",
                    });
                }
            }

            set({
                locationsWithDepts,
                selectedLocationIds: allLocationIds,
                allEmployees: users,
                notifyUsers: notifyList,
                selectedEmployeeIds: users.map((u) => u.id ?? u.u_id),
                loading: false,
            });

            // Check for edit data
            const stored = localStorage.getItem("updatePolicy");
            if (stored && stored !== "{}") {
                const policy = JSON.parse(stored);
                localStorage.setItem("updatePolicy", "{}");
                get().loadEditData(policy);
            }
        } catch {
            set({ loading: false, error: "Failed to load data" });
        }
    },

    loadEditData: (policy) => {
        set({
            isEditMode: true,
            editId: policy.id,
            form: {
                ruleName: decodeURIComponent(policy.name || ""),
                ruleType: policy.type || "",
                riskLevel: policy.risk_level || "MR",
                isMultipleAlerts: !!policy.is_multiple_alerts_in_day,
                isDesktopNotify: !!policy.is_action_notify,
                note: decodeURIComponent(policy.note || ""),
                allLocations: policy.include_employees?.all_locations === "1",
                allDepartments: policy.include_employees?.all_departments === "1",
                allEmployees: policy.include_employees?.all_employees === "1",
                conditions: policy.conditions?.length
                    ? policy.conditions
                    : [{ type: "", cmp_operator: ">", cmp_argument: "" }],
                webAppType: policy.conditions?.[0]?.type === "APP" ? "APP" : "DMN",
                webAppValue: policy.conditions?.[0]?.cmp_argument || "",
            },
            selectedEmployeeIds: policy.include_employees?.ids || [],
            selectedNotifyIds: policy.recipients?.map((r) => r.user_id) || [],
        });
    },

    fetchEmployees: async () => {
        const { selectedLocationIds, selectedDepartmentIds } = get();
        const users = await getAllUsers({
            locationIds: selectedLocationIds,
            departmentIds: selectedDepartmentIds,
        });
        set({ allEmployees: users });
    },

    saveRule: async () => {
        const state = get();
        const { form, isEditMode, editId, selectedEmployeeIds, selectedNotifyIds, selectedLocationIds, selectedDepartmentIds } = state;

        // Validation
        if (!form.ruleName || form.ruleName.trim().length < 2) {
            set({ error: "Rule name is required (min 2 characters)" });
            return false;
        }
        if (!form.ruleType) {
            set({ error: "Please select a rule type" });
            return false;
        }
        if (selectedNotifyIds.length === 0) {
            set({ error: "Please select at least one person to notify" });
            return false;
        }
        if (selectedEmployeeIds.length === 0) {
            set({ error: "Please select at least one employee" });
            return false;
        }

        // Build conditions
        let conditions = [];
        if (form.ruleType === "ASA" || form.ruleType === "STA") {
            conditions.push({
                type: form.webAppType,
                cmp_operator: "=",
                cmp_argument: form.webAppValue.toLowerCase(),
            });
        }
        if (form.ruleType !== "ASA" && form.ruleType !== "WDO") {
            conditions.push(
                ...form.conditions
                    .filter((c) => c.type && c.cmp_argument)
                    .map(({ type, cmp_operator, cmp_argument }) => ({ type, cmp_operator, cmp_argument }))
            );
        }

        const ruleData = {
            name: form.ruleName.trim(),
            ...(form.note.trim() ? { note: form.note.trim() } : {}),
            type: form.ruleType,
            risk_level: form.riskLevel,
            is_multiple_alerts_in_day: form.isMultipleAlerts,
            is_action_notify: form.isDesktopNotify,
            conditions,
            recipients: selectedNotifyIds.map((id) => ({ user_id: id })),
            include_employees: {
                ids: selectedEmployeeIds,
                departments: selectedDepartmentIds,
                locations: selectedLocationIds,
                all_employees: form.allEmployees ? 1 : 0,
                all_locations: form.allLocations ? 1 : 0,
                all_departments: form.allDepartments ? 1 : 0,
            },
        };

        if (isEditMode) ruleData.id = editId;

        set({ saving: true });
        const result = isEditMode ? await updateRule(ruleData) : await createRule(ruleData);
        set({ saving: false });

        if (result.success) {
            set({ successMsg: isEditMode ? "Rule updated successfully" : "Rule created successfully" });
            return true;
        }
        set({ error: result.message || "Failed to save rule" });
        return false;
    },

    resetForm: () => {
        set({
            form: { ...DEFAULT_FORM },
            editId: null,
            isEditMode: false,
            selectedEmployeeIds: [],
            selectedNotifyIds: [],
        });
    },
}));

import apiService from "@/services/api.service";
import moment from "moment-timezone";

const pickEmployeesByType = (payload, type) => {
    const t = Number(type);
    const d = payload?.data ?? payload ?? {};

    // If backend already returns an array for the type endpoint, just use it.
    if (Array.isArray(d)) return d;

    switch (t) {
        case 1:
            return d?.onlineEmps ?? [];
        case 2:
            // Idle
            return d?.idleEmps ?? [];
        case 3:
            return d?.absentEmp ?? [];
        case 4:
            return d?.suspendedEmp ?? [];
        case 5:
            // Registered (Total Enrollments)
            return d?.registeredEmp ?? [];
        case 6:
            // Offline
            return d?.offlineEmp ?? [];
        default:
            return [];
    }
};

export const getEmployeeComparison = async ({ type, timezone = "Asia/Kolkata" } = {}) => {
    try {
        const date = moment().tz(timezone).format("YYYY-MM-DD");
        const { data } = await apiService.apiInstance.get(`/dashboard/employees?date=${date}`);
        return {
            stats: pickEmployeesByType(data, type),
            raw: data
        };
    } catch (error) {
        console.error("Dashboard Employees By Type API Error:", error);
        return {
            stats: [],
            raw: null
        };
    }
};

export const getEmployeesList = async () => {
    try {
        const { data } = await apiService.apiInstance.post(`/user/users`);

        let temp = [
            { value: "all", label: "See All Employee" }
        ];

        const list =
            data?.data ??
            data?.users ??
            data ??
            [];

        if (Array.isArray(list) && list.length) {
            const employees = list.map((emp, idx) => {
                const id = emp.id ?? emp.u_id ?? idx + 1;
                const first = emp.first_name || "";
                const last = emp.last_name || "";
                const name = `${first} ${last}`.trim();
                const label = name || emp.email || `Employee ${idx + 1}`;

                return {
                    value: String(id),
                    label
                };
            });

            temp = [...temp, ...employees];
        }

        return {
            stats: temp,
            raw: data
        };
    } catch (error) {
        console.error("Employees List API Error:", error);
        return {
            stats: [],
            raw: null
        };
    }
};

const formatSecondsToHMS = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return "00:00:00 hrs";
    const total = Math.floor(n);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} hrs`;
};

export const getEmployeeProductivity = async ({
    employeeId,
    startDate,
    endDate,
    timezone = "Asia/Kolkata"
} = {}) => {
    try {
        if (!employeeId || employeeId === "all") {
            return {
                stats: null,
                raw: null
            };
        }

        // Fallback to "today" if dates are not provided
        const today = moment().tz(timezone).format("YYYY-MM-DD");
        const from = startDate || today;
        const to = endDate || from;

        const { data } = await apiService.apiInstance.get(
            `/report/productivity?employee_id=${employeeId}&startDate=${from}&endDate=${to}`
        );

        // Support both old and new response shapes
        const p =
            data?.data?.poductivity_percentage ||
            data?.poductivity_percentage ||
            data?.production_data ||
            {};

        // Per-date rows carry non_productive_duration / neutral_duration; the
        // aggregated `production_data` block doesn't, so sum them here.
        const daily = Array.isArray(data?.data) ? data.data : [];
        const unproductiveSeconds = daily.reduce(
            (s, d) => s + Number(d?.non_productive_duration || 0),
            0
        );
        const neutralSeconds = daily.reduce(
            (s, d) => s + Number(d?.neutral_duration || 0),
            0
        );

        const officeSeconds = Number(
            p.total_office_time ??
            p.office_time ??
            0
        );

        const activeSeconds = Number(
            p.total_computer_activities_time ??
            p.computer_activities_time ??
            0
        );

        const productiveSeconds = Number(
            p.total_productive_duration ??
            p.productive_duration ??
            0
        );

        const officeTime = formatSecondsToHMS(officeSeconds);
        const activeTime = formatSecondsToHMS(activeSeconds);
        const productiveTime = formatSecondsToHMS(productiveSeconds);
        const unproductiveTime = formatSecondsToHMS(unproductiveSeconds);
        const neutralTime = formatSecondsToHMS(neutralSeconds);

        const productivityPercent = Number(
            p.total_productivity ??
            p.productivity ??
            0
        );

        return {
            stats: {
                officeTime,
                activeTime,
                productiveTime,
                unproductiveTime,
                neutralTime,
                productivityPercent: `${productivityPercent.toFixed(2)}%`,
                productivityPercentValue: productivityPercent,
                officeSeconds,
                activeSeconds,
                productiveSeconds,
                unproductiveSeconds,
                neutralSeconds
            },
            raw: data
        };
    } catch (error) {
        console.error("Employee Productivity API Error:", error);
        return {
            stats: null,
            raw: null
        };
    }
};

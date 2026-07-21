import apiService from "@/services/api.service";
import moment from "moment-timezone";

const formatSecondsToHMS = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return "00:00:00";
    const total = Math.floor(n);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const getEmployees = async () => {
    try {
        const { data } = await apiService.apiInstance.post("/user/fetch-users", {
            status: "",
            shift_id: -1,
            location_id: "",
            department_id: "",
            role_id: "",
            day: new Date().toISOString().slice(0, 10),
            limit: 100,
            skip: 0,
            name: "",
        });

        const dataBlock = data?.data ?? {};
        const users = Array.isArray(dataBlock.user_data) ? dataBlock.user_data : [];

        const employees = users.map((emp, idx) => {
            const id = emp.id ?? emp.u_id ?? idx;
            const uId = emp.u_id ?? emp.id ?? idx;
            const name = emp.full_name || emp.name || `Employee ${id}`;

            return {
                id,
                uId,
                name,
                firstName: emp.first_name || "",
                lastName: emp.last_name || "",
                email: emp.email || "",
                description: emp.department || emp.designation || "",
                productivity: "0.00%",
                productivityValue: 0,
                activeHours: "00:00:00",
                idleHours: "00:00:00",
                officeHours: "00:00:00",
                status: "offline",
                activity: null,
            };
        });

        return {
            stats: employees,
            raw: data,
        };
    } catch (error) {
        console.error("Employee Realtime Insights API Error:", error);
        return {
            stats: [],
            raw: null,
        };
    }
};

const getProductivityData = async (timezone = "Asia/Kolkata") => {
    try {
        const now = moment().tz(timezone);
        const startDate = now.clone().startOf("day").toISOString();
        const endDate = now.clone().endOf("day").toISOString();

        const params = new URLSearchParams({
            skip: "0",
            limit: "100",
            location_id: "0",
            department_id: "0",
            employee_id: "0",
            start_date: startDate,
            end_date: endDate,
            sortColumn: "Active Hours",
            sortOrder: "D",
        });

        const { data } = await apiService.apiInstance.get(
            `/timesheet/timesheet?${params.toString()}`
        );

        const list = data?.data?.user_data ?? [];
        if (!Array.isArray(list)) return [];

        return list.map((d) => ({
            id: d.id,
            productivity: Math.round((d.productivity ?? 0) * 100) / 100,
            activeHours: formatSecondsToHMS(d.computer_activities_time ?? d.active_time ?? 0),
            idleHours: formatSecondsToHMS(d.idle_duration ?? d.idle_time ?? 0),
            officeHours: formatSecondsToHMS(d.office_time ?? 0),
        }));
    } catch (error) {
        console.error("Productivity Data API Error:", error);
        return [];
    }
};

export { getEmployees, getProductivityData };

import apiService from "@/services/api.service";

const getLocations = async () => {
    try {
        const { data } = await apiService.apiInstance.post("/location/get-locations");
        let items = [{ value: "all", label: "All Locations" }];
        if (data?.data?.length) {
            const locations = data.data.map((loc) => ({
                value: loc.id,
                label: loc.name,
            }));
            items = [...items, ...locations];
        }
        return items;
    } catch (error) {
        console.error("Live Monitoring: Locations API Error:", error);
        return [];
    }
};

const getDepartments = async (locationId) => {
    try {
        const endpoint = locationId && locationId !== "all"
            ? "/location/get-department-by-location"
            : "/location/get-locations-dept";
        const payload = locationId && locationId !== "all" ? { location_id: locationId } : {};

        const { data } = await apiService.apiInstance.post(endpoint, payload);
        let items = [{ value: "all", label: "All Departments" }];

        if (locationId && locationId !== "all") {
            if (data?.data?.length) {
                const depts = data.data.map((d) => ({
                    value: d.department_id,
                    label: d.name,
                }));
                items = [...items, ...depts];
            }
        } else if (Array.isArray(data?.data)) {
            const deptMap = new Map();
            data.data.forEach((loc) => {
                (loc.department || []).forEach((dept) => {
                    if (!deptMap.has(dept.department_id)) {
                        deptMap.set(dept.department_id, {
                            value: String(dept.department_id),
                            label: dept.name,
                        });
                    }
                });
            });
            items = [...items, ...Array.from(deptMap.values())];
        }
        return items;
    } catch (error) {
        console.error("Live Monitoring: Departments API Error:", error);
        return [];
    }
};

const getAgents = async ({ locationId = "all", departmentId = "all", employeeId = "all" } = {}) => {
    try {
        const payload = {
            status: "",
            shift_id: -1,
            location_id: locationId !== "all" ? locationId : "",
            department_id: departmentId !== "all" ? departmentId : "",
            role_id: "",
            day: new Date().toISOString().slice(0, 10),
            limit: 100,
            skip: 0,
            name: "",
        };

        const { data } = await apiService.apiInstance.post("/user/fetch-users", payload);
        const users = Array.isArray(data?.data?.user_data) ? data.data.user_data : [];

        const agents = users.map((emp, idx) => {
            const id = emp.id ?? emp.u_id ?? idx;
            const uId = emp.u_id ?? emp.id ?? idx;
            const employeeId = emp.employee_id ?? emp.id ?? id;
            const name = emp.full_name || emp.name || `Agent ${id}`;

            return {
                id,
                uId,
                employeeId,
                name,
                email: emp.email || "",
                avatar: emp.profile_image || "",
                status: "offline",
            };
        });

        if (employeeId && employeeId !== "all") {
            return agents.filter((a) => String(a.id) === String(employeeId));
        }

        return agents;
    } catch (error) {
        console.error("Live Monitoring: Agents API Error:", error);
        return [];
    }
};

const getScreenRecords = async ({ userId, date, fromHour, toHour }) => {
    try {
        const { data } = await apiService.apiInstance.post("/user/get-screen-records", {
            user_id: userId,
            date: date,
            from_hour: Number(fromHour),
            to_hour: Number(toHour),
        });

        if (data?.code === 200 && data?.data?.screenRecords) {
            const videos = [];
            data.data.screenRecords.forEach((record) => {
                (record.s || []).forEach((video) => {
                    videos.push({
                        id: video.id,
                        link: video.link,
                        name: video.name,
                    });
                });
            });
            return { videos, error: null };
        }

        return { videos: [], error: data?.msg || "No recordings found" };
    } catch (error) {
        console.error("Screen Records API Error:", error);
        return { videos: [], error: "Failed to load recordings" };
    }
};

export { getLocations, getDepartments, getAgents, getScreenRecords };

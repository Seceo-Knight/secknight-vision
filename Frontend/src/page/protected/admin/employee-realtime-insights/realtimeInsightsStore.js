import { create } from "zustand";
import apiService from "@/services/api.service";
import { getEmployees, getProductivityData } from "./service";

const { SOCKET_BASE_URL } = apiService;
const STATUS_INTERVAL = 5000;
const PRODUCTIVITY_INTERVAL = 60000;
const DISCONNECT_TIME_LIMIT = 5 * 60 * 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 2000;

// --- Module-level refs (not reactive, no re-renders) ---
let socket = null;
let statusIntervalId = null;
let productivityIntervalId = null;
let inactivityIntervalId = null;
let inactiveTime = 0;
let noActivity = true;
let reconnectAttempts = 0;

const clearAllIntervals = () => {
    if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
    if (productivityIntervalId) { clearInterval(productivityIntervalId); productivityIntervalId = null; }
    if (inactivityIntervalId) { clearInterval(inactivityIntervalId); inactivityIntervalId = null; }
};

const safeSend = (msg) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
};

const safeJsonParse = (str) => {
    try { return JSON.parse(str); }
    catch { return null; }
};

// --- Merge helper: apply productivity map to employee list ---
const mergeProductivity = (employees, productivityData) => {
    if (!productivityData.length) return employees;
    const prodMap = new Map();
    for (const d of productivityData) prodMap.set(Number(d.id), d);

    return employees.map((emp) => {
        const match = prodMap.get(Number(emp.id));
        if (!match) return emp;
        return {
            ...emp,
            productivityValue: match.productivity,
            productivity: `${match.productivity.toFixed(2)}%`,
            activeHours: match.activeHours,
            idleHours: match.idleHours,
            officeHours: match.officeHours,
        };
    });
};

export const useRealtimeInsightsStore = create((set, get) => ({
    employees: [],
    loading: false,
    error: null,
    isConnected: false,

    // --- Data Loading ---

    loadEmployees: async () => {
        try {
            set({ loading: true, error: null });

            const [empRes, productivityData] = await Promise.all([
                getEmployees(),
                getProductivityData(),
            ]);

            const employees = mergeProductivity(empRes?.stats || [], productivityData);

            set({ employees, loading: false });
        } catch (error) {
            console.error("Realtime Insights Load Error:", error);
            set({ loading: false, error: "Failed to load employees" });
        }
    },

    // --- WebSocket ---

    connectSocket: () => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
        get()._setupSocket();
    },

    _setupSocket: () => {
        socket = new WebSocket(SOCKET_BASE_URL);

        socket.onopen = () => {
            reconnectAttempts = 0;
            set({ isConnected: true });

            const token = localStorage.getItem("token");
            safeSend({ type: "fe_auth", token });
            setTimeout(() => safeSend({ type: "realtime_usage_history_status_no_activity" }), 1000);

            get()._startStatusInterval();
            get()._startProductivityInterval();
            get()._startInactivityTracker();
        };

        socket.onmessage = (event) => get()._handleMessage(event.data);
        socket.onerror = (error) => console.error("WebSocket error:", error);

        socket.onclose = () => {
            set({ isConnected: false });
            if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }

            // Auto-reconnect on unexpected close (not manual disconnect)
            if (!get()._manualDisconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
                reconnectAttempts++;
                setTimeout(() => get()._setupSocket(), delay);
            }
        };
    },

    _manualDisconnect: false,

    _handleMessage: (message) => {
        if (!message) return;

        if (message === "User authenticated successfully") {
            safeSend({ type: "realtime_status_user_connected" });
            return;
        }

        if (message === "No agents connected to the system") {
            get()._updateOnlineStatus([]);
            return;
        }

        if (message.includes("send_connected_agent_status")) {
            const parsed = safeJsonParse(message);
            if (parsed) get()._updateOnlineStatus(parsed.data || []);
            return;
        }

        if (message.includes("realtime_usage_history_status")) {
            const parsed = safeJsonParse(message);
            if (parsed) get()._updateUserActivity(parsed);
        }
    },

    _updateOnlineStatus: (onlineUserIds) => {
        const onlineSet = new Set((onlineUserIds || []).map(Number));

        set((state) => ({
            employees: state.employees.map((emp) => {
                const isOnline = onlineSet.has(Number(emp.uId));
                const newStatus = isOnline ? "online" : "offline";
                if (emp.status === newStatus) return emp; // skip unchanged
                return { ...emp, status: newStatus };
            }),
        }));

        if (!noActivity) return;
        noActivity = false;
        safeSend({ type: "realtime_connected_agent_status" });
    },

    _updateUserActivity: (data) => {
        if (!data?.user_id) return;

        const userId = Number(data.user_id);
        const activity = {
            title: data.windText || "",
            appName: data.appName || "",
            currentUrl: data.currentUrl || "",
            latitude: data.latitude || "",
            longitude: data.longitude || "",
        };

        set((state) => ({
            employees: state.employees.map((emp) =>
                Number(emp.uId) === userId
                    ? { ...emp, activity, status: "online" }
                    : emp
            ),
        }));
    },

    // --- Productivity Polling ---

    _updateProductivity: async () => {
        try {
            const productivityData = await getProductivityData();
            if (!productivityData.length) return;

            set((state) => ({
                employees: mergeProductivity(state.employees, productivityData),
            }));
        } catch (error) {
            console.error("Productivity poll error:", error);
        }
    },

    // --- Intervals (module-level, no Zustand re-renders) ---

    _startStatusInterval: () => {
        if (statusIntervalId) return;
        statusIntervalId = setInterval(() => {
            noActivity = true;
            safeSend({ type: "realtime_connected_agent_status" });
        }, STATUS_INTERVAL);
    },

    _startProductivityInterval: () => {
        if (productivityIntervalId) return;
        // No initial fetch here — loadEmployees already fetched
        productivityIntervalId = setInterval(() => {
            get()._updateProductivity();
        }, PRODUCTIVITY_INTERVAL);
    },

    _startInactivityTracker: () => {
        if (inactivityIntervalId) return;
        inactiveTime = 0;
        inactivityIntervalId = setInterval(() => {
            inactiveTime += 1000;
            if (inactiveTime >= DISCONNECT_TIME_LIMIT && socket?.readyState === WebSocket.OPEN) {
                get()._manualDisconnect = true;
                socket.close();
                clearAllIntervals();
            }
        }, 1000);
    },

    resetInactiveTime: () => {
        inactiveTime = 0;
        if (get()._manualDisconnect) {
            get()._manualDisconnect = false;
            reconnectAttempts = 0;
            get()._setupSocket();
        }
    },

    cleanup: () => {
        get()._manualDisconnect = true;
        clearAllIntervals();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        socket = null;
        noActivity = true;
        inactiveTime = 0;
        reconnectAttempts = 0;
        set({ isConnected: false });
    },
}));

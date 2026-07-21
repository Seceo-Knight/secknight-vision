import { create } from "zustand";
import apiService from "@/services/api.service";
import { getLocations, getDepartments, getAgents, getScreenRecords } from "./service";
import {
    parseImageStream,
    renderScreen,
    requestStream,
    stopStream,
    setModalCanvas,
    clearModalCanvas,
    setModalSelectedScreen,
} from "./screenRenderer";

const { SOCKET_BASE_URL } = apiService;
const STATUS_INTERVAL = 5000;
const DISCONNECT_TIME_LIMIT = 5 * 60 * 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 2000;

let socket = null;
let statusIntervalId = null;
let inactivityIntervalId = null;
let inactiveTime = 0;
let noActivity = true;
let reconnectAttempts = 0;

const clearAllIntervals = () => {
    if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
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

export const useLiveMonitoringStore = create((set, get) => ({
    agents: [],
    locations: [],
    departments: [],
    employees: [],
    loading: false,
    error: null,
    isConnected: false,
    statusMessage: "",

    // Modal state
    modalAgent: null,
    modalScreenCount: 0,
    modalSelectedScreen: 0,
    recordings: [],
    recordingsError: null,
    recordingsLoading: false,

    filters: {
        location: "all",
        department: "all",
        employee: "all",
    },

    setFilter: (key, value) =>
        set((state) => ({
            filters: { ...state.filters, [key]: value },
        })),

    // --- Data Loading ---

    loadInitialData: async () => {
        try {
            set({ loading: true, error: null });

            const [agents, locations, departments] = await Promise.all([
                getAgents(),
                getLocations(),
                getDepartments(),
            ]);

            const employeeOptions = [
                { value: "all", label: "All Employees" },
                ...agents.map((a) => ({ value: String(a.id), label: a.name })),
            ];

            set({
                agents,
                locations,
                departments,
                employees: employeeOptions,
                loading: false,
            });
        } catch (error) {
            console.error("Live Monitoring Load Error:", error);
            set({ loading: false, error: "Failed to load data" });
        }
    },

    fetchAgents: async () => {
        try {
            const { filters } = get();
            const agents = await getAgents({
                locationId: filters.location,
                departmentId: filters.department,
                employeeId: filters.employee,
            });
            set({ agents });
        } catch (error) {
            console.error("Live Monitoring: Fetch Agents Error:", error);
        }
    },

    fetchDepartmentsByLocation: async (locationId) => {
        const departments = await getDepartments(locationId);
        set({ departments });
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
            set({ isConnected: true, statusMessage: "" });

            const token = localStorage.getItem("token");
            safeSend({ type: "fe_auth", token });

            get()._startStatusInterval();
            get()._startInactivityTracker();
        };

        socket.onmessage = (event) => get()._handleMessage(event.data);
        socket.onerror = (error) => console.error("WebSocket error:", error);

        socket.onclose = () => {
            set({ isConnected: false });
            if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }

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
            safeSend({ type: "realtime_connected_agent_status" });
            return;
        }

        if (message === "No agents connected to the system") {
            set({ statusMessage: "No agents connected to the system" });
            get()._updateOnlineStatus([]);
            return;
        }

        if (message.includes("send_connected_agent_status")) {
            const parsed = safeJsonParse(message);
            if (parsed) {
                set({ statusMessage: "" });
                get()._updateOnlineStatus(parsed.data || []);
            }
            return;
        }

        if (message.includes("start_image_stream")) {
            const parsed = safeJsonParse(message);
            if (parsed) get()._handleImageStream(parsed);
            return;
        }
    },

    _updateOnlineStatus: (onlineUserIds) => {
        const onlineSet = new Set((onlineUserIds || []).map(Number));

        // Update agent status in state (pure state update, no side effects)
        set((state) => ({
            agents: state.agents.map((agent) => {
                const isOnline = onlineSet.has(Number(agent.uId));
                const newStatus = isOnline ? "Online" : "Offline";
                if (agent.status === newStatus) return agent;
                return { ...agent, status: newStatus };
            }),
        }));

        // Update modal agent's online status if open
        const { modalAgent } = get();
        if (modalAgent) {
            const isModalAgentOnline = onlineSet.has(Number(modalAgent.uId));
            const currentStatus = modalAgent.status;
            const newStatus = isModalAgentOnline ? "Online" : "Offline";
            if (currentStatus !== newStatus) {
                set({ modalAgent: { ...modalAgent, status: newStatus } });
            }
        }

        if (!noActivity) return;
        noActivity = false;
        safeSend({ type: "realtime_connected_agent_status" });
    },

    _handleImageStream: (raw) => {
        const parsed = parseImageStream(raw);
        const screenCount = renderScreen(parsed, false);

        const { modalAgent } = get();
        if (modalAgent && Number(modalAgent.uId) === Number(parsed.userId)) {
            set({ modalScreenCount: screenCount });
        }
    },

    // --- Streaming control (called by IntersectionObserver in AgentCard) ---

    startStreaming: (userId) => requestStream(safeSend, userId),
    stopStreaming: (userId) => stopStream(safeSend, userId),

    // --- Modal ---

    openModal: (agent) => {
        set({
            modalAgent: agent,
            modalScreenCount: 0,
            modalSelectedScreen: 0,
            recordings: [],
            recordingsError: null,
        });
        requestStream(safeSend, agent.uId);
    },

    closeModal: () => {
        clearModalCanvas();
        set({
            modalAgent: null,
            modalScreenCount: 0,
            modalSelectedScreen: 0,
            recordings: [],
            recordingsError: null,
        });
    },

    selectModalScreen: (idx) => {
        setModalSelectedScreen(idx);
        set({ modalSelectedScreen: idx });
    },

    // --- Screen Recordings ---

    loadRecordings: async ({ userId, date, time }) => {
        try {
            set({ recordingsLoading: true, recordingsError: null });

            const [hours] = time.split(":");
            const toHour = String((Number(hours) + 1) % 24).padStart(2, "0");

            const result = await getScreenRecords({
                userId,
                date,
                fromHour: hours,
                toHour,
            });

            set({
                recordings: result.videos,
                recordingsError: result.error,
                recordingsLoading: false,
            });
        } catch (error) {
            console.error("Load Recordings Error:", error);
            set({ recordingsLoading: false, recordingsError: "Failed to load recordings" });
        }
    },

    // --- Intervals ---

    _startStatusInterval: () => {
        if (statusIntervalId) return;
        statusIntervalId = setInterval(() => {
            noActivity = true;
            safeSend({ type: "realtime_connected_agent_status" });
        }, STATUS_INTERVAL);
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

import { create } from "zustand";
import apiService from "./api.service";

const RISK_COLORS = {
    NR: "#00ad42",
    LR: "#c3d100",
    MR: "#ffa300",
    HR: "#ff2d00",
    CR: "#ff0000",
};

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_MS = 3000;
let reconnectAttempts = 0;
let reconnectTimer = null;
let autoCloseTimer = null;
let toastIdCounter = 0;

const mapToast = (m) => ({
    id: m.id ?? `local-${++toastIdCounter}`,
    rule: m.rule || "Alert",
    message: m.message || "",
    riskLevel: m.risk_level || "MR",
    riskColor: RISK_COLORS[m.risk_level] || RISK_COLORS.MR,
    createdAt: m.created_at,
    type: m.type || "",
});

const scheduleAutoClose = (get, delayMs) => {
    if (autoCloseTimer) clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(() => get().closeToasts(), delayMs);
};

export const useNotificationStore = create((set, get) => ({
    socket: null,
    connected: false,
    lastMessageId: 0,
    alertCount: 0,
    alerts: [],
    toasts: [],
    isToastOpen: false,

    connect: () => {
        const { socket } = get();
        if (socket && socket.readyState <= 1) return;

        const wsUrl = apiService.SOCKET_BASE_URL;
        const token = localStorage.getItem("token");
        if (!wsUrl || !token) return;

        let ws;
        try {
            ws = new WebSocket(wsUrl);
        } catch {
            return;
        }

        ws.onopen = () => {
            reconnectAttempts = 0;
            set({ connected: true, socket: ws });
            ws.send(JSON.stringify({
                type: "auth",
                lastMessageId: get().lastMessageId,
                token,
            }));
        };

        ws.onmessage = (e) => {
            try {
                get().handleMessage(JSON.parse(e.data));
            } catch { /* ignore parse errors */ }
        };

        ws.onclose = () => {
            set({ connected: false, socket: null });
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = RECONNECT_BASE_MS * Math.min(2 ** reconnectAttempts, 32);
                reconnectAttempts++;
                if (reconnectTimer) clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(() => get().connect(), delay);
            }
        };

        ws.onerror = () => ws.close();

        set({ socket: ws });
    },

    disconnect: () => {
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
        reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // prevent reconnect
        const { socket } = get();
        if (socket) socket.close();
        set({ socket: null, connected: false });
    },

    handleMessage: (message) => {
        switch (message.type) {
            case "messages": {
                const undelivered = (message.messages || []).filter((m) => !m.delivered_at);
                if (undelivered.length === 0) break;
                const newToasts = undelivered.slice(-3).map(mapToast);
                set((state) => ({
                    alerts: [...state.alerts, ...undelivered],
                    alertCount: state.alertCount + undelivered.length,
                    toasts: [...state.toasts, ...newToasts],
                    isToastOpen: true,
                    lastMessageId: Math.max(state.lastMessageId, ...message.messages.map((m) => m.id)),
                }));
                scheduleAutoClose(get, 7000);
                break;
            }

            case "newMessages": {
                const msgs = message.messages || [];
                if (msgs.length === 0) break;
                const newToasts = msgs.map(mapToast);

                set((state) => ({
                    alerts: [...state.alerts, ...msgs],
                    alertCount: state.alertCount + msgs.length,
                    toasts: newToasts,
                    isToastOpen: true,
                    lastMessageId: Math.max(state.lastMessageId, ...msgs.map((m) => m.id)),
                }));

                if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                    msgs.forEach((m) => {
                        new Notification(m.rule || "SecKnight Vision Alert", { body: m.message });
                    });
                }

                scheduleAutoClose(get, 5000);
                break;
            }

            case "usbAlert":
            case "employeeGeolocationChange": {
                const label = message.type === "usbAlert" ? "USB Detection" : "Geo-Fencing";
                set((state) => ({
                    toasts: [...state.toasts, {
                        id: `local-${++toastIdCounter}`,
                        rule: label,
                        message: message.message || "",
                        riskLevel: "CR",
                        riskColor: RISK_COLORS.CR,
                        createdAt: new Date().toISOString(),
                        type: message.type,
                    }],
                    isToastOpen: true,
                    alertCount: state.alertCount + 1,
                }));
                break;
            }
        }
    },

    markAsRead: (messageIds) => {
        const { socket } = get();
        if (socket?.readyState === 1) {
            socket.send(JSON.stringify({ type: "delivered", delivered: messageIds }));
        }
        set((state) => ({
            alertCount: Math.max(0, state.alertCount - messageIds.length),
            alerts: state.alerts.filter((a) => !messageIds.includes(a.id)),
            toasts: state.toasts.filter((t) => !messageIds.includes(t.id)),
        }));
    },

    markAllAsRead: () => {
        const { alerts, socket } = get();
        const ids = alerts.map((a) => a.id);
        if (socket?.readyState === 1 && ids.length > 0) {
            socket.send(JSON.stringify({ type: "delivered", delivered: ids }));
        }
        set({ alertCount: 0, alerts: [], toasts: [], isToastOpen: false });
    },

    closeToasts: () => {
        if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = null; }
        set({ isToastOpen: false });
    },

    openToasts: () => {
        const { alerts } = get();
        if (alerts.length === 0) return;
        set({ toasts: alerts.slice(-3).map(mapToast), isToastOpen: true });
    },

    requestNotificationPermission: () => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    },
}));

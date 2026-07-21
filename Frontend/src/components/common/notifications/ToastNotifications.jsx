import React, { useEffect } from "react";
import { X, Bell } from "lucide-react";
import { useNotificationStore } from "@/services/notificationStore";

function ToastNotifications() {
    const toasts = useNotificationStore((s) => s.toasts);
    const isToastOpen = useNotificationStore((s) => s.isToastOpen);
    const alertCount = useNotificationStore((s) => s.alertCount);
    const connect = useNotificationStore((s) => s.connect);
    const markAsRead = useNotificationStore((s) => s.markAsRead);
    const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
    const closeToasts = useNotificationStore((s) => s.closeToasts);
    const openToasts = useNotificationStore((s) => s.openToasts);
    const requestNotificationPermission = useNotificationStore((s) => s.requestNotificationPermission);

    // Connect WebSocket on mount
    useEffect(() => {
        connect();
        requestNotificationPermission();
    }, []);

    const displayCount = alertCount > 99 ? "99+" : alertCount;

    return (
        <>
            {/* Notification bell — place in your header/navbar */}
            <button
                onClick={() => (isToastOpen ? closeToasts() : openToasts())}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title={alertCount > 0 ? "Click to see notifications" : "No new notifications"}
            >
                <Bell className="w-5 h-5 text-slate-600" />
                {alertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {displayCount}
                    </span>
                )}
            </button>

            {/* Toast panel */}
            {isToastOpen && toasts.length > 0 && (
                <>
                    {/* Backdrop blur */}
                    <div
                        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
                        onClick={closeToasts}
                    />

                    {/* Toast container */}
                    <div className="fixed top-4 right-4 z-50 w-96 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl shadow-lg border border-slate-200">
                            <span className="text-sm font-semibold text-slate-700">
                                Notifications ({alertCount})
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[11px] text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Mark all read
                                </button>
                                <button onClick={closeToasts} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Toasts */}
                        {toasts.map((toast) => (
                            <div
                                key={toast.id}
                                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in slide-in-from-right"
                            >
                                <div
                                    className="flex items-center justify-between px-3 py-2"
                                    style={{ backgroundColor: toast.riskColor }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-white" />
                                        <span className="text-sm font-semibold text-white">
                                            {toast.rule}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => markAsRead([toast.id])}
                                        className="text-white/80 hover:text-white"
                                        title="Mark as read"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="px-3 py-2 text-xs text-slate-600">
                                    {toast.message}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}

export default React.memo(ToastNotifications);

import React, { useRef, useEffect, useCallback } from "react";
import {
    registerCanvas,
    unregisterCanvas,
    drawOfflinePlaceholder,
} from "@/page/protected/admin/live-monitoring/screenRenderer";
import { useLiveMonitoringStore } from "@/page/protected/admin/live-monitoring/liveMonitoringStore";

const avatarColors = [
    "bg-blue-500", "bg-cyan-500", "bg-sky-500", "bg-amber-500",
    "bg-rose-500", "bg-emerald-500", "bg-violet-500", "bg-indigo-500",
];

function AgentCard({ agent, idx }) {
    const canvasRef = useRef(null);
    const cardRef = useRef(null);
    const openModal = useLiveMonitoringStore((s) => s.openModal);
    const startStreaming = useLiveMonitoringStore((s) => s.startStreaming);
    const stopStreaming = useLiveMonitoringStore((s) => s.stopStreaming);

    const isOnline = agent.status === "Online";
    const uId = agent.uId;

    const initials = agent.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Register canvas (stable on uId, only redraw offline placeholder when status changes)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        registerCanvas(Number(uId), canvas);
        return () => unregisterCanvas(Number(uId));
    }, [uId]);

    // Draw offline placeholder when status goes offline
    useEffect(() => {
        if (!isOnline && canvasRef.current) {
            drawOfflinePlaceholder(canvasRef.current);
        }
    }, [isOnline]);

    // IntersectionObserver for viewport-based streaming
    useEffect(() => {
        const card = cardRef.current;
        if (!card || !isOnline) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startStreaming(uId);
                } else {
                    stopStreaming(uId);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(card);
        return () => observer.disconnect();
    }, [uId, isOnline, startStreaming, stopStreaming]);

    const handleClick = useCallback(() => {
        openModal(agent);
    }, [openModal, agent]);

    return (
        <div
            ref={cardRef}
            onClick={handleClick}
            className="bg-[#DCF4F5] rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        >
            {/* Live screen preview */}
            <div className="relative w-full bg-slate-100">
                <canvas
                    ref={canvasRef}
                    data-user-id={uId}
                    className="w-full block"
                />
                {!isOnline && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
                        <span className="text-[11px] text-slate-400 font-medium">Offline</span>
                    </div>
                )}
            </div>

            {/* Agent info */}
            <div className="flex items-center relative gap-3 px-4 py-3 min-w-0">
                <div className="shrink-0">
                    {agent.avatar ? (
                        <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full object-cover shadow-sm"
                        />
                    ) : (
                        <div
                            className={`w-10 h-10 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                        >
                            {initials}
                        </div>
                    )}
                    <div className="absolute top-1.5 right-2">
                        <span
                            className="inline-flex bg-[#383838] items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full text-white"
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                    isOnline ? "bg-green-500" : "bg-red-400"
                                }`}
                            />
                            {agent.status}
                        </span>
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {agent.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{agent.email}</p>
                </div>
            </div>
        </div>
    );
}

export default React.memo(AgentCard);

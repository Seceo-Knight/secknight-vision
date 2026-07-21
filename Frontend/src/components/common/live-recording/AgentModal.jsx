import React, { useRef, useEffect, useState, useCallback } from "react";
import { X, Maximize, Monitor, ChevronLeft, ChevronRight, Play } from "lucide-react";
import moment from "moment-timezone";
import { useLiveMonitoringStore } from "@/page/protected/admin/live-monitoring/liveMonitoringStore";
import {
    setModalCanvas,
    drawOfflinePlaceholder,
} from "@/page/protected/admin/live-monitoring/screenRenderer";

const avatarColors = [
    "bg-blue-500", "bg-cyan-500", "bg-sky-500", "bg-amber-500",
    "bg-rose-500", "bg-emerald-500", "bg-violet-500", "bg-indigo-500",
];

const parseVideoTime = (name) => {
    if (!name) return "";
    // name format: "6-2026-03-19 06:04:32.mp4"
    const withoutExt = name.replace(".mp4", "");
    const dashIdx = withoutExt.indexOf("-");
    if (dashIdx === -1) return withoutExt;
    const dateTimePart = withoutExt.substring(dashIdx + 1); // "2026-03-19 06:04:32"
    const m = moment(dateTimePart, "YYYY-MM-DD HH:mm:ss");
    return m.isValid() ? m.format("hh:mm:ss A") : withoutExt;
};

function AgentModal() {
    const modalAgent = useLiveMonitoringStore((s) => s.modalAgent);
    const modalScreenCount = useLiveMonitoringStore((s) => s.modalScreenCount);
    const modalSelectedScreen = useLiveMonitoringStore((s) => s.modalSelectedScreen);
    const recordings = useLiveMonitoringStore((s) => s.recordings);
    const recordingsError = useLiveMonitoringStore((s) => s.recordingsError);
    const recordingsLoading = useLiveMonitoringStore((s) => s.recordingsLoading);
    const closeModal = useLiveMonitoringStore((s) => s.closeModal);
    const selectModalScreen = useLiveMonitoringStore((s) => s.selectModalScreen);
    const loadRecordings = useLiveMonitoringStore((s) => s.loadRecordings);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const sliderRef = useRef(null);

    const [showRecordings, setShowRecordings] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [currentVideoSrc, setCurrentVideoSrc] = useState("");
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);

    const isOnline = modalAgent?.status === "Online";

    // Reset local state when modal opens for a new agent
    useEffect(() => {
        if (!modalAgent) return;
        setShowRecordings(false);
        setCurrentVideoSrc("");
        setCurrentVideoIndex(0);
        setAutoPlay(false);
        setSelectedDate(moment().format("YYYY-MM-DD"));
        setSelectedTime(moment().format("HH:mm"));

        const canvas = canvasRef.current;
        if (canvas) {
            setModalCanvas(canvas, Number(modalAgent.uId));
            if (modalAgent.status !== "Online") {
                drawOfflinePlaceholder(canvas);
            }
        }
    }, [modalAgent?.id]);

    // Auto-select first video when recordings load
    useEffect(() => {
        if (recordings.length > 0 && showRecordings && !currentVideoSrc) {
            setCurrentVideoSrc(recordings[0].link);
            setCurrentVideoIndex(0);
        }
    }, [recordings, showRecordings]);

    // Close on Escape
    useEffect(() => {
        if (!modalAgent) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") closeModal();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [modalAgent, closeModal]);

    // Lock body scroll
    useEffect(() => {
        if (modalAgent) {
            document.body.style.overflow = "hidden";
        }
        return () => { document.body.style.overflow = ""; };
    }, [modalAgent]);

    const handleFullscreen = useCallback(() => {
        const el = currentVideoSrc ? videoRef.current : canvasRef.current;
        if (el?.requestFullscreen) el.requestFullscreen();
    }, [currentVideoSrc]);

    const handleLoadRecordings = useCallback(() => {
        if (!modalAgent) return;
        setShowRecordings(true);
        setCurrentVideoSrc("");
        setCurrentVideoIndex(0);
        loadRecordings({
            userId: modalAgent.employeeId,
            date: selectedDate,
            time: selectedTime,
        });
    }, [modalAgent, selectedDate, selectedTime, loadRecordings]);

    const handleBackToLive = useCallback(() => {
        setShowRecordings(false);
        setCurrentVideoSrc("");
        setCurrentVideoIndex(0);
        setAutoPlay(false);
    }, []);

    const handleSelectVideo = useCallback((video, index) => {
        setCurrentVideoSrc(video.link);
        setCurrentVideoIndex(index);
    }, []);

    const handleVideoEnded = useCallback(() => {
        if (autoPlay && currentVideoIndex < recordings.length - 1) {
            const next = currentVideoIndex + 1;
            setCurrentVideoIndex(next);
            setCurrentVideoSrc(recordings[next].link);
        }
    }, [autoPlay, currentVideoIndex, recordings]);

    const scrollSlider = useCallback((dir) => {
        sliderRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
    }, []);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) closeModal();
    }, [closeModal]);

    if (!modalAgent) return null;

    const initials = modalAgent.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColors[0]} flex items-center justify-center text-sm font-bold text-white`}>
                            {initials}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{modalAgent.name}</p>
                            <p className="text-[11px] text-slate-400">{modalAgent.email}</p>
                        </div>
                        <span className={`ml-2 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            isOnline ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-400"}`} />
                            {isOnline ? "Live" : "Offline"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {modalScreenCount > 1 && !showRecordings && (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: modalScreenCount }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectModalScreen(i)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                            modalSelectedScreen === i
                                                ? "bg-blue-500 text-white"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        <Monitor className="w-3 h-3" />
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={handleFullscreen}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <Maximize className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                            onClick={closeModal}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Screen */}
                <div className="relative bg-slate-900">
                    {!showRecordings || !currentVideoSrc ? (
                        <canvas ref={canvasRef} className="w-full block" style={{ minHeight: "300px" }} />
                    ) : (
                        <video
                            ref={videoRef}
                            src={currentVideoSrc}
                            controls
                            autoPlay
                            onEnded={handleVideoEnded}
                            className="w-full block"
                            style={{ minHeight: "300px" }}
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-slate-100">
                    {!showRecordings ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                />
                                <input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="px-3 py-1.5 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <button
                                onClick={handleLoadRecordings}
                                className="px-4 py-1.5 text-[12px] font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Load Recordings
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleBackToLive}
                                        className="text-[12px] text-blue-500 hover:text-blue-600 font-medium"
                                    >
                                        Back to Live
                                    </button>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <span className="text-[12px] text-slate-500 font-medium">Auto Play</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={autoPlay}
                                            onClick={() => setAutoPlay((v) => !v)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                                autoPlay ? "bg-blue-500" : "bg-slate-200"
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                                                    autoPlay ? "translate-x-[18px]" : "translate-x-[3px]"
                                                }`}
                                            />
                                        </button>
                                    </label>
                                </div>
                                <p className="text-[12px] text-slate-400">
                                    {recordings.length} recording{recordings.length !== 1 ? "s" : ""} found
                                </p>
                            </div>

                            {recordingsLoading && (
                                <p className="text-[12px] text-slate-400 text-center py-4">Loading recordings...</p>
                            )}

                            {recordingsError && !recordingsLoading && (
                                <p className="text-[12px] text-blue-500 text-center py-4 font-medium">
                                    {recordingsError}
                                </p>
                            )}

                            {recordings.length > 0 && !recordingsLoading && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => scrollSlider(-1)}
                                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                                    </button>
                                    <div ref={sliderRef} className="flex gap-2 overflow-x-auto scrollbar-hide">
                                        {recordings.map((video, i) => (
                                            <button
                                                key={video.id}
                                                onClick={() => handleSelectVideo(video, i)}
                                                className={`shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors ${
                                                    currentVideoIndex === i
                                                        ? "border-blue-400 bg-blue-50"
                                                        : "border-slate-200 hover:border-slate-300"
                                                }`}
                                            >
                                                <div className="relative w-28 h-16 bg-slate-900 rounded overflow-hidden">
                                                    <video
                                                        src={video.link}
                                                        preload="metadata"
                                                        muted
                                                        className="w-full h-full object-cover"
                                                        onLoadedData={(e) => {
                                                            // Seek to 1s to generate a thumbnail frame
                                                            e.target.currentTime = 1;
                                                        }}
                                                    />
                                                    {currentVideoIndex !== i && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                            <Play className="w-4 h-4 text-white fill-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                    {parseVideoTime(video.name)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => scrollSlider(1)}
                                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200"
                                    >
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AgentModal;

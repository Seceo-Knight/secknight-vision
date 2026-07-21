import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import moment from "moment-timezone";

import LiveHeader from "./LiveHeader";
import LiveFilters from "./LiveFilters";
import AgentCard from "./AgentCard";
import AgentModal from "./AgentModal";

import { useLiveMonitoringStore } from "@/page/protected/admin/live-monitoring/liveMonitoringStore";

export default function EmpLiveRecording() {
    const agents = useLiveMonitoringStore((s) => s.agents);
    const locations = useLiveMonitoringStore((s) => s.locations);
    const departments = useLiveMonitoringStore((s) => s.departments);
    const employees = useLiveMonitoringStore((s) => s.employees);
    const filters = useLiveMonitoringStore((s) => s.filters);
    const loading = useLiveMonitoringStore((s) => s.loading);
    const error = useLiveMonitoringStore((s) => s.error);
    const isConnected = useLiveMonitoringStore((s) => s.isConnected);
    const statusMessage = useLiveMonitoringStore((s) => s.statusMessage);
    const setFilter = useLiveMonitoringStore((s) => s.setFilter);
    const loadInitialData = useLiveMonitoringStore((s) => s.loadInitialData);
    const fetchAgents = useLiveMonitoringStore((s) => s.fetchAgents);
    const fetchDepartmentsByLocation = useLiveMonitoringStore((s) => s.fetchDepartmentsByLocation);
    const connectSocket = useLiveMonitoringStore((s) => s.connectSocket);
    const cleanup = useLiveMonitoringStore((s) => s.cleanup);
    const resetInactiveTime = useLiveMonitoringStore((s) => s.resetInactiveTime);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const initialLoad = useRef(true);

    const today = useMemo(() => moment().format("ddd, DD MMMM YYYY"), []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Load data + connect socket
    useEffect(() => {
        loadInitialData().then(() => connectSocket());
        return () => cleanup();
    }, []);

    // Re-fetch agents when filters change (skip initial mount)
    useEffect(() => {
        if (initialLoad.current) {
            initialLoad.current = false;
            return;
        }
        fetchAgents();
    }, [filters.location, filters.department, filters.employee]);

    // Tab visibility
    useEffect(() => {
        const handleVisibility = () => {
            if (!document.hidden) resetInactiveTime();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [resetInactiveTime]);

    // Sort online first, filter by search
    const filteredAgents = useMemo(() => {
        let result = [...agents].sort((a, b) => {
            const aOnline = a.status === "Online" ? 1 : 0;
            const bOnline = b.status === "Online" ? 1 : 0;
            return bOnline - aOnline;
        });

        if (debouncedSearch) {
            const query = debouncedSearch.toLowerCase();
            result = result.filter(
                (a) =>
                    a.name.toLowerCase().includes(query) ||
                    a.email.toLowerCase().includes(query)
            );
        }

        return result;
    }, [agents, debouncedSearch]);

    const handleLocationChange = useCallback((value) => {
        setFilter("location", value);
        setFilter("department", "all");
        setFilter("employee", "all");
        fetchDepartmentsByLocation(value);
    }, [setFilter, fetchDepartmentsByLocation]);

    const handleDepartmentChange = useCallback((value) => {
        setFilter("department", value);
        setFilter("employee", "all");
    }, [setFilter]);

    const handleEmployeeChange = useCallback((value) => {
        setFilter("employee", value);
    }, [setFilter]);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
                <div className="w-20 h-20 flex items-center justify-center">
                    <video
                        src="/src/assets/ai.webm"
                        autoPlay
                        loop
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-9 w-full">
            <LiveHeader isConnected={isConnected} />

            {error && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <LiveFilters
                locations={locations}
                departments={departments}
                employees={employees}
                locationValue={filters.location}
                departmentValue={filters.department}
                employeeValue={filters.employee}
                onLocationChange={handleLocationChange}
                onDepartmentChange={handleDepartmentChange}
                onEmployeeChange={handleEmployeeChange}
                search={search}
                onSearchChange={setSearch}
            />

            <div className="mb-4">
                <p className="text-sm font-medium text-slate-800">{today}</p>
                {statusMessage && (
                    <p className="text-xs text-slate-400 mt-1">{statusMessage}</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 mb-8">
                {filteredAgents.map((agent, idx) => (
                    <AgentCard key={agent.id} agent={agent} idx={idx} />
                ))}
            </div>

            {!filteredAgents.length && !loading && (
                <div className="text-center text-slate-400 py-12 text-sm">
                    No agents found
                </div>
            )}

            <AgentModal />
        </div>
    );
}

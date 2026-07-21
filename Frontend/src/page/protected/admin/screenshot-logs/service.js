import apiService from "@/services/api.service";
import moment from "moment-timezone";
import { exportToCsv, exportToPdf } from "@/services/dlp.service";

// ─── Row Mapper ─────────────────────────────────────────────────────────────

const extractScreenshot = (description) => {
    if (!description) return null;

    // Format: "Clipboard Image Data : <base64>"
    if (description.includes("Clipboard Image Data")) {
        const parts = description.split("Clipboard Image Data : ");
        if (parts[1]) return parts[1].trim();
        // Try alternate separators
        const altParts = description.split("Clipboard Image Data:");
        if (altParts[1]) return altParts[1].trim();
    }

    // Check if the description itself is raw base64 (starts with common PNG/JPEG base64 headers)
    const trimmed = description.trim();
    if (/^(iVBOR|\/9j\/|R0lGOD)/.test(trimmed)) return trimmed;

    return null;
};

const mapRow = (log) => {
    const tz = log.timezone || "Asia/Kolkata";
    const startMoment = log.start ? moment.utc(log.start).tz(tz) : null;

    return {
        _id: log._id,
        employeeId: log.employee_id,
        fullName: log.full_name || "-",
        computer: log.computer || "-",
        date: log.date || "-",
        time: startMoment ? startMoment.format("HH:mm:ss") : "-",
        screenshot: extractScreenshot(log.description),
        department: log.departament || "-",
        location: log.location || "-",
        timezone: tz,
    };
};

// ─── API ────────────────────────────────────────────────────────────────────

const buildUrl = (filters) => {
    const start = filters.startDate || moment().format("YYYY-MM-DD");
    const end = filters.endDate || moment().format("YYYY-MM-DD");

    let url = `/system-logs?startDate=${start}&endDate=${end}&limit=${filters.limit}&offset=${filters.skip}&type=10`;

    if (filters.employeeId && filters.employeeId !== "all") url += `&employee_id=${filters.employeeId}`;
    if (filters.locationId && filters.locationId !== "all") url += `&location_id=${filters.locationId}`;
    if (filters.departmentId && filters.departmentId !== "all") url += `&department_id=${filters.departmentId}`;
    if (filters.searchText) url += `&search_text=${encodeURIComponent(filters.searchText)}`;
    if (filters.sortName) url += `&sort_name=${filters.sortName}`;
    if (filters.sortOrder) url += `&sort_order=${filters.sortOrder}`;

    return url;
};

export const fetchLogs = async (filters) => {
    try {
        const { data } = await apiService.apiInstance.get(buildUrl(filters));
        const docs = data?.data?.docs ?? [];
        const totalDocs = data?.data?.totalDocs ?? 0;
        const allRows = (Array.isArray(docs) ? docs : []).map(mapRow);
        return { rows: allRows, totalDocs };
    } catch (error) {
        console.error("Screenshot Logs API Error:", error);
        return { rows: [], totalDocs: 0 };
    }
};

export const fetchExport = async (filters) => {
    try {
        const { data } = await apiService.apiInstance.get(
            buildUrl({ ...filters, skip: 0, limit: 50000 })
        );
        const docs = data?.data?.docs ?? [];
        return (Array.isArray(docs) ? docs : []).map(mapRow);
    } catch (error) {
        console.error("Screenshot Logs Export API Error:", error);
        return [];
    }
};

// ─── Export Config ───────────────────────────────────────────────────────────

const HEADERS = ["Employee Name", "Computer", "Event Date", "Event Time"];

const buildExportRow = (row) => [row.fullName, row.computer, row.date, row.time];

export const exportCsv = (rows, filters) => exportToCsv({
    rows, headers: HEADERS, buildRow: buildExportRow,
    sheetName: "Screenshot Logs",
    fileName: `Screenshot_Logs_${filters.startDate}_to_${filters.endDate}.xlsx`,
});

export const exportPdf = (rows, filters) => exportToPdf({
    rows, headers: HEADERS, buildRow: buildExportRow,
    title: "Screenshot Logs Report",
    fileName: `Screenshot_Logs_${filters.startDate}_to_${filters.endDate}.pdf`,
    dateRange: `${filters.startDate} to ${filters.endDate}`,
});

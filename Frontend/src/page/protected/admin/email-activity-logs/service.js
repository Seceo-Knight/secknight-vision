import apiService from "@/services/api.service";
import moment from "moment-timezone";
import { exportToCsv, exportToPdf } from "@/services/dlp.service";

// ─── Row Mapper ─────────────────────────────────────────────────────────────

const mapRow = (log) => {
    const tz = log.employee_details?.timezone || "Asia/Kolkata";
    const startMoment = log.start_time ? moment.utc(log.start_time).tz(tz) : null;
    const endMoment = log.end_time ? moment.utc(log.end_time).tz(tz) : null;
    const timestampMoment = log.log_data?.timestamp ? moment.utc(log.log_data.timestamp).tz(tz) : null;

    const emp = log.employee_details || {};
    const logData = log.log_data || {};

    return {
        _id: log._id,
        type: log.type,
        employeeId: log.employee_id,
        employeeName: [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "-",
        email: emp.a_email || "-",
        title: logData.pageTitle || "-",
        url: logData.url || "-",
        label: logData.label || "-",
        startTime: startMoment ? startMoment.format("YYYY-MM-DD HH:mm:ss") : "-",
        endTime: endMoment ? endMoment.format("YYYY-MM-DD HH:mm:ss") : "-",
        from: logData.from || logData.sender || "-",
        to: logData.to || "-",
        cc: logData.cc || "-",
        bcc: logData.bcc || "-",
        subject: logData.subject || "-",
        body: logData.body || "-",
        attachments: Array.isArray(logData.attachments) ? logData.attachments : [],
        timestamp: timestampMoment ? timestampMoment.format("YYYY-MM-DD HH:mm:ss") : "-",
        timezone: tz,
    };
};

// ─── API ────────────────────────────────────────────────────────────────────

const buildUrl = (filters) => {
    const start = filters.startDate || moment().format("YYYY-MM-DD");
    const end = filters.endDate || moment().format("YYYY-MM-DD");

    let url = `/email-monitoring/get-email-monitoring?&start_date=${start}&end_date=${end}&type=${filters.type || "0"}&limit=${filters.limit}&skip=${filters.skip}`;

    if (filters.employeeId && filters.employeeId !== "all") url += `&employee_id=${filters.employeeId}`;
    if (filters.locationId && filters.locationId !== "all") url += `&location_id=${filters.locationId}`;
    if (filters.departmentId && filters.departmentId !== "all") url += `&department_id=${filters.departmentId}`;
    if (filters.searchText) url += `&search_text=${encodeURIComponent(filters.searchText)}`;

    return url;
};

export const fetchLogs = async (filters) => {
    try {
        const { data } = await apiService.apiInstance.get(buildUrl(filters));
        const apiData = data?.data ?? {};
        const docs = apiData.email_monitoring ?? [];
        const totalDocs = apiData.email_monitoring_count ?? 0;
        return { rows: (Array.isArray(docs) ? docs : []).map(mapRow), totalDocs };
    } catch (error) {
        console.error("Email Activity Logs API Error:", error);
        return { rows: [], totalDocs: 0 };
    }
};

export const fetchExport = async (filters) => {
    try {
        const { data } = await apiService.apiInstance.get(
            buildUrl({ ...filters, skip: 0, limit: 50000 })
        );
        const docs = data?.data?.email_monitoring ?? [];
        return (Array.isArray(docs) ? docs : []).map(mapRow);
    } catch (error) {
        console.error("Email Activity Logs Export API Error:", error);
        return [];
    }
};

// ─── Export Config ───────────────────────────────────────────────────────────

const getExportConfig = (type) => {
    if (type === "0" || type === "4") {
        const headers = type === "0"
            ? ["Employee", "To", "CC", "BCC", "Subject", "Body", "Attachments", "Timestamp"]
            : ["Employee", "From", "CC", "Subject", "Body", "Attachments", "Timestamp"];
        const buildRow = (row) => {
            const base = [row.employeeName];
            if (type === "0") base.push(row.to, row.cc, row.bcc);
            else base.push(row.from, row.cc);
            base.push(row.subject, row.body, row.attachments.length.toString(), row.timestamp);
            return base;
        };
        return { headers, buildRow };
    }
    return {
        headers: ["Employee", "Page Title", "URL", "Label", "Start Time", "End Time"],
        buildRow: (row) => [row.employeeName, row.title, row.url, row.label, row.startTime, row.endTime],
    };
};

export const exportCsv = (rows, filters) => {
    const { headers, buildRow } = getExportConfig(filters.type);
    return exportToCsv({
        rows, headers, buildRow,
        sheetName: "Email Activity Logs",
        fileName: `Email_Activity_Logs_${filters.startDate}_to_${filters.endDate}.xlsx`,
    });
};

export const exportPdf = (rows, filters) => {
    const { headers, buildRow } = getExportConfig(filters.type);
    return exportToPdf({
        rows, headers, buildRow,
        title: "Email Activity Logs Report",
        fileName: `Email_Activity_Logs_${filters.startDate}_to_${filters.endDate}.pdf`,
        dateRange: `${filters.startDate} to ${filters.endDate}`,
    });
};

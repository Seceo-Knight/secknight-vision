import { createDlpStore } from "@/hooks/useDlpStore";
import { fetchLogs, fetchExport, exportCsv, exportPdf } from "./service";

export const useEmailActivityLogsStore = createDlpStore({
    name: "Email Activity Logs",
    extraFilters: { type: "0" },
    fetchLogs,
    fetchExport,
    exportCsv,
    exportPdf,
});

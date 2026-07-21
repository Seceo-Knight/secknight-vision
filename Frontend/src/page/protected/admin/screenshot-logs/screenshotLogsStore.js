import { createDlpStore } from "@/hooks/useDlpStore";
import { fetchLogs, fetchExport, exportCsv, exportPdf } from "./service";

export const useScreenshotLogsStore = createDlpStore({
    name: "Screenshot Logs",
    fetchLogs,
    fetchExport,
    exportCsv,
    exportPdf,
});

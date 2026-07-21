import { createDlpStore } from "@/hooks/useDlpStore";
import { fetchLogs, fetchExport, exportCsv, exportPdf } from "./service";

export const useUsbDetectionStore = createDlpStore({
    name: "USB Detection",
    fetchLogs,
    fetchExport,
    exportCsv,
    exportPdf,
});

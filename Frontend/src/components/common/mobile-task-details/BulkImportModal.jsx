import React, { useState, useCallback } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BulkImportModal({ open, onClose, onImport, title = "Bulk Import" }) {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!file) return;
        setImporting(true);
        await onImport(file);
        setImporting(false);
        setFile(null);
    }, [file, onImport]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                        />
                        {file && <p className="text-xs text-slate-500 mt-2">{file.name}</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 py-4 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleSubmit} disabled={!file || importing}>
                        {importing ? "Importing..." : "Import"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-slate-400">
                Showing {from} to {to} of {totalItems}
            </p>

            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((num) => (
                    <button
                        key={num}
                        onClick={() => onPageChange(num)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
                            currentPage === num
                                ? "bg-[#4A7BF7] text-white shadow-md shadow-blue-200"
                                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                        {num}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default React.memo(Pagination);

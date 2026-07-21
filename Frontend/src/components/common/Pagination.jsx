import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const getPageItems = ({ currentPage, totalPages, windowSize = 3 }) => {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);
  const win = Math.max(1, Math.min(windowSize, total));

  // center window around current
  let start = current - Math.floor(win / 2);
  let end = start + win - 1;

  if (start < 1) {
    start = 1;
    end = win;
  }
  if (end > total) {
    end = total;
    start = Math.max(1, end - win + 1);
  }

  const range = [];
  for (let p = start; p <= end; p++) range.push(p);

  const items = [];
  if (range[0] !== 1) items.push(1);
  if (range[0] > 2) items.push("...");
  items.push(...range);
  if (range[range.length - 1] < total - 1) items.push("...");
  if (range[range.length - 1] !== total) items.push(total);

  // Deduplicate consecutive ellipses
  return items.filter((x, idx, arr) => !(x === "..." && arr[idx - 1] === "..."));
};

export default function PaginationComponent({
  currentPage = 1,
  totalPages = 3,
  onPageChange,
}) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safeCurrent = Math.min(Math.max(1, Number(currentPage) || 1), safeTotal);
  const items = getPageItems({ currentPage: safeCurrent, totalPages: safeTotal, windowSize: 3 });

  return (
    <div className="flex items-center gap-1.5">
      <button
        className="h-[30px] w-[30px] flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        onClick={() => onPageChange(safeCurrent - 1)}
        disabled={safeCurrent === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {items.map((it, idx) => {
        if (it === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="h-[30px] min-w-[30px] px-2 flex items-center justify-center text-gray-400 select-none"
            >
              ...
            </span>
          );
        }

        const p = it;
        return (
          <button
            key={p}
            className={`h-[30px] w-[30px] flex items-center justify-center rounded border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              p === safeCurrent
                ? "bg-[#0066ff] text-white border-[#0066ff]"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === safeCurrent ? "page" : undefined}
          >
            {p}
          </button>
        );
      })}

      <button
        className="h-[30px] w-[30px] flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        onClick={() => onPageChange(safeCurrent + 1)}
        disabled={safeCurrent === safeTotal}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

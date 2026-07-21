import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Format Date to YYYY-MM-DD */
const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Parse YYYY-MM-DD to Date */
const parse = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Check if two dates are same day */
const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Check if date is between start and end */
const isBetween = (d, start, end) => {
  if (!start || !end) return false;
  const t = d.getTime();
  return t > start.getTime() && t < end.getTime();
};

/** Get calendar grid for a month (6 rows x 7 cols) */
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday = 0 ... Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, current: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, current: true, date: new Date(year, month, i) });
  }

  // Next month leading days
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
  }

  return days;
}

/** Start of the month for a given date */
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
/** End of the month for a given date */
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
/** Add n days (n can be negative) to a copy of the date */
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * DateRangeCalendar — Shared date range picker with calendar dropdown.
 *
 * Props:
 *   startDate: string "YYYY-MM-DD"
 *   endDate: string "YYYY-MM-DD"
 *   onChange: (startDate, endDate) => void
 *   maxDate?: Date (default: today)
 *   placeholder?: string
 */
export default function DateRangeCalendar({
  startDate,
  endDate,
  onChange,
  maxDate,
  placeholder = "Select date range",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const d = parse(startDate) || new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parse(startDate) || new Date();
    return d.getMonth();
  });
  const [rangeStart, setRangeStart] = useState(() => parse(startDate));
  const [rangeEnd, setRangeEnd] = useState(() => parse(endDate));
  // The range the component first mounted with — "Reset" restores this
  // (i.e. the page's default range), rather than blanking the picker.
  const initialRange = useRef({ start: startDate, end: endDate });
  const [hovered, setHovered] = useState(null);
  // When false, the dropdown shows only the preset list. Clicking "Custom
  // Range" flips this on to reveal the calendar grid for manual selection.
  const [customMode, setCustomMode] = useState(false);
  // Whether to anchor the dropdown to the right edge of the trigger. Chosen
  // dynamically so a wide dropdown always opens toward the side with room,
  // regardless of where the field sits on the page.
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef(null);

  const max = maxDate || new Date();
  const today = new Date();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Pick the dropdown's anchor side based on available space: open toward the
  // right (extend left) only when a left-aligned dropdown would overflow the
  // viewport. Re-evaluated when the width changes (presets vs custom view).
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = customMode ? 700 : 160;
    setAlignRight(rect.left + width + 16 > window.innerWidth);
  }, [open, customMode]);

  // Ref to track if change is internal (user click) vs external (prop sync)
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external props — only if they actually differ from current state
  useEffect(() => {
    const newStart = parse(startDate);
    const newEnd = parse(endDate);
    if (!sameDay(newStart, rangeStart)) setRangeStart(newStart);
    if (!sameDay(newEnd, rangeEnd)) setRangeEnd(newEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    const m2 = viewMonth === 11 ? 0 : viewMonth + 1;
    const y2 = viewMonth === 11 ? viewYear + 1 : viewYear;
    // Don't advance if the right-hand month would pass the current month.
    if (y2 > max.getFullYear() || (y2 === max.getFullYear() && m2 >= max.getMonth())) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = useCallback((date) => {
    if (date > max) return;

    // If no start or both selected → start new selection
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }

    // If start selected, pick end — notify parent immediately
    let newStart = rangeStart;
    let newEnd = date;
    if (date < rangeStart) {
      newStart = date;
      newEnd = rangeStart;
    }
    setRangeStart(newStart);
    setRangeEnd(newEnd);
    onChangeRef.current?.(fmt(newStart), fmt(newEnd));
  }, [rangeStart, rangeEnd, max]);

  // Double-tap: select single date as both start and end
  const handleDoubleClick = useCallback((date) => {
    if (date > max) return;
    setRangeStart(date);
    setRangeEnd(date);
    onChangeRef.current?.(fmt(date), fmt(date));
    setOpen(false);
  }, [max]);

  const handleReset = () => {
    const { start, end } = initialRange.current;
    const s = parse(start);
    const e = parse(end);
    setRangeStart(s);
    setRangeEnd(e);
    if (s) {
      setViewYear(s.getFullYear());
      setViewMonth(s.getMonth());
    }
    setCustomMode(false);
    onChangeRef.current?.(start || "", end || "");
    setOpen(false);
  };

  // Display text
  const displayText = rangeStart
    ? rangeEnd
      ? `${fmt(rangeStart)} — ${fmt(rangeEnd)}`
      : fmt(rangeStart)
    : placeholder;

  // Determine if a date is in the selection/hover range
  const getDateState = (date, isCurrent) => {
    const isDisabled = date > max || !isCurrent;
    const isStart = rangeStart && sameDay(date, rangeStart);
    const isEnd = rangeEnd && sameDay(date, rangeEnd);
    const isInRange = rangeStart && rangeEnd
      ? isBetween(date, rangeStart, rangeEnd)
      : rangeStart && !rangeEnd && hovered
        ? isBetween(date, rangeStart, hovered) || isBetween(date, hovered, rangeStart)
        : false;
    const isToday = sameDay(date, today);

    return { isDisabled, isStart, isEnd, isInRange, isToday };
  };

  // Quick-range presets. Ranges are computed relative to today and clamped to
  // `max` so a preset never selects a future date the calendar disallows.
  const clampMax = (d) => (d > max ? new Date(max) : d);
  const presetDefs = [
    { key: "today", label: t("cal_today"), range: () => [today, today] },
    { key: "yesterday", label: t("cal_yesterday"), range: () => { const y = addDays(today, -1); return [y, y]; } },
    { key: "last_7_days", label: t("cal_last_7_days"), range: () => [addDays(today, -6), today] },
    { key: "last_30_days", label: t("cal_last_30_days"), range: () => [addDays(today, -29), today] },
    { key: "this_month", label: t("cal_this_month"), range: () => [startOfMonth(today), clampMax(endOfMonth(today))] },
    {
      key: "last_month",
      label: t("cal_last_month"),
      range: () => {
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return [startOfMonth(lm), endOfMonth(lm)];
      },
    },
  ];

  const applyPreset = (preset) => {
    const [rawStart, rawEnd] = preset.range();
    const s = clampMax(rawStart);
    const e = clampMax(rawEnd);
    setRangeStart(s);
    setRangeEnd(e);
    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
    onChangeRef.current?.(fmt(s), fmt(e));
    setCustomMode(false);
    setOpen(false);
  };

  // Which preset (if any) matches the current selection — for highlighting.
  const activePresetKey = (() => {
    if (!rangeStart || !rangeEnd) return null;
    for (const p of presetDefs) {
      const [s, e] = p.range();
      if (fmt(clampMax(s)) === fmt(rangeStart) && fmt(clampMax(e)) === fmt(rangeEnd)) return p.key;
    }
    return null;
  })();
  // A complete selection that matches no preset is a "Custom Range".
  const isCustomActive = !!(rangeStart && rangeEnd && !activePresetKey);

  // Second (right-hand) month for the dual-month custom view.
  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2 = viewMonth === 11 ? viewYear + 1 : viewYear;
  // The right month must not advance past the current (max) month.
  const atMaxMonth =
    year2 > max.getFullYear() ||
    (year2 === max.getFullYear() && month2 >= max.getMonth());

  // Enter custom mode, anchored so both months are useful: on an existing
  // selection show its start month on the left; otherwise show last month on
  // the left and the current month on the right.
  const enterCustomMode = () => {
    const base = rangeStart || new Date(today.getFullYear(), today.getMonth() - 1, 1);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setCustomMode(true);
  };

  // Render one month's day-grid (weekday header + 6×7 day cells).
  const renderMonth = (year, month) => {
    const monthDays = getCalendarDays(year, month);
    return (
      <div className="w-[224px]">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map(({ day, current, date }, i) => {
            const { isDisabled, isStart, isEnd, isInRange, isToday } = getDateState(date, current);
            return (
              <button
                type="button"
                key={i}
                disabled={isDisabled}
                onClick={() => handleDayClick(date)}
                onDoubleClick={() => handleDoubleClick(date)}
                onMouseEnter={() => setHovered(date)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative w-full aspect-square flex items-center justify-center text-[12px] transition-all rounded-full
                  ${!current ? "text-slate-300" : ""}
                  ${isDisabled ? "text-slate-300 cursor-default" : "cursor-pointer hover:bg-slate-100"}
                  ${isInRange && !isDisabled ? "bg-[#2598EB]/15" : ""}
                  ${(isStart || isEnd) && !isDisabled ? "bg-[#2598EB] text-white font-bold hover:bg-[#1f87d4]" : ""}
                  ${isToday && !isStart && !isEnd ? "font-bold text-[#2598EB] ring-1 ring-[#2598EB]/40" : ""}
                  ${current && !isStart && !isEnd && !isInRange && !isDisabled ? "text-slate-700" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    // #115 — was `inline-block` which forced the wrapper to its content's
    // intrinsic width, plus a 220px min on the trigger. Inside narrow grid
    // columns (e.g. GEO Location's lg:grid-cols-4) that overflowed and
    // visually pushed neighbors out of view. `block w-full min-w-0` lets
    // the wrapper participate in the grid's column sizing properly.
    <div ref={ref} className="relative block w-full min-w-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { const next = !open; setOpen(next); if (next && isCustomActive) enterCustomMode(); }}
        className="flex w-full items-center gap-2 border border-slate-200 rounded-lg px-3 h-10 text-xs text-slate-600 bg-white hover:border-slate-300 transition-colors"
      >
        <Calendar size={14} className="text-slate-400 shrink-0" />
        <span className={`truncate ${rangeStart ? "text-slate-700 font-medium" : "text-slate-400"}`}>
          {displayText}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 select-none flex max-w-[92vw] ${alignRight ? "right-0" : "left-0"} ${customMode ? "w-[700px]" : "w-[160px]"}`}>
          {/* Quick-range presets */}
          <div className={`flex flex-col gap-0.5 p-2 w-[160px] shrink-0 ${customMode ? "border-r border-slate-100" : ""}`}>
            {presetDefs.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className={`text-left text-[12px] rounded-lg px-3 py-2 transition-colors ${
                  activePresetKey === p.key
                    ? "bg-[#2598EB] text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={enterCustomMode}
              className={`text-left text-[12px] rounded-lg px-3 py-2 transition-colors ${
                !activePresetKey && (customMode || isCustomActive)
                  ? "bg-[#2598EB] text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t("cal_custom_range")}
            </button>
          </div>

          {/* Calendar column — shown only after "Custom Range" is chosen */}
          {customMode && (
          <div className="flex-1 p-4 min-w-0 overflow-x-auto">
          {/* Two-month range calendar */}
          <div className="flex gap-5">
            {/* Left month */}
            <div>
              <div className="flex items-center justify-between mb-3 h-7">
                <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-slate-800">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <span className="w-7" />
              </div>
              {renderMonth(viewYear, viewMonth)}
            </div>

            {/* Right month */}
            <div>
              <div className="flex items-center justify-between mb-3 h-7">
                <span className="w-7" />
                <span className="text-sm font-semibold text-slate-800">
                  {MONTHS[month2]} {year2}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  disabled={atMaxMonth}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${atMaxMonth ? "text-slate-200 cursor-default" : "hover:bg-slate-100 text-slate-500"}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {renderMonth(year2, month2)}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 leading-tight">
              {t("cal_double_tap_hint")}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-4 border border-slate-300 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t("ts_reset")}
            </button>
          </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

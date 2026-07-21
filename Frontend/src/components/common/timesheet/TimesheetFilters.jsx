import React from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import CustomSelect from "@/components/common/elements/CustomSelect";
import DateRangeCalendar from "@/components/common/elements/DateRangeCalendar";

function TimesheetFilters({
    locations,
    departments,
    employees,
    shifts,
    locationValue,
    departmentValue,
    employeeValue,
    shiftValue,
    startDate,
    endDate,
    onLocationChange,
    onDepartmentChange,
    onEmployeeChange,        
    onShiftChange,
    onDateRangeChange,
}) {
    const { t } = useTranslation();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-4 mb-5">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("location")}
                </label>
                <CustomSelect
                    placeholder={t("emp_all_locations")}
                    items={locations}
                    selected={locationValue}
                    onChange={onLocationChange}
                    width="full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("department")}
                </label>
                <CustomSelect
                    placeholder={t("emp_all_departments")}
                    items={departments}
                    selected={departmentValue}
                    onChange={onDepartmentChange}
                    width="full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("employee")}
                </label>
                <CustomSelect
                    placeholder={t("emp_all_employees")}
                    items={employees}
                    selected={employeeValue}
                    onChange={onEmployeeChange}
                    width="full"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t("emp_shift")}
                </label>
                <CustomSelect
                    placeholder={t("emp_all_shifts")}
                    items={shifts}
                    selected={shiftValue}
                    onChange={onShiftChange}
                    width="full"
                />
            </div>
            <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-1.5">
                    {t("ts_select_date_ranges")} :
                    <span className="relative group">
                        <Info className="w-3.5 h-3.5 text-blue-500 cursor-pointer" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-3 py-1.5 text-[11px] text-white bg-slate-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                            {t("ts_date_range_tooltip")}
                        </span>
                    </span>
                </label>
                <DateRangeCalendar
                    startDate={startDate}
                    endDate={endDate}
                    onChange={onDateRangeChange}
                />
            </div>
        </div>
    );
}

export default React.memo(TimesheetFilters);

import React from "react";
import { Eye, MapPin, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRolesPermissionStore } from "@/page/protected/admin/roles-permissions/rolesPermissionStore";

const BADGE_COLORS = [
    { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
    { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
    { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
    { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
];

const getBadgeColor = (index) => BADGE_COLORS[index % BADGE_COLORS.length];

const ViewRoleDialog = ({ open, onOpenChange }) => {
    const viewRoleData = useRolesPermissionStore((s) => s.viewRoleData);
    const categorizedPermissions = useRolesPermissionStore((s) => s.categorizedPermissions);

    if (!viewRoleData) return null;

    const role = viewRoleData;
    const activePermissionIds = role.permission_ids
        ? role.permission_ids.split(",").map((id) => parseInt(id, 10))
        : [];

    const locationBadges = [];
    if (role.locations?.length > 0) {
        role.locations.forEach((loc) => locationBadges.push(loc.location));
    } else {
        locationBadges.push("All Locations");
    }

    const departmentBadges = [];
    if (role.departments?.length > 0) {
        role.departments.forEach((d) => departmentBadges.push(d.department));
    } else if (role.locations?.length > 0) {
        role.locations.forEach((loc) => {
            if (loc.departments?.length > 0) {
                loc.departments.forEach((d) => {
                    if (d.department) departmentBadges.push(`${d.department} (${d.location})`);
                });
            }
        });
        if (departmentBadges.length === 0) departmentBadges.push("All Departments");
    } else {
        departmentBadges.push("All Departments");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-2xl p-0 gap-0 border-0">
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 rounded-t-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            View Role: {role.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-300 text-xs mt-1">
                            Role details, locations, departments and permissions
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-semibold text-slate-600">Locations</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {locationBadges.map((loc, i) => {
                                const color = getBadgeColor(i);
                                return (
                                    <span key={i} className={`px-3 py-1 rounded-md text-[11px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                                        {loc}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-slate-600">Departments</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {departmentBadges.map((dept, i) => {
                                const color = getBadgeColor(i + 2);
                                return (
                                    <span key={i} className={`px-3 py-1 rounded-md text-[11px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                                        {dept}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {activePermissionIds.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-semibold text-slate-600">Feature Permissions</span>
                            </div>
                            <div className="space-y-3">
                                {Object.entries(categorizedPermissions).map(([category, perms]) => {
                                    const activePerms = perms.filter((p) => activePermissionIds.includes(p.id));
                                    if (activePerms.length === 0) return null;
                                    return (
                                        <div key={category}>
                                            <p className="text-xs font-semibold text-slate-700 mb-1">{category}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {activePerms.map((p) => (
                                                    <span key={p.id} className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        {p.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activePermissionIds.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-slate-400">No feature permissions assigned</p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                    <Button
                        variant="outline"
                        className="rounded-xl px-5 text-xs font-semibold border-slate-300"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewRoleDialog;

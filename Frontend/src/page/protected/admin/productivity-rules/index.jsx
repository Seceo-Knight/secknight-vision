import React, { useEffect } from "react";
import EmpProductivityRule from "@/components/common/productivity-rules/EmpProductivityRule";
import { useProductivityRulesStore } from "./productivityRulesStore";

const ProductivityRules = () => {
    const loadInitial = useProductivityRulesStore((s) => s.loadInitial);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    return (
        <div className="bg-slate-200 w-full min-h-screen p-5">
            <EmpProductivityRule />
        </div>
    );
};

export default ProductivityRules;

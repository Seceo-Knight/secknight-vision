import React from "react";
import OfficeTime from "./graphs/OfficeTime";
import ProductiveTime from "./graphs/ProductiveTime";
import UnProductiveTime from "./graphs/UnProductiveTime";
import ProductiveTimeStats from "./graphs/ProductiveTimeStats";
import ProductivePercentage from "./graphs/ProductivePercentage";

const InsightsGraphs = ({ insightStats }) => {
  const today = insightStats?.today;
  const yesterday = insightStats?.yesterday;
  const organization = insightStats?.organization;

  return (
    <div className="w-full mt-6 rounded-b-2xl bg-[#EEF4FF] p-9 ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 2xl:gap-6">
        <OfficeTime value={today?.officeTime} />
        <ProductiveTime value={today?.productiveTime} />
        <UnProductiveTime value={today?.unproductiveTime} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ProductiveTimeStats today={today} yesterday={yesterday} />
        <ProductivePercentage today={today} yesterday={yesterday} organization={organization} />
      </div>
    </div>
  );
};

export default InsightsGraphs;

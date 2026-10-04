"use client";

import Pricing from "./Pricing";
import ProBenefits from "./ProBenefits";
import { usePlan } from "@/lib/usePlan";

// Free / signed-out visitors see Pricing. Pro members see their benefits instead.
export default function PlanSection() {
  const { isPro, loading } = usePlan();
  if (loading) return <div className="h-40" aria-hidden="true" />; // keeps the layout steady while we check
  return isPro ? <ProBenefits /> : <Pricing />;
}
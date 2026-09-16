/* =============================================
   AUTO LATE FEE CALCULATION
   ₹10/day penalty after 180-day tenure
   
   Call this function daily via cron/scheduler:
   - Backend cron: import { calculateLateFees } from "./utils/lateFeeCalc"
   - Or call via API: POST /api/emi/calculate-late-fees
============================================= */

const LATE_FEE_PER_DAY = 10; // ₹10 per day
const TENURE_DAYS = 180; // 6 months = 180 days

type EMIPlan = {
  _id: string;
  customerId: any;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  createdAt: string;
  tenureDays?: number;
  lateFeePerDay?: number;
  totalLateFee?: number;
  lastLateFeeCalc?: string;
  paymentHistory?: Array<{
    amount: number;
    status: string;
    approvedAt?: string;
  }>;
};

/**
 * Calculate late fees for all active EMI plans that have crossed the tenure.
 * Returns array of { planId, lateFee, totalPending } for each plan updated.
 */
export function calculateLateFees(plans: EMIPlan[]): Array<{
  planId: string;
  lateFee: number;
  totalPending: number;
  customerId: any;
}> {
  const today = new Date();
  const results: Array<{
    planId: string;
    lateFee: number;
    totalPending: number;
    customerId: any;
  }> = [];

  for (const plan of plans) {
    // Only process active plans with pending amount
    if (plan.status !== "ACTIVE" || plan.pendingAmount <= 0) continue;

    const createdDate = new Date(plan.createdAt);
    const daysSinceCreation = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only apply late fee after tenure (180 days)
    if (daysSinceCreation < (plan.tenureDays || TENURE_DAYS)) continue;

    // Calculate days since tenure expired
    const overdueDays = daysSinceCreation - (plan.tenureDays || TENURE_DAYS);

    // Calculate late fee
    const lateFee = overdueDays * (plan.lateFeePerDay || LATE_FEE_PER_DAY);

    // Don't exceed pending amount
    const effectiveLateFee = Math.min(lateFee, plan.pendingAmount);

    // Check if we already applied this fee today
    const lastCalc = plan.lastLateFeeCalc
      ? new Date(plan.lastLateFeeCalc).toISOString().split("T")[0]
      : "";
    const todayStr = today.toISOString().split("T")[0];

    if (lastCalc === todayStr) continue; // Already calculated today

    results.push({
      planId: plan._id,
      lateFee: effectiveLateFee,
      totalPending: plan.pendingAmount + effectiveLateFee,
      customerId: plan.customerId,
    });
  }

  return results;
}

/**
 * Get late fee summary for a single plan (for display purposes)
 */
export function getLateFeeSummary(plan: EMIPlan): {
  isOverdue: boolean;
  overdueDays: number;
  lateFeePerDay: number;
  totalLateFee: number;
  daysUntilOverdue: number;
} {
  const today = new Date();
  const createdDate = new Date(plan.createdAt);
  const daysSinceCreation = Math.floor(
    (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const tenureDays = plan.tenureDays || TENURE_DAYS;
  const isOverdue = daysSinceCreation >= tenureDays && plan.status === "ACTIVE" && plan.pendingAmount > 0;
  const overdueDays = isOverdue ? daysSinceCreation - tenureDays : 0;
  const totalLateFee = overdueDays * (plan.lateFeePerDay || LATE_FEE_PER_DAY);
  const daysUntilOverdue = Math.max(0, tenureDays - daysSinceCreation);

  return {
    isOverdue,
    overdueDays,
    lateFeePerDay: plan.lateFeePerDay || LATE_FEE_PER_DAY,
    totalLateFee: Math.min(totalLateFee, plan.pendingAmount),
    daysUntilOverdue,
  };
}

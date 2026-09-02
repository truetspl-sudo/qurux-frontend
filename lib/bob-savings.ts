"use client";

/* =====================================================
   TYPES
===================================================== */

export type BobsavingDeposit = {
  id: string;
  customerId: string;
  originalAmount: number;
  depositDate: string; // ISO date
  usedAmount: number;
  benefitEnabled: boolean; // false if used before 30 days
  status: "ACTIVE" | "USED" | "FROZEN";
  reference?: string; // payment ID
};

export type BobsavingUsage = {
  id: string;
  customerId: string;
  depositId: string;
  amount: number;
  date: string;
  description: string;
  balanceAfter: number;
};

export type BobsavingStatementRow = {
  id: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
};

/* =====================================================
   LOCAL STORAGE HELPERS
===================================================== */

function readLocalArray(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(key: string, data: any[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* =====================================================
   DEPOSIT MANAGEMENT
===================================================== */

export function getAllDeposits(customerId: string): BobsavingDeposit[] {
  const deposits = readLocalArray("bobDeposits");
  return deposits.filter(
    (d: BobsavingDeposit) => String(d.customerId) === String(customerId)
  );
}

export function createDeposit(
  customerId: string,
  amount: number,
  reference?: string
): BobsavingDeposit {
  const deposit: BobsavingDeposit = {
    id: `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customerId,
    originalAmount: Math.max(0, Number(amount) || 0),
    depositDate: new Date().toISOString(),
    usedAmount: 0,
    benefitEnabled: true,
    status: "ACTIVE",
    reference: reference || undefined,
  };

  const all = readLocalArray("bobDeposits");
  all.push(deposit);
  saveLocal("bobDeposits", all);

  return deposit;
}

/* =====================================================
   BENEFIT CALCULATION
   Per-deposit: 30 days → 20%, then +10%/month, max 100%
   If used before 30 days → no benefit at all
===================================================== */

function daysBetween(from: string, to?: string): number {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

export function getDepositBenefit(deposit: BobsavingDeposit): {
  milestonePercent: number;
  benefitAmount: number;
  totalValue: number;
  monthsCompleted: number;
  nextMilestoneDate: string | null;
} {
  // 30-day rule: if deposit was used before 30 days, no benefit
  if (!deposit.benefitEnabled) {
    return {
      milestonePercent: 0,
      benefitAmount: 0,
      totalValue: deposit.originalAmount - deposit.usedAmount,
      monthsCompleted: 0,
      nextMilestoneDate: null,
    };
  }

  const ageDays = daysBetween(deposit.depositDate);
  const completedMonths = Math.floor(ageDays / 30);

  if (ageDays < 30) {
    return {
      milestonePercent: 0,
      benefitAmount: 0,
      totalValue: deposit.originalAmount - deposit.usedAmount,
      monthsCompleted: 0,
      nextMilestoneDate: new Date(
        new Date(deposit.depositDate).getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  }

  // 20% at 30 days, then +10% per additional month, max 100%
  const milestonePercent = Math.min(
    100,
    20 + Math.max(0, completedMonths - 1) * 10
  );

  const benefitAmount = Math.round(
    deposit.originalAmount * (milestonePercent / 100)
  );

  const remaining = deposit.originalAmount - deposit.usedAmount;
  const totalValue = remaining + benefitAmount;

  // Next milestone date
  let nextMilestoneDate: string | null = null;
  if (milestonePercent < 100) {
    const nextMonth = completedMonths + 1;
    nextMilestoneDate = new Date(
      new Date(deposit.depositDate).getTime() + nextMonth * 30 * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  return {
    milestonePercent,
    benefitAmount,
    totalValue: Math.max(0, totalValue),
    monthsCompleted: completedMonths,
    nextMilestoneDate,
  };
}

/* =====================================================
   TOTAL ACCOUNT BALANCE
===================================================== */

export function getAccountSummary(customerId: string): {
  totalDeposited: number;
  totalUsed: number;
  totalBenefit: number;
  availableBalance: number;
  eligibleSaving: number;
  deposits: BobsavingDeposit[];
  depositDetails: Array<{
    deposit: BobsavingDeposit;
    benefit: ReturnType<typeof getDepositBenefit>;
  }>;
} {
  const deposits = getAllDeposits(customerId);
  let totalDeposited = 0;
  let totalUsed = 0;
  let totalBenefit = 0;
  let eligibleSaving = 0;

  const depositDetails = deposits.map((deposit) => {
    const benefit = getDepositBenefit(deposit);
    const remaining = deposit.originalAmount - deposit.usedAmount;

    totalDeposited += deposit.originalAmount;
    totalUsed += deposit.usedAmount;
    totalBenefit += benefit.benefitAmount;
    eligibleSaving += remaining;

    return { deposit, benefit };
  });

  // Available = eligibleSaving (remaining principal) + total benefit
  const availableBalance = eligibleSaving + totalBenefit;

  return {
    totalDeposited,
    totalUsed,
    totalBenefit,
    availableBalance,
    eligibleSaving,
    deposits,
    depositDetails,
  };
}

/* =====================================================
   FIFO SPENDING RULE
   First In — First Out
   Oldest deposits used first
   If deposit < 30 days old → disable its benefit
===================================================== */

export function useFromBalance(
  customerId: string,
  amount: number,
  description: string
): { success: boolean; message: string; used: number } {
  const amountToUse = Math.max(0, Number(amount) || 0);

  if (amountToUse <= 0) {
    return { success: false, message: "Amount must be greater than 0.", used: 0 };
  }

  // Get all active deposits sorted by deposit date (oldest first)
  const allDeposits: BobsavingDeposit[] = readLocalArray("bobDeposits");
  const customerDeposits = allDeposits
    .filter(
      (d: BobsavingDeposit) =>
        String(d.customerId) === String(customerId) && d.status === "ACTIVE"
    )
    .sort(
      (a: BobsavingDeposit, b: BobsavingDeposit) =>
        new Date(a.depositDate).getTime() - new Date(b.depositDate).getTime()
    );

  // Calculate total available across all deposits
  let totalAvailable = 0;
  const depositDetails = customerDeposits.map((deposit) => {
    const benefit = getDepositBenefit(deposit);
    const available = deposit.originalAmount - deposit.usedAmount + benefit.benefitAmount;
    totalAvailable += available;
    return { deposit, available };
  });

  if (amountToUse > totalAvailable) {
    return {
      success: false,
      message: `Insufficient BOB balance. Available: ₹${totalAvailable.toLocaleString("en-IN")}`,
      used: 0,
    };
  }

  // FIFO: use oldest deposits first
  let remaining = amountToUse;
  const usageId = `USE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  for (const { deposit } of depositDetails) {
    if (remaining <= 0) break;

    const benefit = getDepositBenefit(deposit);
    const available = deposit.originalAmount - deposit.usedAmount + benefit.benefitAmount;

    if (available <= 0) continue;

    const toDeduct = Math.min(remaining, available);

    // Check 30-day rule: if we're using from a deposit that's < 30 days old
    const ageDays = daysBetween(deposit.depositDate);
    if (ageDays < 30) {
      // Freeze this deposit's benefit eligibility
      deposit.benefitEnabled = false;
    }

    deposit.usedAmount += toDeduct;
    remaining -= toDeduct;

    // If fully used, mark as USED
    if (deposit.usedAmount >= deposit.originalAmount) {
      deposit.status = "USED";
    }
  }

  // Save updated deposits
  const depositIndex = allDeposits.findIndex(
    (d: BobsavingDeposit) => String(d.customerId) === String(customerId)
  );

  // Update all customer deposits
  for (let i = allDeposits.length - 1; i >= 0; i--) {
    const updatedDeposit = customerDeposits.find(
      (cd) => cd.id === allDeposits[i].id
    );
    if (updatedDeposit) {
      allDeposits[i] = updatedDeposit;
    }
  }

  saveLocal("bobDeposits", allDeposits);

  // Record usage
  const usage: BobsavingUsage = {
    id: usageId,
    customerId,
    depositId: "",
    amount: amountToUse,
    date: new Date().toISOString(),
    description,
    balanceAfter: totalAvailable - amountToUse,
  };

  const usages = readLocalArray("bobUsage");
  usages.push(usage);
  saveLocal("bobUsage", usages);

  return {
    success: true,
    message: `₹${amountToUse.toLocaleString("en-IN")} used from BOB balance (FIFO).`,
    used: amountToUse,
  };
}

/* =====================================================
   STATEMENT BUILDER
===================================================== */

export function buildFullStatement(customerId: string): BobsavingStatementRow[] {
  const entries: Array<{
    id: string;
    date: string;
    description: string;
    credit: number;
    debit: number;
    sortTime: number;
  }> = [];

  const deposits = getAllDeposits(customerId);

  // Deposits + Benefits
  deposits.forEach((deposit) => {
    entries.push({
      id: deposit.id,
      date: deposit.depositDate,
      description: "Beauty Saving Deposit",
      credit: deposit.originalAmount,
      debit: 0,
      sortTime: new Date(deposit.depositDate).getTime(),
    });

    const benefit = getDepositBenefit(deposit);
    if (benefit.milestonePercent > 0) {
      const milestones = [20, 30, 40, 50, 60, 70, 80, 90, 100];
      milestones
        .filter((m) => m <= benefit.milestonePercent)
        .forEach((milestone) => {
          const previous = milestone === 20 ? 0 : milestone - 10;
          const added = Math.round(
            deposit.originalAmount * (milestone - previous) / 100
          );
          const benefitDate = new Date(
            new Date(deposit.depositDate).getTime() +
              ((milestone / 10) - 1) * 30 * 24 * 60 * 60 * 1000
          );

          entries.push({
            id: `${deposit.id}-BEN-${milestone}`,
            date: benefitDate.toISOString(),
            description:
              milestone === 20
                ? "20% Beauty Benefit"
                : `Additional 10% Benefit (${milestone}%)`,
            credit: added,
            debit: 0,
            sortTime: benefitDate.getTime(),
          });
        });
    }
  });

  // Usage
  const usages = readLocalArray("bobUsage");
  usages
    .filter((item: BobsavingUsage) => String(item.customerId) === String(customerId))
    .forEach((item: BobsavingUsage) => {
      entries.push({
        id: item.id,
        date: item.date,
        description: item.description || "Qurux Purchase",
        credit: 0,
        debit: item.amount,
        sortTime: new Date(item.date).getTime(),
      });
    });

  // EMI payments
  const emiPayments = readLocalArray("bobEMIPayments");
  emiPayments
    .filter(
      (p: any) =>
        String(p.customerId) === String(customerId) && p.status === "APPROVED"
    )
    .forEach((p: any) => {
      entries.push({
        id: p.id,
        date: p.paymentDate || p.submittedAt,
        description: `EMI Payment - ${p.purchaseName || "Qurux Purchase"}`,
        credit: Number(p.amount) || 0,
        debit: 0,
        sortTime: new Date(p.submittedAt || p.paymentDate).getTime(),
      });
    });

  // Sort by date
  entries.sort((a, b) => a.sortTime - b.sortTime);

  let running = 0;
  return entries.map((row) => {
    running += row.credit - row.debit;
    return {
      id: row.id,
      date: new Date(row.date).toLocaleDateString("en-IN"),
      description: row.description,
      credit: row.credit,
      debit: row.debit,
      balance: running,
    };
  });
}

/* =====================================================
   PURCHASES (Services / Products / Courses)
===================================================== */

export type BobsavingPurchase = {
  id: string;
  customerId: string;
  type: "SERVICE" | "PRODUCT" | "COURSE";
  name: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: "BOB" | "EMI" | "MIXED" | "FULL";
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  date: string;
  paymentHistory: Array<{
    id: string;
    amount: number;
    method: string;
    date: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  }>;
};

export function getCustomerPurchases(customerId: string): BobsavingPurchase[] {
  const purchases = readLocalArray("bobPurchases");
  return purchases.filter(
    (p: BobsavingPurchase) => String(p.customerId) === String(customerId)
  );
}

export function createPurchase(
  customerId: string,
  purchase: Omit<BobsavingPurchase, "id" | "date" | "paymentHistory">
): BobsavingPurchase {
  const newPurchase: BobsavingPurchase = {
    ...purchase,
    id: `PUR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    paymentHistory: [],
  };

  const purchases = readLocalArray("bobPurchases");
  purchases.push(newPurchase);
  saveLocal("bobPurchases", purchases);

  return newPurchase;
}

/* =====================================================
   PAY FROM BOB
   For booking/shop/learn integration
===================================================== */

export function getBobPaymentInfo(
  customerId: string,
  servicePrice: number
): {
  bobBalance: number;
  canPayFull: boolean;
  payableFromBob: number;
  remainingAfterPayment: number;
  benefitInfo: string;
} {
  const summary = getAccountSummary(customerId);
  const bobBalance = summary.availableBalance;
  const canPayFull = bobBalance >= servicePrice;
  const payableFromBob = Math.min(bobBalance, servicePrice);
  const remainingAfterPayment = bobBalance - payableFromBob;

  let benefitInfo = "";
  if (summary.depositDetails.length > 0) {
    const activeDeposits = summary.depositDetails.filter(
      (d) => d.deposit.status === "ACTIVE" && d.deposit.benefitEnabled
    );
    if (activeDeposits.length > 0) {
      const bestDeposit = activeDeposits.reduce((best, current) =>
        current.benefit.milestonePercent > best.benefit.milestonePercent
          ? current
          : best
      );
      benefitInfo = `Best earning deposit: ${bestDeposit.benefit.milestonePercent}% benefit active`;
    }
  }

  return {
    bobBalance,
    canPayFull,
    payableFromBob,
    remainingAfterPayment,
    benefitInfo,
  };
}

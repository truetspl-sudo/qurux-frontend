export type BOBEMIPurchaseType =
  | "SERVICE"
  | "PRODUCT"
  | "COURSE";

export type BOBEMIPlanInput = {
  customerId: string;
  purchaseType: BOBEMIPurchaseType;
  purchaseName: string;

  totalAmount: number;

  // Amount already paid using BOB balance.
  bobPaidAmount?: number;

  // Amount already paid separately.
  paidAmount?: number;

  // Remaining EMI amount.
  pendingAmount?: number;

  serviceSlug?: string;
  productId?: string;
  courseId?: string;
};

export type BOBEMIPayment = {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  approvedAt?: string;
  transactionId?: string;
};

export type BOBEMIPlan = {
  id: string;

  customerId: string;

  purchaseType: BOBEMIPurchaseType;

  purchaseName: string;

  totalAmount: number;

  bobPaidAmount: number;

  paidAmount: number;

  pendingAmount: number;

  paymentHistory: BOBEMIPayment[];

  status: "ACTIVE" | "COMPLETED";

  createdAt: string;

  serviceSlug?: string;

  productId?: string;

  courseId?: string;
};


/* --------------------------------
   CREATE EMI PLAN
--------------------------------- */

export function createBOBEMIPlan(
  input: BOBEMIPlanInput
): BOBEMIPlan {
  if (typeof window === "undefined") {
    throw new Error(
      "BOB EMI plans can only be created in the browser."
    );
  }

  const totalAmount = Math.max(
    0,
    Number(input.totalAmount) || 0
  );

  const bobPaidAmount = Math.min(
    totalAmount,
    Math.max(
      0,
      Number(input.bobPaidAmount) || 0
    )
  );

  const paidAmount = Math.min(
    Math.max(
      0,
      Number(input.paidAmount) || 0
    ),
    Math.max(
      0,
      totalAmount - bobPaidAmount
    )
  );

  const calculatedPending =
    Math.max(
      0,
      totalAmount -
        bobPaidAmount -
        paidAmount
    );

  const pendingAmount =
    input.pendingAmount !== undefined
      ? Math.max(
          0,
          Math.min(
            calculatedPending,
            Number(input.pendingAmount) || 0
          )
        )
      : calculatedPending;

  const plan: BOBEMIPlan = {
    id:
      `EMI-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8),

    customerId: input.customerId,

    purchaseType: input.purchaseType,

    purchaseName: input.purchaseName,

    totalAmount,

    bobPaidAmount,

    paidAmount,

    pendingAmount,

    paymentHistory: [],

    status:
      pendingAmount <= 0
        ? "COMPLETED"
        : "ACTIVE",

    createdAt:
      new Date().toISOString(),
  };

  if (input.serviceSlug) {
    plan.serviceSlug =
      input.serviceSlug;
  }

  if (input.productId) {
    plan.productId =
      input.productId;
  }

  if (input.courseId) {
    plan.courseId =
      input.courseId;
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  let plans: BOBEMIPlan[] = [];

  try {
    plans = saved
      ? JSON.parse(saved)
      : [];
  } catch {
    plans = [];
  }

  plans.push(plan);

  localStorage.setItem(
    "bobEMIPlans",
    JSON.stringify(plans)
  );

  return plan;
}


/* --------------------------------
   GET CUSTOMER EMI PLANS
--------------------------------- */

export function getCustomerBOBEMIPlans(
  customerId: string
): BOBEMIPlan[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  if (!saved) {
    return [];
  }

  try {
    const plans: BOBEMIPlan[] =
      JSON.parse(saved);

    return plans.filter(
      (plan) =>
        plan.customerId ===
        customerId
    );
  } catch {
    return [];
  }
}


/* --------------------------------
   FIND ONE EMI PLAN
--------------------------------- */

export function getBOBEMIPlan(
  planId: string
): BOBEMIPlan | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  if (!saved) {
    return null;
  }

  try {
    const plans: BOBEMIPlan[] =
      JSON.parse(saved);

    return (
      plans.find(
        (plan) =>
          plan.id === planId
      ) || null
    );
  } catch {
    return null;
  }
}


/* --------------------------------
   ADD EMI PAYMENT
--------------------------------- */

export function addBOBEMIPayment(
  planId: string,
  amount: number,
  transactionId?: string
): BOBEMIPlan | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  if (!saved) {
    return null;
  }

  try {
    const plans: BOBEMIPlan[] =
      JSON.parse(saved);

    const index =
      plans.findIndex(
        (plan) =>
          plan.id === planId
      );

    if (index === -1) {
      return null;
    }

    const plan =
      plans[index];

    const paymentAmount =
      Number(amount);

    if (
      !Number.isFinite(
        paymentAmount
      ) ||
      paymentAmount < 10
    ) {
      throw new Error(
        "Minimum EMI payment is ₹10."
      );
    }

    if (
      paymentAmount >
      plan.pendingAmount
    ) {
      throw new Error(
        "Payment cannot exceed pending amount."
      );
    }

    const payment: BOBEMIPayment = {
      id:
        `EMIPAY-${Date.now()}-` +
        Math.random()
          .toString(36)
          .slice(2, 7),

      amount: paymentAmount,

      status: "PENDING",

      submittedAt:
        new Date().toISOString(),

      transactionId,
    };

    plan.paymentHistory.push(
      payment
    );

    plans[index] = plan;

    localStorage.setItem(
      "bobEMIPlans",
      JSON.stringify(plans)
    );

    return plan;
  } catch {
    return null;
  }
}


/* --------------------------------
   APPROVE EMI PAYMENT
--------------------------------- */

export function approveBOBEMIPayment(
  planId: string,
  paymentId: string
): BOBEMIPlan | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  if (!saved) {
    return null;
  }

  try {
    const plans: BOBEMIPlan[] =
      JSON.parse(saved);

    const index =
      plans.findIndex(
        (plan) =>
          plan.id === planId
      );

    if (index === -1) {
      return null;
    }

    const plan =
      plans[index];

    const payment =
      plan.paymentHistory.find(
        (item) =>
          item.id === paymentId
      );

    if (!payment) {
      return null;
    }

    if (
      payment.status ===
      "APPROVED"
    ) {
      return plan;
    }

    if (
      payment.status ===
      "REJECTED"
    ) {
      return plan;
    }

    payment.status =
      "APPROVED";

    payment.approvedAt =
      new Date().toISOString();

    plan.paidAmount =
      Math.min(
        plan.totalAmount -
          plan.bobPaidAmount,

        plan.paidAmount +
          payment.amount
      );

    plan.pendingAmount =
      Math.max(
        0,
        plan.totalAmount -
          plan.bobPaidAmount -
          plan.paidAmount
      );

    plan.status =
      plan.pendingAmount <= 0
        ? "COMPLETED"
        : "ACTIVE";

    plans[index] = plan;

    localStorage.setItem(
      "bobEMIPlans",
      JSON.stringify(plans)
    );

    return plan;
  } catch {
    return null;
  }
}


/* --------------------------------
   REJECT EMI PAYMENT
--------------------------------- */

export function rejectBOBEMIPayment(
  planId: string,
  paymentId: string
): BOBEMIPlan | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved =
    localStorage.getItem(
      "bobEMIPlans"
    );

  if (!saved) {
    return null;
  }

  try {
    const plans: BOBEMIPlan[] =
      JSON.parse(saved);

    const index =
      plans.findIndex(
        (plan) =>
          plan.id === planId
      );

    if (index === -1) {
      return null;
    }

    const plan =
      plans[index];

    const payment =
      plan.paymentHistory.find(
        (item) =>
          item.id === paymentId
      );

    if (!payment) {
      return null;
    }

    payment.status =
      "REJECTED";

    plans[index] = plan;

    localStorage.setItem(
      "bobEMIPlans",
      JSON.stringify(plans)
    );

    return plan;
  } catch {
    return null;
  }
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type WebsiteUser = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type BOBApp = {
  customerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  accountNumber?: string;
};

type BobDeposit = {
  customerId: string;
  originalAmount: number;
  depositDate: string;
  usedAmount: number;
  benefitEnabled: boolean;
};

const USER_KEY = "qurux_user";
const BOB_APP_KEY = "bobApplications";

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

function daysBetween(from: string, to = new Date().toISOString()) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
}

function getDepositBenefit(deposit: BobDeposit) {
  if (!deposit.benefitEnabled) return { milestone: 0, benefit: 0 };
  const ageDays = daysBetween(deposit.depositDate);
  if (ageDays < 30) return { milestone: 0, benefit: 0 };
  const completedMonths = Math.floor(ageDays / 30);
  const milestone = Math.min(100, 20 + Math.max(0, completedMonths - 1) * 10);
  const benefit = Math.round(Number(deposit.originalAmount || 0) * milestone / 100);
  return { milestone, benefit };
}

function calculateBobBalance(customerId: string) {
  const payments = readLocalArray("bobPayments");
  const savedDeposits = readLocalArray("bobDeposits");

  const approved = payments.filter(
    (p: any) => String(p.customerId) === String(customerId) && p.status === "APPROVED"
  );

  const allDeposits = [...savedDeposits];
  approved.forEach((payment: any) => {
    const exists = allDeposits.some((d: any) => d.sourcePaymentId === payment.id);
    if (!exists) {
      allDeposits.push({
        id: `DEP-${payment.id}`,
        customerId,
        sourcePaymentId: payment.id,
        originalAmount: Number(payment.amount) || 0,
        depositDate: payment.submittedAt || new Date().toISOString(),
        usedAmount: 0,
        benefitEnabled: true,
      });
    }
  });

  const customerDeposits = allDeposits.filter(
    (d: any) => String(d.customerId) === String(customerId)
  );

  const benefitTotal = customerDeposits.reduce(
    (total: number, d: any) => total + getDepositBenefit(d).benefit, 0
  );
  const savingTotal = customerDeposits.reduce(
    (total: number, d: any) => total + Math.max(0, Number(d.originalAmount || 0) - Number(d.usedAmount || 0)), 0
  );

  return savingTotal + benefitTotal;
}

function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

type Props = {
  /** Service or product price string like "₹500" or "₹1,299" */
  price: string;
  /** Optional: service/product name for the "After Purchase" line */
  itemName?: string;
};

export default function BobBalanceCard({ price, itemName }: Props) {
  const [bobBalance, setBobBalance] = useState(0);
  const [isBobCustomer, setIsBobCustomer] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return;
      const user: WebsiteUser = JSON.parse(raw);
      if (!user || !user.id) return;

      // Check BOB application
      const apps = readLocalArray(BOB_APP_KEY);
      const bobApp: BOBApp | undefined = apps.find(
        (a: any) => String(a.customerId) === String(user.id)
      );

      if (bobApp && bobApp.status === "APPROVED") {
        setIsBobCustomer(true);
        setIsApproved(true);
        setBobBalance(calculateBobBalance(user.id));
      } else if (bobApp && bobApp.status === "PENDING") {
        setIsBobCustomer(true);
        setIsApproved(false);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!mounted || !isBobCustomer) return null;

  const priceNum = parsePrice(price);
  const canPayFromBOB = isApproved && bobBalance >= priceNum;
  const afterBalance = Math.max(0, bobBalance - priceNum);

  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-pink-300 bg-gradient-to-r from-pink-50 to-pink-100 p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🏦</span>
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-pink-700">
          Your BOB Balance
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Regular Price</span>
          <span className="font-bold text-gray-900">{price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Your BOB Available Value</span>
          <span className="font-bold text-pink-600">
            ₹{bobBalance.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="border-t border-pink-200 pt-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-800">Amount Payable from BOB</span>
            <span className="font-bold text-gray-900">
              {canPayFromBOB ? price : `₹${bobBalance.toLocaleString("en-IN")} (partial)`}
            </span>
          </div>
        </div>
        {isApproved && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">After Purchase Balance</span>
            <span className={`font-bold ${afterBalance > 0 ? "text-green-600" : "text-red-500"}`}>
              ₹{afterBalance.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {!isApproved && (
        <p className="mt-3 text-xs text-yellow-700">
          Your BOB account is pending approval. BOB payment will be available after approval.
        </p>
      )}

      {isApproved && canPayFromBOB && (
        <div className="mt-4 rounded-xl bg-pink-600 px-4 py-2.5 text-center text-sm font-bold text-white">
          ✨ PAY FROM BOB — {price}
        </div>
      )}

      {isApproved && !canPayFromBOB && bobBalance > 0 && (
        <p className="mt-3 text-xs text-gray-600">
          BOB balance insufficient for full payment. You can pay ₹{bobBalance.toLocaleString("en-IN")} from BOB + remaining via other methods.
        </p>
      )}

      {isApproved && bobBalance === 0 && (
        <div className="mt-3 text-center">
          <Link
            href="/bob/payment"
            className="inline-block rounded-full bg-pink-600 px-5 py-2 text-xs font-bold text-white hover:bg-pink-700"
          >
            Add Money to BOB →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

type Review = {
  id: string;
  customerName: string;
  service: string;
  rating: number;
  customerRemarks: string;
  adminRemarks: string;
  bookingId: string;
  date: string;
  serviceType: "Home Service" | "Salon";
};

const defaultReviews: Review[] = [
  { id: "r1", customerName: "Sunita Devi", service: "Full Body Wax", rating: 4, customerRemarks: "Good service, a bit painful but overall fine.", adminRemarks: "Closed. Payment reconciled — BOB ₹800 + Cash ₹799.", bookingId: "BK-2026-0865", date: "2026-08-22", serviceType: "Salon" },
  { id: "r2", customerName: "Ritu Kapoor", service: "Party Makeup + Hair Styling", rating: 5, customerRemarks: "Loved the look! Very professional.", adminRemarks: "Verified with customer. All good.", bookingId: "BK-2026-0876", date: "2026-08-25", serviceType: "Salon" },
  { id: "r3", customerName: "Priya Sharma", service: "Classic Bridal Makeup", rating: 5, customerRemarks: "My bridal makeup was absolutely perfect! The team was amazing.", adminRemarks: "Premium service delivered. Customer very satisfied.", bookingId: "BK-2026-0891", date: "2026-08-28", serviceType: "Salon" },
  { id: "r4", customerName: "Neha Gupta", service: "Korean Glow Facial", rating: 4, customerRemarks: "Skin felt great after the facial. Would come again.", adminRemarks: "Good service. Facial completed at home.", bookingId: "BK-2026-0883", date: "2026-08-20", serviceType: "Home Service" },
];

export default function AdminRatingsPage() {
  const [reviews] = useState(defaultReviews);
  const [filterRating, setFilterRating] = useState(0);

  const filtered = filterRating === 0 ? reviews : reviews.filter((r) => r.rating === filterRating);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <AdminLayout title="Ratings & Reviews" subtitle="Monitor customer ratings and reviews across all services.">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: Summary */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-500">AVERAGE RATING</p>
            <p className="mt-2 text-5xl font-black text-pink-600">{avgRating}</p>
            <div className="mt-2 flex justify-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={s <= Math.round(Number(avgRating)) ? "text-yellow-400" : "text-gray-300"}>★</span>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">Based on {reviews.length} reviews</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-700 mb-3">RATING DISTRIBUTION</p>
            {distribution.map((d) => (
              <div key={d.star} className="mb-2 flex items-center gap-2">
                <span className="w-8 text-sm font-bold text-gray-600">{d.star}★</span>
                <div className="flex-1 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-xs font-bold text-gray-500">{d.count}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-gray-700 mb-3">FILTER BY RATING</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setFilterRating(0)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filterRating === 0 ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-pink-50"}`}>All</button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button key={s} type="button" onClick={() => setFilterRating(s)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filterRating === s ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-pink-50"}`}>
                  {s}★ ({reviews.filter((r) => r.rating === s).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Reviews List */}
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{review.customerName}</p>
                  <p className="text-xs text-gray-500">{review.bookingId} • {review.service} • {review.serviceType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{"⭐".repeat(review.rating)}</span>
                  <span className="text-sm font-bold text-gray-600">{review.date}</span>
                </div>
              </div>
              {review.customerRemarks && (
                <div className="mt-3 rounded-xl bg-pink-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Customer Remarks</p>
                  <p className="mt-1 text-sm text-gray-800 italic">&quot;{review.customerRemarks}&quot;</p>
                </div>
              )}
              {review.adminRemarks && (
                <div className="mt-2 rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Admin Notes</p>
                  <p className="mt-1 text-sm text-gray-600">{review.adminRemarks}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No reviews found.</div>}
        </div>
      </div>
    </AdminLayout>
  );
}

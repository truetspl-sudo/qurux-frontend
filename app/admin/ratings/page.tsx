"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";

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
  targetType?: string;
};

const defaultReviews: Review[] = [];

export default function AdminRatingsPage() {
  const [reviews, setReviews] = useState(defaultReviews);
  const [filterRating, setFilterRating] = useState(0);
  const [editing, setEditing] = useState<Review | null>(null);
  const [editStars, setEditStars] = useState(5);
  const [editCustomerRemarks, setEditCustomerRemarks] = useState("");
  const [editAdminRemarks, setEditAdminRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  async function loadRatings() {
    try {
      const res = await apiGet<any[]>("/ratings");
      if (res.ok) {
        setReviews(res.data.map((r: any) => ({
          id: r._id || r.id,
          customerName: r.customerName || "Customer",
          service: r.targetName || "",
          rating: Number(r.stars || 0),
          customerRemarks: r.customerRemarks || "",
          adminRemarks: r.adminRemarks || "",
          bookingId: r.bookingRef || (r.bookingId && typeof r.bookingId === "string" ? r.bookingId : ""),
          date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
          serviceType: r.targetType === "PRODUCT" ? "Home Service" : "Salon",
          targetType: r.targetType || "",
        })));
      }
    } catch {}
  }

  useEffect(() => {
    loadRatings();
  }, []);

  function openEdit(r: Review) {
    setEditing(r);
    setEditStars(r.rating);
    setEditCustomerRemarks(r.customerRemarks);
    setEditAdminRemarks(r.adminRemarks);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const res = await apiPatch<any>(`/ratings/${editing.id}`, {
      stars: editStars,
      customerRemarks: editCustomerRemarks,
      adminRemarks: editAdminRemarks,
    });
    setBusy(false);
    if (res.ok) {
      setFlash("✅ Review updated");
      setEditing(null);
      loadRatings();
    } else {
      setFlash("❌ " + (res.message || "Update fail hua"));
    }
    setTimeout(() => setFlash(""), 3000);
  }

  async function deleteReview(r: Review) {
    if (!confirm(`Review delete karein? (${r.customerName} — ${r.service})`)) return;
    setBusy(true);
    const res = await apiDelete<any>(`/ratings/${r.id}`);
    setBusy(false);
    if (res.ok) {
      setFlash("🗑️ Review deleted");
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      if (editing && editing.id === r.id) setEditing(null);
    } else {
      setFlash("❌ " + (res.message || "Delete fail hua"));
    }
    setTimeout(() => setFlash(""), 3000);
  }

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
          {flash && (
            <div className="rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-bold text-white">{flash}</div>
          )}
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
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(review)}
                  disabled={busy}
                  className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteReview(review)}
                  disabled={busy}
                  className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">No reviews found.</div>}
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-pink-600">EDIT REVIEW</p>
                  <h3 className="mt-1 text-lg font-black text-gray-900">{editing.customerName} — {editing.service}</h3>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-bold hover:bg-gray-200">×</button>
              </div>

              <p className="mt-4 text-xs font-bold text-gray-600">STARS</p>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStars(s)}
                    className={`text-3xl transition ${s <= editStars ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs font-bold text-gray-600">CUSTOMER REMARKS</p>
              <textarea
                rows={2}
                value={editCustomerRemarks}
                onChange={(e) => setEditCustomerRemarks(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-500"
              />

              <p className="mt-4 text-xs font-bold text-gray-600">ADMIN REMARKS</p>
              <textarea
                rows={2}
                value={editAdminRemarks}
                onChange={(e) => setEditAdminRemarks(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-500"
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={busy}
                  className="flex-1 rounded-full bg-pink-600 px-5 py-3 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
                >
                  {busy ? "Saving..." : "SAVE CHANGES"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-full bg-gray-100 px-5 py-3 font-bold text-gray-600 hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

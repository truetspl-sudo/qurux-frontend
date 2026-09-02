"use client";

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Review = {
  id: string;
  customerName: string;
  service: string;
  rating: number;
  comment: string;
  date: string;
};

const sampleReviews: Review[] = [
  {
    id: "1",
    customerName: "Priya S.",
    service: "Classic Bridal Makeup",
    rating: 5,
    comment:
      "Absolutely loved my bridal makeup! The team was professional and the result was flawless.",
    date: "2026-08-15",
  },
  {
    id: "2",
    customerName: "Anjali M.",
    service: "Korean Glow Facial",
    rating: 5,
    comment:
      "My skin felt so fresh and glowing after the facial. Highly recommended!",
    date: "2026-08-10",
  },
  {
    id: "3",
    customerName: "Ritu K.",
    service: "Hair Styling",
    rating: 4,
    comment:
      "Great hair styling for my sister's engagement. Professional and quick.",
    date: "2026-08-05",
  },
];

type StarRatingProps = {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const sizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }[size];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${sizeClass} transition ${
            readonly ? "cursor-default" : "cursor-pointer"
          } ${
            star <= (hover || value) ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

type RatingReviewSectionProps = {
  serviceSlug?: string;
  showSubmitForm?: boolean;
};

export default function RatingReviewSection({
  serviceSlug,
  showSubmitForm = false,
}: RatingReviewSectionProps) {
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState(sampleReviews);

  useEffect(() => {
    async function loadRatings() {
      try {
        const res = await apiGet<any[]>("/ratings" + (serviceSlug ? `?targetType=SERVICE&targetId=${serviceSlug}` : ""));
        if (res.ok && res.data.length > 0) {
          const mapped: Review[] = res.data.map((r: any) => ({
            id: r._id,
            customerName: r.customerName || "Customer",
            service: r.targetName || "",
            rating: r.stars || 0,
            comment: r.customerRemarks || "",
            date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
          }));
          setReviews(mapped);
        }
      } catch {}
    }
    loadRatings();
  }, [serviceSlug]);

  const filteredReviews = serviceSlug
    ? reviews.filter((r) => r.service?.toLowerCase().includes(serviceSlug.replace(/-/g, " ")))
    : reviews;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (myRating === 0) return;
    try {
      await apiPost("/ratings", {
        targetType: "SERVICE",
        targetId: serviceSlug || "general",
        targetName: serviceSlug || "General",
        stars: myRating,
        customerRemarks: myComment,
      });
    } catch {}
    const newReview: Review = {
      id: String(Date.now()),
      customerName: "You",
      service: serviceSlug || "General",
      rating: myRating,
      comment: myComment,
      date: new Date().toISOString().split("T")[0],
    };
    setReviews([newReview, ...reviews]);
    setSubmitted(true);
  }

  return (
    <div>
      {/* Average Rating */}
      <div className="flex items-center gap-4">
        <span className="text-5xl font-black text-pink-600">
          {filteredReviews.length > 0
            ? (
                filteredReviews.reduce((sum, r) => sum + r.rating, 0) /
                filteredReviews.length
              ).toFixed(1)
            : "—"}
        </span>
        <div>
          <StarRating
            value={
              filteredReviews.length > 0
                ? Math.round(
                    filteredReviews.reduce((sum, r) => sum + r.rating, 0) /
                      filteredReviews.length
                  )
                : 0
            }
            readonly
            size="lg"
          />
          <p className="mt-1 text-sm text-gray-500">
            Based on {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Submit Review */}
      {showSubmitForm && !submitted && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl bg-pink-50 p-6"
        >
          <p className="font-bold text-gray-900">Leave a Review</p>
          <div className="mt-3">
            <StarRating value={myRating} onChange={setMyRating} size="lg" />
          </div>
          <textarea
            rows={3}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Share your experience..."
            className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
          />
          <button
            type="submit"
            disabled={myRating === 0}
            className="mt-3 rounded-full bg-pink-600 px-6 py-2.5 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            SUBMIT REVIEW
          </button>
        </form>
      )}

      {submitted && (
        <div className="mt-6 rounded-2xl bg-green-50 p-5 text-center">
          <p className="font-bold text-green-700">
            ✓ Thank you! Your review has been submitted.
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-8 space-y-5">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900">
                  {review.customerName}
                </p>
                <p className="text-xs text-gray-500">
                  {review.service} •{" "}
                  {new Date(review.date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <StarRating value={review.rating} readonly size="sm" />
            </div>
            <p className="mt-3 leading-7 text-gray-600">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

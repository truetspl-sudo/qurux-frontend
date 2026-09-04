"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPatch } from "@/lib/api";

type Salon = {
  id: string;
  salonName: string;
  ownerName: string;
  email: string;
  phone: string;
  altPhone: string;
  address: string;
  city: string;
  pincode: string;
  salonType: string;
  servicesOffered: string;
  experience: string;
  teamSize: string;
  gstNumber: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

const defaultSalons: Salon[] = [];

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState(defaultSalons);
  const [rawSalons, setRawSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSalons() {
    setLoading(true);
    try {
      const res = await apiGet<any[]>("/salons/all");
      if (res.ok) {
        setRawSalons(res.data);
        setSalons(res.data.map((s: any) => ({
          id: s._id, salonName: s.name, ownerName: s.ownerName, email: s.ownerEmail,
          phone: s.ownerMobile, altPhone: s.alternatePhone || "", address: s.address,
          city: s.city, pincode: s.pincode, salonType: s.type || "Unisex",
          servicesOffered: (s.servicesOffered || []).join(", "), experience: `${s.yearsOfExperience || 0} years`,
          teamSize: `${s.teamSize || 1} staff`, gstNumber: s.gstNumber || "",
          description: s.about || "", status: s.status || "PENDING",
          submittedAt: s.createdAt?.split("T")[0] || "",
        })));
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchSalons();
  }, []);
  const [selected, setSelected] = useState<Salon | null>(null);
  const [manageSalon, setManageSalon] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = salons.filter((s) => {
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchSearch =
      s.salonName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const [approvedSalon, setApprovedSalon] = useState<Salon | null>(null);

  async function approveSalon(id: string) {
    setBusy(true);
    await apiPatch(`/salons/${id}/approve`, {});
    const salon = salons.find(s => s.id === id);
    setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" as const } : s)));
    if (salon) setApprovedSalon({ ...salon, status: "APPROVED" });
    setSelected(null);
    setBusy(false);
  }

  async function rejectSalon(id: string) {
    if (!confirm("Reject this salon?")) return;
    setBusy(true);
    await apiPatch(`/salons/${id}/reject`, { reason: "Not approved" });
    setSalons((prev) => prev.map((s) => (s.id === id ? { ...s, status: "REJECTED" as const } : s)));
    setSelected(null);
    setBusy(false);
  }

  const pendingCount = salons.filter((s) => s.status === "PENDING").length;
  const approvedCount = salons.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = salons.filter((s) => s.status === "REJECTED").length;

  const approvedMsg = approvedSalon
    ? `🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon \"${approvedSalon.salonName}\" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`
    : "";

  return (
    <AdminLayout
      title="Salons / Vendors"
      subtitle="Manage salon registrations — review, approve, or reject partner applications."
    >

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-orange-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-orange-700">PENDING</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">APPROVED</p>
          <p className="mt-2 text-3xl font-black text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">REJECTED</p>
          <p className="mt-2 text-3xl font-black text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by salon name, owner, or city..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500"
        >
          <option value="All">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Salon List */}
      <div className="mt-5 space-y-4">
        {filtered.map((salon) => (
          <div
            key={salon.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelected(salon)}
            onKeyDown={(e) => e.key === "Enter" && setSelected(salon)}
            className="w-full cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-pink-300 hover:bg-pink-50"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-gray-900">{salon.salonName}</p>
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                    {salon.salonType || "Salon"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {salon.ownerName} • {salon.phone} • {salon.city}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Registered: {new Date(salon.submittedAt).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                    salon.status === "PENDING"
                      ? "bg-orange-100 text-orange-700"
                      : salon.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  {salon.status}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const raw = rawSalons.find((r) => r._id === salon.id);
                    if (raw) setManageSalon(raw);
                  }}
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  ✏️ Manage Salon Page
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No salon registrations found.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">
                  SALON REGISTRATION
                </p>
                <h3 className="mt-2 text-3xl font-black text-gray-900">
                  {selected.salonName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Info Grid */}
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                { label: "OWNER", value: selected.ownerName },
                { label: "EMAIL", value: selected.email },
                { label: "PHONE", value: selected.phone },
                { label: "ALT PHONE", value: selected.altPhone || "—" },
                { label: "SALON TYPE", value: selected.salonType || "—" },
                { label: "EXPERIENCE", value: selected.experience || "—" },
                { label: "TEAM SIZE", value: selected.teamSize || "—" },
                { label: "GST", value: selected.gstNumber || "Not provided" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs font-bold text-gray-400">{item.label}</p>
                  <p className="mt-1 font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Address */}
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">ADDRESS</p>
              <p className="mt-1 leading-6 text-gray-800">
                {selected.address}, {selected.city} — {selected.pincode}
              </p>
            </div>

            {/* Services */}
            {selected.servicesOffered && (
              <div className="mt-4 rounded-2xl bg-pink-50 p-4">
                <p className="text-xs font-bold text-pink-600">SERVICES OFFERED</p>
                <p className="mt-1 text-sm leading-6 text-gray-800">
                  {selected.servicesOffered}
                </p>
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-400">ABOUT</p>
                <p className="mt-1 leading-6 text-gray-800">
                  {selected.description}
                </p>
              </div>
            )}

            {/* Status + Actions */}
            <div className="mt-6">
              {selected.status === "PENDING" ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => approveSalon(selected.id)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-green-600 px-6 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
                  >
                    {busy ? "PROCESSING..." : "✓ APPROVE SALON"}
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectSalon(selected.id)}
                    disabled={busy}
                    className="flex-1 rounded-full bg-red-500 px-6 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                  >
                    ✗ REJECT REGISTRATION
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-2xl p-5 text-center font-bold ${
                    selected.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  Status: {selected.status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approved Salon WhatsApp Message */}
      {approvedSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-green-700">✅ Salon Approved</h3>
              <button type="button" onClick={() => setApprovedSalon(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200">×</button>
            </div>
            <p className="mt-3 text-sm text-gray-600">Copy this message and send to the salon owner via WhatsApp:</p>
            <div className="mt-3 rounded-2xl bg-green-50 p-4">
              <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{`🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon "${approvedSalon.salonName}" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`}</pre>
            </div>
            <button
              type="button"
              onClick={() => {
                const msg = `🎋 QURUX Makeover & Academy\n\nNamaste ${approvedSalon.ownerName}!\n\nCongratulations! Your salon "${approvedSalon.salonName}" has been approved as a QURUX Partner Salon.\n\n✅ Your salon is now live in the QURUX booking system.\n\n📍 Location: ${approvedSalon.address}, ${approvedSalon.city}\n📞 Contact: ${approvedSalon.phone}\n\nYou will start receiving bookings from customers through the QURUX platform.\n\nFor any queries, contact the QURUX admin team.\n\nBest Regards,\nQURUX Makeover & Academy`;
                navigator.clipboard.writeText(msg);
                setApprovedSalon(null);
              }}
              className="mt-4 w-full rounded-full bg-green-600 py-3 font-bold text-white hover:bg-green-700"
            >
              📋 COPY MESSAGE & CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Manage Salon Page Modal */}
      {manageSalon && (
        <ManageSalonModal
          salon={manageSalon}
          onClose={() => setManageSalon(null)}
          onSaved={async () => {
            setManageSalon(null);
            await fetchSalons();
          }}
        />
      )}
    </AdminLayout>
  );
}

/* =============================================
   MANAGE SALON PAGE — public /salons page ke liye
   images, work images, Google map, services assign
============================================= */
function ManageSalonModal({
  salon,
  onClose,
  onSaved,
}: {
  salon: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [about, setAbout] = useState(salon.about || "");
  const [image, setImage] = useState(salon.image || "");
  const [imagesText, setImagesText] = useState((salon.images || []).join("\n"));
  const [workText, setWorkText] = useState((salon.workImages || []).join("\n"));
  const [mapUrl, setMapUrl] = useState(salon.googleMapUrl || "");
  const [selectedServices, setSelectedServices] = useState<string[]>(
    (salon.servicesIds || []).map(String)
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const res = await apiGet<any[]>("/services/all");
      if (res.ok) setCatalog(res.data || []);
    })();
  }, []);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function save() {
    setSaving(true);
    setErr("");
    const body: Record<string, unknown> = {
      about,
      image: image.trim(),
      images: imagesText.split(/\n+/).map((s: string) => s.trim()).filter(Boolean),
      workImages: workText.split(/\n+/).map((s: string) => s.trim()).filter(Boolean),
      googleMapUrl: mapUrl.trim(),
      servicesIds: selectedServices,
    };
    const res = await apiPatch<any>(`/salons/${salon._id}`, body);
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      setErr(res.message || "Save fail hua.");
    }
  }

  const link = salon.slug
    ? `/salons/${salon.slug}`
    : `/salons/${salon._id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              ✏️ MANAGE SALON PAGE
            </p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">{salon.name}</h3>
            {salon.status === "APPROVED" && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-bold text-pink-600 hover:underline"
              >
                View public page → /salons
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
          Ye fields public salon page (/salons) pe dikhte hain — salon ki images,
          work photos, Google Map location aur us salon me available services.
          Image URL (link) daalein — ek line me ek URL.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">ABOUT SALON</label>
            <textarea
              rows={2}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Salon ke baare me likhein..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">MAIN IMAGE (cover photo URL)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">SALON GALLERY IMAGES (ek line me ek URL)</label>
            <textarea
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://salon-img-1.jpg\nhttps://salon-img-2.jpg"}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">WORK IMAGES / KAAM KI PHOTOS (ek line me ek URL)</label>
            <textarea
              rows={3}
              value={workText}
              onChange={(e) => setWorkText(e.target.value)}
              placeholder={"https://work-img-1.jpg\nhttps://work-img-2.jpg"}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">GOOGLE MAP (share link ya embed URL)</label>
            <input
              type="text"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/... ya ...maps/embed?..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Khaali chhodein to address se automatic map ban jayega.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">
              SERVICES (is salon me available services — Book Now flow)
            </label>
            {catalog.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">Services catalog load ho raha hai...</p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-3">
                {catalog.map((s: any) => (
                  <label key={s._id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-blue-50">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(String(s._id))}
                      onChange={() => toggleService(String(s._id))}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{s.category}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-gray-400">
              {selectedServices.length === 0
                ? "Koi service select nahi ki to public page pe poora catalog dikhega."
                : `${selectedServices.length} service(s) select ki gayi hain.`}
            </p>
          </div>

          {err && <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">❌ {err}</div>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-full bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "SAVING..." : "💾 SAVE SALON PAGE"}
          </button>
        </div>
      </div>
    </div>
  );
}

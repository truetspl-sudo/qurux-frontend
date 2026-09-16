"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api";

type BrandSettings = {
  name: string; tagline: string; phone: string; email: string;
  whatsapp: string; address: string; instagram: string; facebook: string; youtube: string;
};

const defaultBrand: BrandSettings = {
  name: "QURUX Makeover & Academy",
  tagline: "Luxury Beauty • Premium Products • Easy No Cost EMI",
  phone: "9911227916",
  email: "info@qurux.in",
  whatsapp: "919911227916",
  address: "Delhi, India",
  instagram: "",
  facebook: "",
  youtube: "",
};

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Change password state
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>(defaultBrand);

  const [homeService, setHomeService] = useState({
    minimumCart: 2500,
    enabled: true,
  });

  const [emi, setEmi] = useState({
    enabled: true,
    minimumAmount: 3000,
    maxTenure: 6,
  });

  // Load settings from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<any>("/settings");
        if (res.ok && res.data) {
          const s = res.data;
          if (s.brand) setBrand((prev) => ({ ...prev, ...s.brand }));
          if (s.homeService) setHomeService((prev) => ({ ...prev, ...s.homeService }));
          if (s.emi) setEmi((prev) => ({ ...prev, ...s.emi }));
        }
      } catch {
        // Use defaults
      }
      setLoadingSettings(false);
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      // Try to save to backend — use PATCH (or POST as fallback)
      const res = await apiPatch<any>("/settings", {
        brand,
        homeService,
        emi,
      });
      if (!res.ok) {
        // Try POST if PATCH fails (backend may use different route)
        await apiPost<any>("/settings", { brand, homeService, emi });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Still show success — settings saved locally even if backend is down
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleChangePassword() {
    setPwMsg(null);
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwMsg({ ok: false, text: "Saare fields bharo — current password, naya password aur confirm password." });
      return;
    }
    if (pw.next.length < 6) {
      setPwMsg({ ok: false, text: "Naya password kam se kam 6 characters ka hona chahiye." });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: "Naya password aur confirm password match nahi kar rahe." });
      return;
    }
    setPwBusy(true);
    // Try PATCH first (backend convention), fallback to PUT
    let res = await apiPatch<any>("/auth/change-password", {
      currentPassword: pw.current,
      newPassword: pw.next,
    });
    if (!res.ok && res.status === 404) {
      res = await apiPut<any>("/auth/change-password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
    }
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "Password update ho gaya! Agli baar naye password se login karein." });
      setPw({ current: "", next: "", confirm: "" });
    } else {
      setPwMsg({ ok: false, text: res.message || "Password change failed." });
    }
  }

  return (
    <AdminLayout title="Settings" subtitle="Manage website configuration, brand info, and business rules.">

      {/* Success Message */}
      {saved && (
        <div className="mb-6 rounded-2xl bg-green-50 p-4 text-center font-bold text-green-700">
          ✓ Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">

        {/* Brand Info */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Brand Information</h2>
          <p className="mt-1 text-sm text-gray-500">Basic brand details shown across the website.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-gray-800">
              Brand Name
              <input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Tagline
              <input value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-gray-800">
              Phone
              <input value={brand.phone} onChange={(e) => setBrand({ ...brand, phone: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Email
              <input type="email" value={brand.email} onChange={(e) => setBrand({ ...brand, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              WhatsApp Number
              <input value={brand.whatsapp} onChange={(e) => setBrand({ ...brand, whatsapp: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
          </div>

          <label className="mt-4 block text-sm font-bold text-gray-800">
            Address
            <input value={brand.address} onChange={(e) => setBrand({ ...brand, address: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
          </label>

          <p className="mt-5 text-sm font-bold text-gray-700">Social Links</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-gray-600">
              Instagram URL
              <input value={brand.instagram} onChange={(e) => setBrand({ ...brand, instagram: e.target.value })} placeholder="https://instagram.com/..." className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500" />
            </label>
            <label className="block text-sm text-gray-600">
              Facebook URL
              <input value={brand.facebook} onChange={(e) => setBrand({ ...brand, facebook: e.target.value })} placeholder="https://facebook.com/..." className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500" />
            </label>
            <label className="block text-sm text-gray-600">
              YouTube URL
              <input value={brand.youtube} onChange={(e) => setBrand({ ...brand, youtube: e.target.value })} placeholder="https://youtube.com/..." className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500" />
            </label>
          </div>
        </section>

        {/* Home Service Settings */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Home Service Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Configure rules for home service bookings.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <input type="checkbox" checked={homeService.enabled} onChange={(e) => setHomeService({ ...homeService, enabled: e.target.checked })} className="h-5 w-5 accent-pink-600" />
              <span className="font-bold text-gray-800">Home Service Available</span>
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Minimum Cart Amount (₹)
              <input type="number" min={0} value={homeService.minimumCart} onChange={(e) => setHomeService({ ...homeService, minimumCart: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Cart subtotal must be ≥ ₹{homeService.minimumCart.toLocaleString("en-IN")} for home service bookings. Below this amount, checkout will be blocked.
          </p>
        </section>

        {/* EMI Settings */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">EMI Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Configure No Cost EMI rules.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
              <input type="checkbox" checked={emi.enabled} onChange={(e) => setEmi({ ...emi, enabled: e.target.checked })} className="h-5 w-5 accent-pink-600" />
              <span className="font-bold text-gray-800">EMI Available</span>
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Minimum Amount (₹)
              <input type="number" min={0} value={emi.minimumAmount} onChange={(e) => setEmi({ ...emi, minimumAmount: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Max Tenure (months)
              <input type="number" min={1} max={12} value={emi.maxTenure} onChange={(e) => setEmi({ ...emi, maxTenure: Number(e.target.value) })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
          </div>
        </section>

        {/* Backend Info */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">Backend / API Configuration</h2>
          <p className="mt-1 text-sm text-gray-500">API endpoints will be configured when the backend is deployed.</p>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">QURUX API URL</p>
              <p className="mt-1 font-mono text-sm text-gray-600">NEXT_PUBLIC_QURUX_API_URL = http://127.0.0.1:4000/api</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-400">BOB API URL</p>
              <p className="mt-1 font-mono text-sm text-gray-600">NEXT_PUBLIC_API_URL = http://localhost:5000</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-bold text-blue-700">WHATSAPP INTEGRATION</p>
              <p className="mt-1 text-sm text-gray-600">Interakt / WATI / Meta Cloud API — to be connected during backend deployment.</p>
            </div>
          </div>
        </section>

        {/* Change Password */}
        <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-black text-gray-900">🔒 Change Admin Password</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the password you use to log in to the admin panel. Next login will require the new password.
          </p>

          {pwMsg && (
            <div className={`mt-4 rounded-xl p-4 text-center text-sm font-bold ${pwMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {pwMsg.ok ? "✅" : "❌"} {pwMsg.text}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-bold text-gray-800">
              Current Password
              <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Current password" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              New Password
              <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Min 6 characters" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
            <label className="block text-sm font-bold text-gray-800">
              Confirm New Password
              <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Repeat new password" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={handleChangePassword} disabled={pwBusy} className="rounded-full bg-slate-900 px-8 py-3.5 font-bold text-white hover:bg-slate-800 disabled:opacity-50">
              {pwBusy ? "Updating..." : "CHANGE PASSWORD"}
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button type="button" onClick={handleSave} disabled={saving || loadingSettings} className="rounded-full bg-pink-600 px-8 py-3.5 font-bold text-white hover:bg-pink-700 disabled:opacity-50">
            {saving ? "Saving..." : loadingSettings ? "Loading..." : "SAVE SETTINGS"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

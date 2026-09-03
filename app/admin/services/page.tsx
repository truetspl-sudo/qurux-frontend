"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  duration: string;
  slug: string;
  image: string;
  description: string;
  active: boolean;
  includes: string[];
};

const defaultServices: ServiceItem[] = [];

const serviceCategories = [
  "Bridal Makeup",
  "Pre Bridal Makeup",
  "Party Makeup",
  "Engagement Makeup",
  "Facial",
  "Skin Care",
  "Manicure",
  "Pedicure",
  "Hair Styling",
  "Other Salon Services",
];

type EmptyService = Omit<ServiceItem, "id">;

const emptyService: EmptyService = {
  name: "",
  category: "Bridal Makeup",
  price: "",
  duration: "",
  slug: "",
  image: "/service-images/",
  description: "",
  active: true,
  includes: [],
};

export default function AdminServicesPage() {
  const [services, setServices] = useState(defaultServices);
  const [loading, setLoading] = useState(false);

  // Fetch from API on mount
  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const res = await apiGet<any[]>("/services/all");
        if (res.ok) {
          const apiServices: ServiceItem[] = res.data.map((s: any) => ({
            id: s._id,
            name: s.name,
            category: s.category,
            price: `\u20B9${(s.price || 0).toLocaleString("en-IN")}`,
            duration: s.duration || "60 min",
            slug: s.slug,
            image: s.image || "/cards/buy.jpg",
            description: s.description || "",
            active: s.isActive !== false,
            includes: s.includes || [],
          }));
          setServices(apiServices);
        }
      } catch {
        // Keep default data
      }
      setLoading(false);
    }
    fetchServices();
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyService>({ ...emptyService });
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = services.filter((s) => {
    const matchCat = filterCategory === "All" || s.category === filterCategory;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyService });
    setShowModal(true);
  }

  function openEdit(service: ServiceItem) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category: service.category,
      price: service.price,
      duration: service.duration,
      slug: service.slug,
      image: service.image,
      description: service.description,
      active: service.active,
      includes: [...service.includes],
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price.trim()) return;

    const priceNum = parseInt(form.price.replace(/[^0-9]/g, "")) || 0;
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-");
    const payload = {
      name: form.name,
      category: form.category,
      slug,
      price: priceNum,
      duration: form.duration,
      image: form.image,
      description: form.description,
      isActive: form.active,
      includes: form.includes,
    };

    if (editingId) {
      const res = await apiPut(`/services/${editingId}`, payload);
      if (res.ok) {
        setServices((prev) => prev.map((s) => s.id === editingId ? { ...s, ...form } : s));
      }
    } else {
      const res = await apiPost<any>("/services", payload);
      if (res.ok && res.data?.service) {
        const s = res.data.service;
        setServices((prev) => [...prev, {
          id: s._id, name: s.name, category: s.category,
          price: `\u20B9${s.price.toLocaleString("en-IN")}`,
          duration: s.duration, slug: s.slug, image: s.image || "",
          description: s.description, active: s.isActive, includes: s.includes || [],
        }]);
      }
    }
    setShowModal(false);
  }

  async function toggleActive(id: string) {
    const res = await apiPatch(`/services/${id}/toggle`, {});
    if (res.ok) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const res = await apiDelete(`/services/${id}`);
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <AdminLayout
      title="Services"
      subtitle="Manage all beauty services — add, edit, activate/deactivate, change prices."
    >

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-pink-700"
        >
          + Add Service
        </button>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500"
        >
          <option value="All">All Categories</option>
          {serviceCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL SERVICES</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{services.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">ACTIVE</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {services.filter((s) => s.active).length}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">INACTIVE</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {services.filter((s) => !s.active).length}
          </p>
        </div>
      </div>

      {/* Services Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Service</th>
                <th className="px-5 py-3 font-bold text-gray-600">Category</th>
                <th className="px-5 py-3 font-bold text-gray-600">Price</th>
                <th className="px-5 py-3 font-bold text-gray-600">Duration</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{service.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{service.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-pink-600">
                    {service.price}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {service.duration}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleActive(service.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        service.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      {service.active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteService(service.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No services found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">
                {editingId ? "Edit Service" : "Add New Service"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-gray-800">
                  Service Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Classic Bridal Makeup"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-pink-500"
                  >
                    {serviceCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-gray-800">
                  Price *
                  <input
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. ₹15,999+"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Duration
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 3–4 Hours"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-gray-800">
                Slug (URL)
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated from name if empty"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Image Path
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/service-images/your-image.jpg"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of the service..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                What&apos;s Included (comma separated)
                <input
                  value={form.includes.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      includes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Base makeup, Eye makeup, Lip makeup..."
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 accent-pink-600"
                  />
                  Active (visible on website)
                </label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-full bg-pink-600 px-6 py-3.5 font-bold text-white hover:bg-pink-700"
              >
                {editingId ? "SAVE CHANGES" : "ADD SERVICE"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-gray-300 px-6 py-3.5 font-bold text-gray-700 hover:bg-gray-50"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

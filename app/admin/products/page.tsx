"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";

type ProductItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  stock: number;
  active: boolean;
};

const defaultProducts: ProductItem[] = [
  {
    id: "p1",
    name: "ESSN HD Foundation",
    category: "Makeup",
    price: "₹1,299",
    image: "/cards/buy.jpg",
    description: "High-definition foundation for a smooth, camera-ready finish.",
    stock: 25,
    active: true,
  },
  {
    id: "p2",
    name: "ESSN Matte Lipstick Set",
    category: "Makeup",
    price: "₹899",
    image: "/cards/buy.jpg",
    description: "Set of 6 long-lasting matte lipsticks in trending shades.",
    stock: 40,
    active: true,
  },
  {
    id: "p3",
    name: "ESSN Glow Serum",
    category: "Skincare",
    price: "₹1,499",
    image: "/cards/buy.jpg",
    description: "Vitamin C glow serum for radiant and even-toned skin.",
    stock: 30,
    active: true,
  },
  {
    id: "p4",
    name: "ESSN Hydrating Moisturiser",
    category: "Skincare",
    price: "₹799",
    image: "/cards/buy.jpg",
    description: "Lightweight hydrating moisturiser for all skin types.",
    stock: 50,
    active: true,
  },
  {
    id: "p5",
    name: "ESSN Professional Brush Kit",
    category: "Tools & Brushes",
    price: "₹2,499",
    image: "/cards/buy.jpg",
    description: "12-piece professional makeup brush set with travel pouch.",
    stock: 20,
    active: false,
  },
];

const productCategories = [
  "Makeup",
  "Skincare",
  "Hair Care",
  "Tools & Brushes",
  "Fragrance",
];

type EmptyProduct = Omit<ProductItem, "id">;

const emptyProduct: EmptyProduct = {
  name: "",
  category: "Makeup",
  price: "",
  image: "/cards/",
  description: "",
  stock: 0,
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState(defaultProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await apiGet<any[]>("/products/all");
        if (res.ok && res.data.length > 0) {
          setProducts(res.data.map((p: any) => ({
            id: p._id, name: p.name, category: p.category,
            price: `\u20B9${(p.price || 0).toLocaleString("en-IN")}`,
            image: p.image || "/cards/buy.jpg", description: p.description || "",
            stock: p.stock || 0, active: p.isActive !== false,
          })));
        }
      } catch {}
      setLoading(false);
    }
    fetchProducts();
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyProduct>({ ...emptyProduct });
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyProduct });
    setShowModal(true);
  }

  function openEdit(product: ProductItem) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock,
      active: product.active,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price.trim()) return;
    const priceNum = parseInt(form.price.replace(/[^0-9]/g, "")) || 0;
    const slug = form.name.toLowerCase().replace(/\s+/g, "-");
    const payload = { name: form.name, category: form.category, slug, price: priceNum, image: form.image, description: form.description, stock: form.stock, isActive: form.active, brand: "ESSN" };

    if (editingId) {
      const res = await apiPut(`/products/${editingId}`, payload);
      if (res.ok) setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      const res = await apiPost<any>("/products", payload);
      if (res.ok && res.data?.product) {
        const p = res.data.product;
        setProducts((prev) => [...prev, { id: p._id, name: p.name, category: p.category, price: `\u20B9${p.price.toLocaleString("en-IN")}`, image: p.image || "", description: p.description, stock: p.stock, active: p.isActive }]);
      }
    }
    setShowModal(false);
  }

  async function toggleActive(id: string) {
    await apiPatch(`/products/${id}/toggle`, {});
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await apiDelete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function updateStock(id: string, stock: number) {
    const change = stock > 0 ? 1 : -1;
    await apiPatch(`/products/${id}/stock`, { change });
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, stock) } : p)));
  }

  return (
    <AdminLayout
      title="Products"
      subtitle="Manage ESSN Cosmetics products — add, edit, stock, activate/deactivate."
    >

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-pink-700"
        >
          + Add Product
        </button>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500"
        >
          <option value="All">All Categories</option>
          {productCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL PRODUCTS</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{products.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">ACTIVE</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {products.filter((p) => p.active).length}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-amber-700">LOW STOCK (≤5)</p>
          <p className="mt-2 text-3xl font-black text-amber-700">
            {products.filter((p) => p.stock <= 5).length}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-red-600">OUT OF STOCK</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {products.filter((p) => p.stock === 0).length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-600">Product</th>
                <th className="px-5 py-3 font-bold text-gray-600">Category</th>
                <th className="px-5 py-3 font-bold text-gray-600">Price</th>
                <th className="px-5 py-3 font-bold text-gray-600">Stock</th>
                <th className="px-5 py-3 font-bold text-gray-600">Status</th>
                <th className="px-5 py-3 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900">{product.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                      {product.description}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-pink-600">
                    {product.price}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateStock(product.id, product.stock - 1)}
                        className="h-7 w-7 rounded-lg bg-gray-100 text-sm font-bold hover:bg-gray-200"
                      >
                        −
                      </button>
                      <span className={`min-w-[2rem] text-center text-sm font-bold ${product.stock <= 5 ? "text-red-600" : "text-gray-900"}`}>
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateStock(product.id, product.stock + 1)}
                        className="h-7 w-7 rounded-lg bg-gray-100 text-sm font-bold hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleActive(product.id)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        product.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      {product.active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
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
            No products found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">
                {editingId ? "Edit Product" : "Add New Product"}
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

              <label className="block text-sm font-bold text-gray-800">
                Product Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. ESSN HD Foundation"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-gray-800">
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-pink-500"
                  >
                    {productCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Price *
                  <input
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. ₹1,299"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-bold text-gray-800">
                  Image Path
                  <input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="/cards/your-product.jpg"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Stock Quantity
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold text-gray-800">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
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
                  Active (visible on shop)
                </label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-full bg-pink-600 px-6 py-3.5 font-bold text-white hover:bg-pink-700"
              >
                {editingId ? "SAVE CHANGES" : "ADD PRODUCT"}
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

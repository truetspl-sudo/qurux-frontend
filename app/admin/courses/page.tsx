"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";

type CourseItem = {
  id: string;
  title: string;
  duration: string;
  hours: string;
  fee: string;
  level: string;
  description: string;
  image: string;
  active: boolean;
  topics: string[];
};

const defaultCourses: CourseItem[] = [
  {
    id: "c1",
    title: "Basic Makeup Artist Course",
    duration: "15 Days",
    hours: "45 Hours",
    fee: "₹26,999",
    level: "Beginner",
    image: "/course-images/basic-makeup-artist.jpg",
    description: "Build a strong foundation in professional makeup techniques.",
    active: true,
    topics: ["Makeup fundamentals", "Skin preparation", "Face shapes", "Colour theory"],
  },
  {
    id: "c2",
    title: "Professional Makeup Artist Course",
    duration: "30 Days",
    hours: "90 Hours",
    fee: "₹49,999",
    level: "Professional",
    image: "/course-images/professional-makeup-artist.jpg",
    description: "Complete professional makeup course with hands-on practice.",
    active: true,
    topics: ["Professional techniques", "Party makeup", "Engagement makeup", "Hands-on practice"],
  },
  {
    id: "c3",
    title: "Advanced Bridal & HD Makeup Course",
    duration: "45 Days",
    hours: "135 Hours",
    fee: "₹74,999",
    level: "Advanced",
    image: "/course-images/advanced-bridal-hd-makeup.jpg",
    description: "Advanced bridal training covering HD techniques and long-wear preparation.",
    active: true,
    topics: ["Bridal makeup", "HD makeup", "Colour correction", "Live model practice"],
  },
  {
    id: "c4",
    title: "Complete Beauty Artist Course",
    duration: "3 Months",
    hours: "270 Hours",
    fee: "₹89,999",
    level: "Professional",
    image: "",
    description: "Comprehensive beauty training combining makeup, hair and beauty services.",
    active: false,
    topics: ["Professional makeup", "Bridal makeup", "Hair styling", "Skin care"],
  },
];

type EmptyCourse = Omit<CourseItem, "id">;

const emptyCourse: EmptyCourse = {
  title: "",
  duration: "",
  hours: "",
  fee: "",
  level: "Beginner",
  description: "",
  image: "/course-images/",
  active: true,
  topics: [],
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState(defaultCourses);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const res = await apiGet<any[]>("/courses/all");
        if (res.ok && res.data.length > 0) {
          setCourses(res.data.map((c: any) => ({
            id: c._id, title: c.title, duration: c.duration || "", hours: c.hours || "",
            fee: `\u20B9${(c.fee || 0).toLocaleString("en-IN")}`,
            level: c.level || "Beginner", image: c.image || "", description: c.description || "",
            active: c.isActive !== false, topics: c.topics || [],
          })));
        }
      } catch {}
      setLoading(false);
    }
    fetchCourses();
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmptyCourse>({ ...emptyCourse });
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.level.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyCourse });
    setShowModal(true);
  }

  function openEdit(course: CourseItem) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      duration: course.duration,
      hours: course.hours,
      fee: course.fee,
      level: course.level,
      description: course.description,
      image: course.image,
      active: course.active,
      topics: [...course.topics],
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.fee.trim()) return;
    const feeNum = parseInt(form.fee.replace(/[^0-9]/g, "")) || 0;
    const slug = form.title.toLowerCase().replace(/\s+/g, "-");
    const payload = { title: form.title, slug, duration: form.duration, hours: form.hours, fee: feeNum, level: form.level.toUpperCase(), description: form.description, image: form.image, isActive: form.active, topics: form.topics };

    if (editingId) {
      const res = await apiPut(`/courses/${editingId}`, payload);
      if (res.ok) setCourses((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
    } else {
      const res = await apiPost<any>("/courses", payload);
      if (res.ok && res.data?.course) {
        const c = res.data.course;
        setCourses((prev) => [...prev, { id: c._id, title: c.title, duration: c.duration, hours: c.hours, fee: `\u20B9${c.fee.toLocaleString("en-IN")}`, level: c.level, image: c.image || "", description: c.description, active: c.isActive, topics: c.topics || [] }]);
      }
    }
    setShowModal(false);
  }

  async function toggleActive(id: string) {
    await apiPatch(`/courses/${id}/toggle`, {});
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course?")) return;
    await apiDelete(`/courses/${id}`);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <AdminLayout
      title="Courses"
      subtitle="Manage academy courses — add, edit, price, description, activate/deactivate."
    >

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-pink-700"
        >
          + Add Course
        </button>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
        />
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">TOTAL COURSES</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{courses.length}</p>
        </div>
        <div className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-green-700">ACTIVE</p>
          <p className="mt-2 text-3xl font-black text-green-700">
            {courses.filter((c) => c.active).length}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">LEVELS</p>
          <p className="mt-2 text-lg font-bold text-blue-700">
            {[...new Set(courses.map((c) => c.level))].join(" • ")}
          </p>
        </div>
      </div>

      {/* Course Cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm"
          >
            {/* Image */}
            {course.image ? (
              <div className="relative h-40 w-full overflow-hidden bg-pink-100">
                <img
                  src={course.image}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-pink-500">
                  QURUX ACADEMY
                </p>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                    {course.level}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    {course.title}
                  </h3>
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {course.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  {course.duration}
                </span>
                <span className="rounded-lg bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
                  {course.hours}
                </span>
                <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {course.fee}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(course.id)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    course.active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
                >
                  {course.active ? "ACTIVE" : "INACTIVE"}
                </button>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => openEdit(course)}
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCourse(course.id)}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            No courses found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-gray-900">
                {editingId ? "Edit Course" : "Add New Course"}
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
                Course Title *
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Basic Makeup Artist Course"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-bold text-gray-800">
                  Duration
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 30 Days"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Hours
                  <input
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="e.g. 90 Hours"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </label>

                <label className="block text-sm font-bold text-gray-800">
                  Level
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-pink-500"
                  >
                    <option>Beginner</option>
                    <option>Professional</option>
                    <option>Advanced</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-bold text-gray-800">
                Course Fee *
                <input
                  required
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="e.g. ₹49,999"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Course description..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Image Path
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/course-images/your-course.jpg"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </label>

              <label className="block text-sm font-bold text-gray-800">
                Topics (comma separated)
                <input
                  value={form.topics.join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      topics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Makeup fundamentals, Skin preparation..."
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
                  Active (visible on academy page)
                </label>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-full bg-pink-600 px-6 py-3.5 font-bold text-white hover:bg-pink-700"
              >
                {editingId ? "SAVE CHANGES" : "ADD COURSE"}
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

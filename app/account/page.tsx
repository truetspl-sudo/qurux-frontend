"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  apiPost,
  getLoggedInUser,
  logout as apiLogout,
} from "../../lib/api";

type AuthMode = "login" | "signup";

type LoggedInUser = {
  _id?: string;
  id?: string;
  fullName: string;
  email?: string;
  mobile: string;
  userId?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  role?: string;
  bobStatus?: string;
};

export function getUser(): LoggedInUser | null {
  return getLoggedInUser() as LoggedInUser | null;
}

export function isLoggedIn(): boolean {
  return !!getLoggedInUser();
}

export function logoutUser() {
  apiLogout();
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [existingUser, setExistingUser] = useState<LoggedInUser | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Login form fields
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Password reset fields (RULE: current/pura password NAHI mangte —
  // sirf naya password → admin dashboard approve karega)
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // Forgot-password form (login screen)
  const [showForgot, setShowForgot] = useState(false);
  const [fgUserId, setFgUserId] = useState("");
  const [fgNew, setFgNew] = useState("");
  const [fgConfirm, setFgConfirm] = useState("");
  const [fgBusy, setFgBusy] = useState(false);

  useEffect(() => {
    const user = getLoggedInUser();
    if (user) setExistingUser(user as LoggedInUser);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setErrorMsg("");

    try {
      if (mode === "signup") {
        // Validation
        if (!form.fullName.trim() || !form.phone.trim() || !form.password) {
          setErrorMsg("Please fill all required fields.");
          setBusy(false);
          return;
        }
        if (form.password.length < 6) {
          setErrorMsg("Password must be at least 6 characters.");
          setBusy(false);
          return;
        }
        if (form.password !== form.confirmPassword) {
          setErrorMsg("Passwords do not match.");
          setBusy(false);
          return;
        }

        const res = await apiPost<any>("/auth/register", {
          fullName: form.fullName.trim(),
          mobile: form.phone.trim(),
          password: form.password,
        });

        if (res.ok) {
          setExistingUser(res.data.user);
          setMessage(
            "Account created! Waiting for admin approval. Admin will provide your User ID."
          );
          setSubmitted(true);
        } else {
          setErrorMsg(res.message || "Registration failed. Try again.");
        }
      } else {
        // LOGIN with userId + password
        if (!loginUserId.trim() || !loginPassword) {
          setErrorMsg("Please enter your User ID and password.");
          setBusy(false);
          return;
        }

        const res = await apiPost<any>("/auth/login", {
          userId: loginUserId.trim().toUpperCase(),
          password: loginPassword,
        });

        if (res.ok) {
          // Store token
          if (res.data.token) {
            localStorage.setItem("qurux_token", res.data.token);
          }
          if (res.data.user) {
            localStorage.setItem("qurux_user", JSON.stringify(res.data.user));
          }
          setExistingUser(res.data.user);
          setMessage("Login successful!");
          setSubmitted(true);
        } else {
          setErrorMsg(res.message || "Invalid credentials.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    apiLogout();
    setExistingUser(null);
    setSubmitted(false);
    setMessage("");
    setErrorMsg("");
    setForm({ fullName: "", phone: "", password: "", confirmPassword: "" });
    setLoginUserId("");
    setLoginPassword("");
  }

  // Password reset request — RULE: current password NAHI chahiye. User ID +
  // naya password → admin dashboard (/admin/password-resets) approve karta hai.
  async function submitResetRequest(userIdArg: string) {
    const userId = (userIdArg || "").trim().toUpperCase();
    if (!userId) {
      setPwMsg({ ok: false, text: "User ID chahiye." });
      return;
    }
    if (pwNew.length < 6) {
      setPwMsg({ ok: false, text: "Naya password kam se kam 6 characters ka hona chahiye." });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg({ ok: false, text: "Naya password aur confirm password match nahi kar rahe." });
      return;
    }
    setPwBusy(true);
    const res = await apiPost<any>("/auth/forgot-password", {
      userId,
      newPassword: pwNew,
    });
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({
        ok: true,
        text: "Password reset request bhej di gayi! Admin dashboard pe request dikhegi — admin approve karega, phir naye password se login karein.",
      });
      setPwNew("");
      setPwConfirm("");
    } else {
      setPwMsg({ ok: false, text: res.message || "Request fail hui." });
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (!fgUserId.trim()) {
      setErrorMsg("User ID likho.");
      return;
    }
    if (fgNew.length < 6) {
      setErrorMsg("Naya password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    if (fgNew !== fgConfirm) {
      setErrorMsg("Naya password aur confirm password match nahi kar rahe.");
      return;
    }
    setFgBusy(true);
    const res = await apiPost<any>("/auth/forgot-password", {
      userId: fgUserId.trim().toUpperCase(),
      newPassword: fgNew,
    });
    setFgBusy(false);
    if (res.ok) {
      setMessage(res.message || "Password reset request bhej di gayi!");
      setShowForgot(false);
      setFgUserId("");
      setFgNew("");
      setFgConfirm("");
    } else {
      setErrorMsg(res.message || "Request fail hui.");
    }
  }

  // ── Already logged in view ──
  if (existingUser) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 py-12">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-pink-100 bg-white p-8 shadow-lg">
            <h1 className="mb-2 text-center font-[var(--font-heading)] text-2xl font-bold text-gray-900">
              👤 My Account
            </h1>

            <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-5">
              {existingUser.userId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="font-bold text-pink-600">{existingUser.userId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="font-semibold">{existingUser.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Mobile</span>
                <span className="font-semibold">{existingUser.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    existingUser.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : existingUser.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {existingUser.status}
                </span>
              </div>
              {existingUser.role && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="font-semibold">{existingUser.role}</span>
                </div>
              )}
            </div>

            {existingUser.status === "PENDING" && (
              <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                ⏳ Your account is under review. Admin will approve soon and provide your User ID.
              </div>
            )}

            {existingUser.status === "APPROVED" && existingUser.userId && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-center text-sm text-green-700">
                ✅ Your User ID: <strong>{existingUser.userId}</strong> — Use this to login next time.
              </div>
            )}

            {submitted && message && (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-center text-sm text-green-700">
                ✅ {message}
              </div>
            )}

            {existingUser.role === "ADMIN" && (
              <Link
                href="/admin"
                className="mt-5 block w-full rounded-xl bg-slate-900 py-3.5 text-center text-sm font-bold text-white shadow-md hover:bg-slate-800"
              >
                🛠️ Open Admin Panel →
              </Link>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/account/dashboard"
                className="rounded-xl bg-pink-600 py-3 text-center text-sm font-bold text-white hover:bg-pink-700"
              >
                📊 Dashboard
              </Link>
              <Link
                href="/bob"
                className="rounded-xl bg-purple-600 py-3 text-center text-sm font-bold text-white hover:bg-purple-700"
              >
                🏦 BOB Wallet
              </Link>
              <Link
                href="/book"
                className="rounded-xl bg-blue-600 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
              >
                💄 Book Now
              </Link>
              <Link
                href="/shop"
                className="rounded-xl bg-orange-600 py-3 text-center text-sm font-bold text-white hover:bg-orange-700"
              >
                🛒 Shop
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <p className="text-sm font-bold text-gray-800">🔑 Password Reset</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Current password dene ki zaroorat nahi — sirf naya password daalo.
                Request admin ke paas jayegi; admin approve karega, phir naye
                password se login karein.
              </p>

              {pwMsg && (
                <div className={`mt-3 rounded-xl p-3 text-center text-xs font-bold ${pwMsg.ok ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {pwMsg.ok ? "✅" : "❌"} {pwMsg.text}
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="password" placeholder="New Password *" value={pwNew} onChange={(e) => { setPwNew(e.target.value); setPwMsg(null); }} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none" />
                  <input type="password" placeholder="Confirm *" value={pwConfirm} onChange={(e) => { setPwConfirm(e.target.value); setPwMsg(null); }} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none" />
                </div>
                <button onClick={() => submitResetRequest(existingUser.userId || "")} disabled={pwBusy} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                  {pwBusy ? "Submitting..." : "🔑 SUBMIT PASSWORD RESET REQUEST"}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Login / Signup form ──
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white px-4 py-12">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-center font-[var(--font-heading)] text-2xl font-bold text-gray-900">
          {mode === "login" ? "🔐 Welcome Back" : "✨ Create Account"}
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          {mode === "login"
            ? "Login with your User ID and password"
            : "Sign up to book services, shop, and join BOB Wallet"}
        </p>

        <div className="rounded-2xl border border-pink-100 bg-white p-8 shadow-lg">
          {/* Tab Switcher */}
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => { setMode("login"); setShowForgot(false); setMessage(""); setErrorMsg(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                mode === "login" ? "bg-white text-pink-600 shadow" : "text-gray-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setMode("signup"); setShowForgot(false); setMessage(""); setErrorMsg(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                mode === "signup" ? "bg-white text-pink-600 shadow" : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 rounded-xl bg-green-50 p-3 text-center text-sm text-green-700">
              ✅ {message}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">
              ❌ {errorMsg}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={showForgot ? handleForgotSubmit : handleSubmit}
            className="space-y-4"
          >
            {/* ── SIGNUP FIELDS ── */}
            {mode === "signup" && (
              <input
                name="fullName"
                type="text"
                placeholder="Full Name *"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
              />
            )}

            {mode === "signup" && (
              <input
                name="phone"
                type="tel"
                placeholder="Mobile Number *"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
              />
            )}

            {mode === "signup" && (
              <input
                name="password"
                type="password"
                placeholder="Password *"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
              />
            )}

            {mode === "signup" && (
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password *"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
              />
            )}

            {/* ── LOGIN FIELDS ── */}
            {mode === "login" && !showForgot && (
              <input
                type="text"
                placeholder="User ID (e.g. QUR-12345) *"
                value={loginUserId}
                onChange={(e) => { setLoginUserId(e.target.value); setErrorMsg(""); }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase focus:border-pink-400 focus:outline-none"
              />
            )}

            {mode === "login" && !showForgot && (
              <input
                type="password"
                placeholder="Password *"
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value); setErrorMsg(""); }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
              />
            )}

            {/* ── FORGOT PASSWORD (reset request — current password NAHI chahiye) ── */}
            {mode === "login" && showForgot && (
              <>
                <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                  🔑 Password bhool gaye? Apna <strong>User ID</strong> aur
                  <strong> naya password</strong> daalo — request admin ke paas
                  jayegi. Admin approve karega, phir naye password se login
                  karein. (Current password ki zaroorat nahi)
                </div>
                <input
                  type="text"
                  placeholder="User ID (e.g. QUR-12345) *"
                  value={fgUserId}
                  onChange={(e) => { setFgUserId(e.target.value); setErrorMsg(""); }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm uppercase focus:border-pink-400 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="New Password *"
                  value={fgNew}
                  onChange={(e) => { setFgNew(e.target.value); setErrorMsg(""); }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password *"
                  value={fgConfirm}
                  onChange={(e) => { setFgConfirm(e.target.value); setErrorMsg(""); }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pink-400 focus:outline-none"
                />
              </>
            )}

            {mode === "signup" && (
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Create Account"}
              </button>
            )}

            {mode === "login" && !showForgot && (
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {busy ? "Please wait..." : "Login"}
              </button>
            )}

            {mode === "login" && showForgot && (
              <button
                type="submit"
                disabled={fgBusy}
                className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {fgBusy ? "Submitting..." : "🔑 SUBMIT RESET REQUEST"}
              </button>
            )}
          </form>

          {/* Forgot password link (login tab) */}
          {mode === "login" && !showForgot && (
            <button
              type="button"
              onClick={() => { setShowForgot(true); setErrorMsg(""); setMessage(""); }}
              className="mt-3 block w-full text-center text-xs font-bold text-pink-600 hover:underline"
            >
              Forgot Password?
            </button>
          )}
          {mode === "login" && showForgot && (
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="mt-3 block w-full text-center text-xs font-bold text-gray-500 hover:underline"
            >
              ← Back to Login
            </button>
          )}

          {/* Guest browse */}
          <div className="mt-4 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
            Guest?{" "}
            <Link href="/book" className="text-pink-500 hover:underline">
              Browse Services
            </Link>{" "}
            ·{" "}
            <Link href="/shop" className="text-pink-500 hover:underline">
              Shop
            </Link>{" "}
            ·{" "}
            <Link href="/academy" className="text-pink-500 hover:underline">
              Learn
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

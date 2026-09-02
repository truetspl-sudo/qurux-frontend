"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/customers");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-sm text-gray-500">Loading admin panel...</p>
    </div>
  );
}

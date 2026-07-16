"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full rounded-lg px-4 py-3 text-left text-red-400 hover:bg-slate-800 hover:text-red-300 transition"
    >
      🚪 Logout
    </button>
  );
}
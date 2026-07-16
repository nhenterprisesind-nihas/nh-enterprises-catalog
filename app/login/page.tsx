"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } =
  await supabase.auth.signInWithPassword({
    email,
    password,
  });

console.log("SIGN IN RESULT:", data);
console.log("CURRENT SESSION:", await supabase.auth.getSession());

setLoading(false);

if (error) {
  setError(error.message);
  return;
}

alert("Login Successful");

router.push("/admin/orders");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg"
      >

        <h1 className="mb-2 text-center text-3xl font-bold">
          NH ENTERPRISES
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Order Management System
        </p>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded border p-3"
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block font-medium">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded border p-3"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {loading ? "Signing In..." : "Login"}
        </button>

      </form>

    </div>
  );
}
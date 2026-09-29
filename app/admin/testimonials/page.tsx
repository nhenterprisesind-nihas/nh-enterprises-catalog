"use client";

import { useEffect, useState } from "react";

type Testimonial = {
  id: number;
  customer_name: string | null;
  product_name: string;
  review: string;
  created_at: string;
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/testimonials", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setTestimonials)
      .catch(() => setError("Unable to load testimonials."));
  }, []);

  async function deleteTestimonial(id: number) {
    if (!window.confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTestimonials((current) => current.filter((testimonial) => testimonial.id !== id));
    } catch {
      setError("Unable to delete testimonial.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Testimonials</h1>
      <p className="mt-2 text-slate-500">Customer feedback submitted through the website. New submissions appear publicly straight away.</p>
      {error && <p className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-red-700">{error}</p>}
      <div className="mt-8 space-y-4">
        {testimonials.length === 0 ? <p className="rounded-xl border bg-white p-6 text-slate-500">No testimonials have been submitted yet.</p> : testimonials.map((testimonial) => (
          <article key={testimonial.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-semibold text-slate-900">{testimonial.product_name}</p>
                <p className="mt-2 text-slate-700">“{testimonial.review}”</p>
                <p className="mt-3 text-sm text-slate-500">{testimonial.customer_name || "Anonymous shopper"} · {new Date(testimonial.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => deleteTestimonial(testimonial.id)} disabled={deletingId === testimonial.id} className="h-fit rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{deletingId === testimonial.id ? "Deleting..." : "Delete"}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

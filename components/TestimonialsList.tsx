"use client";

import { FormEvent, useEffect, useState } from "react";

type Testimonial = {
  id: number;
  customer_name: string | null;
  product_name: string;
  review: string;
  created_at: string;
};

const emptyForm = { customerName: "", productName: "", review: "" };

export default function TestimonialsList() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((response) => response.ok ? response.json() : [])
      .then(setTestimonials)
      .catch(() => setTestimonials([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit feedback.");

      setTestimonials((current) => [result, ...current]);
      setForm(emptyForm);
      setIsOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="mx-auto mt-10 max-w-2xl text-center">
        <button onClick={() => setIsOpen(true)} className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
          Share your feedback
        </button>
        <p className="mt-3 text-sm text-gray-500">Your feedback will appear here after you submit it.</p>
      </section>

      {testimonials.length > 0 && (
        <section className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2" aria-label="Customer testimonials">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm">
              <p className="text-sm font-semibold text-emerald-700">{testimonial.product_name}</p>
              <blockquote className="mt-3 leading-7 text-gray-700">“{testimonial.review}”</blockquote>
              <p className="mt-5 text-sm font-medium text-gray-900">{testimonial.customer_name || "Verified shopper"}</p>
            </article>
          ))}
        </section>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="feedback-title" className="text-xl font-bold text-gray-900">Share your feedback</h2><p className="mt-1 text-sm text-gray-500">Thank you for helping other shoppers.</p></div>
              <button type="button" onClick={() => setIsOpen(false)} className="text-2xl leading-none text-gray-500 hover:text-gray-900" aria-label="Close">×</button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Your name <span className="text-gray-400">(optional)</span><input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} maxLength={80} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-gray-700">Product purchased<input required value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} minLength={2} maxLength={120} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-gray-700">Your feedback<textarea required value={form.review} onChange={(event) => setForm({ ...form, review: event.target.value })} minLength={10} maxLength={1000} rows={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="mt-6 w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{submitting ? "Submitting..." : "Submit feedback"}</button>
          </form>
        </div>
      )}
    </>
  );
}

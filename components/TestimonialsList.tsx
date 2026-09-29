"use client";

import { FormEvent, useEffect, useState } from "react";

type Testimonial = {
  id: number;
  customer_name: string | null;
  customer_location: string | null;
  product_name: string;
  rating: number | null;
  review: string;
  created_at: string;
};

const emptyForm = {
  customerName: "",
  customerLocation: "",
  productName: "",
  rating: 5,
  review: "",
};

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={
            interactive
              ? "rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              : "p-0.5"
          }
          aria-label={
            interactive ? `Rate ${star} out of 5` : undefined
          }
        >
          <span
            className={
              star <= rating ? "text-amber-400" : "text-gray-300"
            }
            aria-hidden="true"
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function TestimonialsList() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((response) => (response.ok ? response.json() : []))
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to submit feedback."
        );
      }

      setTestimonials((current) => [result, ...current]);
      setForm(emptyForm);
      setIsOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit feedback."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Share Feedback Button */}
      <section className="mx-auto mt-10 max-w-2xl text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          Share your feedback
        </button>

        <p className="mt-3 text-sm text-gray-500">
          Your feedback will appear here after you submit it.
        </p>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section
          className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm"
            >
              {/* Rating + Date */}
              <div className="flex items-center justify-between gap-3">
                {testimonial.rating ? (
                  <Stars rating={testimonial.rating} />
                ) : (
                  <span className="text-xs text-gray-400">
                    No rating
                  </span>
                )}

                <time
                  className="text-xs text-gray-500"
                  dateTime={testimonial.created_at}
                >
                  {formatDate(testimonial.created_at)}
                </time>
              </div>

              {/* Product */}
              <p className="mt-4 text-sm font-semibold text-emerald-700">
                {testimonial.product_name}
              </p>

              {/* Review */}
              <blockquote className="mt-3 leading-7 text-gray-700">
                “{testimonial.review}”
              </blockquote>

              {/* Customer Name */}
              <p className="mt-5 text-sm font-medium text-gray-900">
                {testimonial.customer_name || "Anonymous shopper"}
              </p>

              {/* Location */}
              {testimonial.customer_location && (
                <p className="mt-1 text-xs text-gray-500">
                  {testimonial.customer_location}
                </p>
              )}
            </article>
          ))}
        </section>
      ) : (
        /* Empty State */
        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center">
          <p className="font-semibold text-gray-900">
            Be the first to share your experience
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Your feedback can help other shoppers discover NH
            Enterprises.
          </p>
        </section>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <form
            onSubmit={submit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="feedback-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Share your feedback
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Thank you for helping other shoppers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Rating */}
              <div>
                <p className="block text-sm font-medium text-gray-700">
                  Your rating
                </p>

                <div className="mt-2">
                  <Stars
                    rating={form.rating}
                    interactive
                    onChange={(rating) =>
                      setForm({
                        ...form,
                        rating,
                      })
                    }
                  />
                </div>
              </div>

              {/* Customer Name */}
              <label className="block text-sm font-medium text-gray-700">
                Your name{" "}
                <span className="text-gray-400">
                  (optional)
                </span>

                <input
                  value={form.customerName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customerName: event.target.value,
                    })
                  }
                  maxLength={80}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              {/* Location */}
              <label className="block text-sm font-medium text-gray-700">
                Location{" "}
                <span className="text-gray-400">
                  (optional)
                </span>

                <input
                  value={form.customerLocation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customerLocation: event.target.value,
                    })
                  }
                  maxLength={120}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              {/* Product */}
              <label className="block text-sm font-medium text-gray-700">
                Product purchased

                <input
                  required
                  value={form.productName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      productName: event.target.value,
                    })
                  }
                  minLength={2}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>

              {/* Feedback */}
              <label className="block text-sm font-medium text-gray-700">
                Your feedback

                <textarea
                  required
                  value={form.review}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      review: event.target.value,
                    })
                  }
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : "Submit feedback"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

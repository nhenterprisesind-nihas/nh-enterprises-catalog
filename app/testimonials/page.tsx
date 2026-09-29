import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Testimonials | Nikshas Collections",
  description: "Customer feedback for products from Nikshas Collections.",
};

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 fill-amber-400 text-amber-400"
      viewBox="0 0 24 24"
    >
      <path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.53l-5.88 3.08 1.12-6.55-4.76-4.64 6.58-.96L12 2.5Z" />
    </svg>
  );
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            Nikshas Collections
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Browse products
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Testimonials
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Feedback from our shoppers
          </h1>
          <p className="mt-4 text-gray-600">
            We value every customer experience and will share verified feedback here.
          </p>
        </div>

        <section className="mx-auto mt-10 max-w-2xl" aria-label="Sample testimonial">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex" aria-label="5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} />
                ))}
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Sample testimonial
              </span>
            </div>

            <blockquote className="mt-6 text-lg leading-8 text-gray-700">
              “The Jumkhas were even more beautiful in person. They felt light to wear,
              looked elegant, and arrived neatly packed—perfect for a festive outfit.”
            </blockquote>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="font-semibold text-gray-900">Sample customer feedback</p>
              <p className="mt-1 text-sm text-gray-500">Jumkhas product</p>
            </div>
          </article>

          <p className="mt-4 text-center text-sm text-gray-500">
            This is illustrative placeholder copy and is not a verified customer review.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

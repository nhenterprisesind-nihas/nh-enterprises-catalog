import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { createPageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = createPageMetadata(
  "/about",
  "About Us",
  "Discover NH Enterprises, a multi-category online retail destination offering curated products and convenient WhatsApp ordering."
);

const collections = [
  "Jewellery, traditional earrings, jumkhas and temple jewellery",
  "Kanchipuram silk sarees and handloom sarees",
  "Children's clothing",
  "Books, stationery, toys and gifts",
  "Lifestyle products and everyday essentials",
];

const benefits = [
  "Carefully curated product collections",
  "Traditional and contemporary product choices",
  "Convenient WhatsApp ordering",
  "Transparent pricing",
  "Personalised customer assistance",
  "Courier delivery across India",
  "A customer-friendly shopping experience",
];

export default function AboutPage() {
  return (
    <InfoPageLayout>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
          About us
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Discover More. Celebrate Every Occasion. Shop with Confidence.
        </h1>
        <p className="mt-6 leading-7 text-gray-700">
          NH Enterprises is a multi-category online retail destination offering
          jewellery, traditional earrings, jumkhas, temple jewellery,
          Kanchipuram silk sarees, handloom sarees, children&apos;s clothing,
          books, stationery, toys, gifts, lifestyle products and everyday
          essentials.
        </p>

        <section className="mt-9">
          <h2 className="text-xl font-semibold text-gray-900">
            Explore our collections
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-gray-700">
            {collections.map((collection) => (
              <li key={collection}>{collection}</li>
            ))}
          </ul>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-semibold text-gray-900">
            Shopping with NH Enterprises
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-gray-700">
            {benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </section>

        <p className="mt-10 border-t border-gray-200 pt-6 text-lg font-semibold text-brand-dark">
          NH Enterprises – A World of Choices, Just a Message Away.
        </p>
      </article>
    </InfoPageLayout>
  );
}

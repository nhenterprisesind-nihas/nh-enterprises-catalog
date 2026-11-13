import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";
import { createPageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = createPageMetadata(
  "/contact",
  "Contact Us",
  "Contact NH Enterprises by WhatsApp or email for product enquiries and customer assistance."
);

export default function ContactPage() {
  return (
    <InfoPageLayout>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
          Get in touch
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-4 leading-7 text-gray-700">
          We&apos;re happy to help with product questions, orders and delivery
          enquiries.
        </p>

        <dl className="mt-8 divide-y divide-gray-200">
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">Business name</dt>
            <dd className="text-gray-700">{BUSINESS_PROFILE.name}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">Address</dt>
            <dd className="text-gray-700">{BUSINESS_PROFILE.address}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">WhatsApp</dt>
            <dd>
              <a
                href={BUSINESS_PROFILE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-dark underline underline-offset-2"
              >
                {BUSINESS_PROFILE.whatsappDisplay}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">Email</dt>
            <dd>
              <a
                href={BUSINESS_PROFILE.emailUrl}
                className="font-medium text-brand-dark underline underline-offset-2"
              >
                {BUSINESS_PROFILE.email}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">Business hours</dt>
            <dd className="text-gray-700">{BUSINESS_PROFILE.businessHours}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
            <dt className="font-semibold text-gray-900">GSTIN</dt>
            <dd className="text-gray-700">{BUSINESS_PROFILE.gstin}</dd>
          </div>
        </dl>
      </article>
    </InfoPageLayout>
  );
}

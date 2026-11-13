import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import TrackOrderForm from "@/components/TrackOrderForm";
import { createPageMetadata } from "@/lib/pageMetadata";

const description =
  "Enter your order number and registered mobile number to check the latest status of your order.";

export const metadata: Metadata = {
  ...createPageMetadata("/track-order", "Track Your Order", description),
  robots: { index: false, follow: false, noarchive: true },
};

export default function TrackOrderPage() {
  return (
    <InfoPageLayout>
      <section className="mx-auto max-w-2xl">
        <div className="mb-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
            NH Enterprises
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Track Your Order
          </h1>
          <p className="mt-4 leading-7 text-gray-600">{description}</p>
        </div>
        <TrackOrderForm />
      </section>
    </InfoPageLayout>
  );
}

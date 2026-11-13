import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { createPageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = createPageMetadata(
  "/shipping-returns",
  "Shipping and Returns",
  "Read NH Enterprises shipping, delivery, non-receipt and returns information."
);

export default function ShippingReturnsPage() {
  return (
    <InfoPageLayout>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
          Customer information
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Shipping and Returns
        </h1>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Shipping</h2>
          <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-gray-700">
            <li>Orders are accepted through WhatsApp.</li>
            <li>Courier delivery is available across India.</li>
            <li>
              Shipping cost is calculated based on the customer&apos;s delivery
              address and applicable courier charges.
            </li>
            <li>
              Shipping charges will be communicated to you and included in the
              final invoice before order confirmation and payment.
            </li>
            <li>
              Delivery times depend on the destination and courier service.
              Estimated timelines are not guarantees and may be affected by
              circumstances outside our control.
            </li>
          </ul>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-semibold text-gray-900">
            Returns, exchanges and product concerns
          </h2>
          <p className="mt-4 leading-7 text-gray-700">
            All sales are final. We do not accept returns or exchanges for
            change of mind, personal preference or an incorrect product
            selection made by the customer.
          </p>
          <p className="mt-4 leading-7 text-gray-700">
            This policy does not take away any rights or remedies available to
            consumers under applicable Indian law. If an item is defective,
            damaged in transit or materially different from its description,
            contact us promptly with your order details and supporting
            information so we can review the issue and provide an appropriate
            resolution as required by applicable law.
          </p>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-semibold text-gray-900">
            If an order has not been received
          </h2>
          <p className="mt-4 leading-7 text-gray-700">
            If you believe your order has not been delivered, contact NH
            Enterprises with your order details. We will verify the shipment
            status with the courier. If genuine non-delivery is established, we
            will work with you on an appropriate resolution, such as
            reshipment or refund, as applicable. A delay alone does not
            automatically qualify for a refund.
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}

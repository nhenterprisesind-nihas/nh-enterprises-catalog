import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { createPageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = createPageMetadata(
  "/terms",
  "Terms and Conditions",
  "Review the terms for using the NH Enterprises website and placing WhatsApp-based orders."
);

export default function TermsPage() {
  return (
    <InfoPageLayout>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
          Please read before ordering
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Terms and Conditions
        </h1>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Website and ordering
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            This website presents the NH Enterprises product catalogue and
            business information. Customers currently place orders through
            WhatsApp. The website does not provide automated online checkout.
            Sending an enquiry does not by itself mean that an order has been
            accepted or confirmed.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            To place an order, contact us through WhatsApp to confirm the
            product, quantity, availability, delivery address and total price.
            If you proceed, a UPI QR payment request may be shared through
            WhatsApp. Payment should be made only after you have reviewed and
            agreed to the order details and final invoice.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Product information, availability and pricing
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            Product information, images, prices and stock status are provided
            to help customers make an informed choice. Colours and appearance
            may vary between screens and the actual product. We make reasonable
            efforts to keep catalogue information current, but products may
            become unavailable and displayed information may need correction.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            The applicable product price and availability are confirmed with
            you before the order is accepted. Shipping charges depend on the
            delivery address and applicable courier charges; they will be
            communicated and included in the final invoice before confirmation
            and payment.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirmation and cancellation
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            An order is confirmed when NH Enterprises confirms the agreed order
            details with you through WhatsApp. If you need to cancel or change
            an order, contact us as soon as possible. We will let you know
            whether the request can be accommodated based on the order&apos;s
            preparation or dispatch status. Any applicable cancellation or
            refund will be handled in accordance with applicable law.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Shipping, returns and consumer rights
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            Courier delivery is available across India. Delivery times depend
            on the destination and courier service. All sales are final for
            change of mind, personal preference or incorrect product selection
            by the customer. See our{" "}
            <a
              href="/shipping-returns"
              className="font-medium text-brand-dark underline underline-offset-2"
            >
              Shipping and Returns Policy
            </a>{" "}
            for details, including how to contact us about non-receipt or a
            defective, damaged or misdescribed product.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            Nothing in these terms or our policies excludes, restricts or
            waives any consumer right or remedy that cannot lawfully be
            excluded, restricted or waived under applicable Indian law.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Customer responsibilities
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            Please provide accurate order and delivery details, review the
            product, quantity, price and shipping charges before confirming,
            and keep your order communications and payment confirmation. Use
            this website lawfully and do not interfere with its operation or
            attempt unauthorised access.
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}

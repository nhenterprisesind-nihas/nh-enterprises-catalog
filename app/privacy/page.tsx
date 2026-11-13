import type { Metadata } from "next";
import InfoPageLayout from "@/components/InfoPageLayout";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";
import { createPageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = createPageMetadata(
  "/privacy",
  "Privacy Policy",
  "Learn how NH Enterprises handles customer information, communications, delivery details and website usage data."
);

export default function PrivacyPage() {
  return (
    <InfoPageLayout>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark">
          Your information
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Privacy Policy
        </h1>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Information you may provide
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            When you contact us or place an order, you may choose to provide
            your name, phone number, delivery address, product and quantity
            selections, messages, and information needed to confirm payment.
            Please do not send payment-card details or other sensitive
            credentials in a message.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            The website does not provide automated online checkout. Orders and
            customer assistance are handled through WhatsApp, with email
            available for enquiries.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            How information is used and shared
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            We use the information you provide to respond to enquiries, confirm
            product availability and pricing, prepare and deliver orders,
            communicate about shipments, maintain business records, and meet
            applicable legal requirements.
          </p>
          <p className="mt-3 leading-7 text-gray-700">
            When needed to fulfil an order, delivery details are shared with
            the courier partner. WhatsApp and email communications are handled
            by their respective service providers. We do not sell customer
            information. We may disclose information when required by law or
            when necessary to address a dispute or protect our rights.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Website and cart information
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            The site uses Vercel Analytics and a visitor counter to understand
            website activity. Certain interaction event counts are sent to
            CounterAPI. The cart stores selected product names and quantities
            in your browser&apos;s local storage so the cart can be retained
            between visits; it does not store payment or delivery details.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Security and retention
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            We take reasonable care when handling customer information.
            Information is retained for as long as needed to respond to you,
            fulfil an order, maintain relevant records or meet legal
            obligations, and is then deleted or otherwise handled as
            appropriate. No method of electronic storage or transmission can
            be guaranteed to be completely secure.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Privacy enquiries
          </h2>
          <p className="mt-3 leading-7 text-gray-700">
            For questions about this policy or information you have shared
            with us, contact NH Enterprises at{" "}
            <a
              href={BUSINESS_PROFILE.emailUrl}
              className="font-medium text-brand-dark underline underline-offset-2"
            >
              {BUSINESS_PROFILE.email}
            </a>{" "}
            or{" "}
            <a
              href={BUSINESS_PROFILE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-dark underline underline-offset-2"
            >
              WhatsApp {BUSINESS_PROFILE.whatsappDisplay}
            </a>
            .
          </p>
        </section>
      </article>
    </InfoPageLayout>
  );
}

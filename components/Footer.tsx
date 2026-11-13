"use client";

import React from "react";
import Link from "next/link";
import VisitorCounter from "./VisitorCounter";
import { BUSINESS_PROFILE } from "@/lib/businessProfile";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const footerLinks = [
  {
    label: "@nhentrprises",
    href: "https://instagram.com/nhentrprises",
    icon: InstagramIcon,
    color: "hover:text-pink-400",
  },
  {
    label: "Join our WhatsApp Group",
    href: "https://chat.whatsapp.com/JfALSlcxJJlExgWDY8hmtX",
    icon: MessageCircleIcon,
    color: "hover:text-green-400",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61568503961128",
    icon: FacebookIcon,
    color: "hover:text-blue-400",
  },
  {
    label: BUSINESS_PROFILE.email,
    href: BUSINESS_PROFILE.emailUrl,
    icon: MailIcon,
    color: "hover:text-amber-400",
  },
];

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping and Returns", href: "/shipping-returns" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms and Conditions", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="mt-12 bg-brand-dark text-brand-soft">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-soft">
              {BUSINESS_PROFILE.name}
            </h2>
            <p className="mt-2 text-sm text-brand-soft">
              Discover More. Celebrate Every Occasion. Shop with Confidence.
            </p>
            <Link
              href="/testimonials"
              className="mt-4 inline-flex rounded-lg border border-brand-soft px-4 py-2 text-sm font-semibold text-brand-soft transition-colors hover:bg-brand hover:text-on-brand"
            >
              Read customer feedback
            </Link>
          </div>

          <nav aria-label="Footer quick links">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-soft">
              Quick Links
            </h3>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-soft transition-colors hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-business-details">
            <h3
              id="footer-business-details"
              className="text-sm font-semibold uppercase tracking-wide text-brand-soft"
            >
              Business information
            </h3>
            <address className="mt-3 space-y-2 text-sm not-italic text-brand-soft">
              <p>{BUSINESS_PROFILE.addressShort}</p>
              <p>
                WhatsApp:{" "}
                <a
                  href={BUSINESS_PROFILE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-white"
                >
                  {BUSINESS_PROFILE.whatsappDisplay}
                </a>
              </p>
              <p>
                Email:{" "}
                <a
                  href={BUSINESS_PROFILE.emailUrl}
                  className="underline underline-offset-2 hover:text-white"
                >
                  {BUSINESS_PROFILE.email}
                </a>
              </p>
              <p>Business Hours: {BUSINESS_PROFILE.footerHours}</p>
              <p>GSTIN: {BUSINESS_PROFILE.gstin}</p>
            </address>
          </section>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-brand pt-6">
          {footerLinks.map((link) => {
            const Icon = link.icon;

            return (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-brand-soft transition-colors ${link.color}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{link.label}</span>
              </a>
            );
          })}
        </div>

        <div className="mt-8 border-t border-brand pt-6">
          <p className="text-center text-xs text-brand-soft">
            © {new Date().getFullYear()} NH Enterprises. All rights reserved.
          </p>
          <VisitorCounter />
        </div>
      </div>
    </footer>
  );
}

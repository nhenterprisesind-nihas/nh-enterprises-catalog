"use client";

import React from "react";

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
    href: "https://chat.whatsapp.com/invite-link",
    icon: MessageCircleIcon,
    color: "hover:text-green-400",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/nhentrprises",
    icon: FacebookIcon,
    color: "hover:text-blue-400",
  },
  {
    label: "nhenterprisesind@gmail.com",
    href: "mailto:nhenterprisesind@gmail.com",
    icon: MailIcon,
    color: "hover:text-amber-400",
  },
];

export default function Footer() {
  return (
    <footer className="bg-emerald-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Nikshas Collections
          </h2>
          <p className="text-emerald-200 text-sm mt-1">
            Quality products at retail & wholesale pricing
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {footerLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-emerald-100 transition-colors ${link.color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{link.label}</span>
              </a>
            );
          })}
        </div>
        <div className="border-t border-emerald-700 mt-8 pt-6">
          <p className="text-center text-emerald-300 text-xs">
            © {new Date().getFullYear()} NH Enterprises. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

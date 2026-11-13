export const BUSINESS_PROFILE = {
  name: "NH Enterprises",
  address: "NH Enterprises, Mogappair West, Chennai - 600037",
  addressShort: "Mogappair West, Chennai - 600037",
  whatsappNumber: "917810093955",
  whatsappDisplay: "+91 7810093955",
  whatsappUrl: "https://wa.me/917810093955",
  email: "nhenterprisesind@gmail.com",
  emailUrl: "mailto:nhenterprisesind@gmail.com",
  businessHours: "Monday–Sunday: 10:00 AM–6:00 PM.",
  footerHours: "10 AM – 6 PM, all seven days",
  gstin: "33BETPD3982A1ZM",
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nh-enterprises-catalog.vercel.app";

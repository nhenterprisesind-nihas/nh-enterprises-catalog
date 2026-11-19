export function normalizeIndianMobileNumber(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 32) {
    return null;
  }

  let phone = value.trim().replace(/[\s-]/g, "");
  if (phone.startsWith("+91")) {
    phone = phone.slice(3);
  } else if (phone.startsWith("91") && phone.length === 12) {
    phone = phone.slice(2);
  } else if (phone.startsWith("0") && phone.length === 11) {
    phone = phone.slice(1);
  }

  return /^[6-9]\d{9}$/.test(phone) ? phone : null;
}

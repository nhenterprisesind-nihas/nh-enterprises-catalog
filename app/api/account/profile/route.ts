import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeIndianMobileNumber } from "@/lib/indian-mobile";

const noStoreHeaders = { "Cache-Control": "no-store" };
const profileColumns =
  "id, full_name, phone, address, pincode, created_at, updated_at";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function profileResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(profileColumns)
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Could not retrieve customer profile.");
      return profileResponse({ error: "Unable to load your profile." }, 500);
    }

    if (profile) {
      return profileResponse({ profile });
    }

    const googleName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "";

    return profileResponse({
      profile: {
        id: user.id,
        full_name: googleName.trim().slice(0, 80),
        phone: "",
        address: "",
        pincode: "",
        created_at: null,
        updated_at: null,
      },
    });
  } catch {
    console.error("Customer profile retrieval failed.");
    return profileResponse({ error: "Unable to load your profile." }, 500);
  }
}

export async function PUT(request: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return profileResponse({ error: "Invalid profile details." }, 400);
  }

  if (!isRecord(body)) {
    return profileResponse({ error: "Invalid profile details." }, 400);
  }

  const fullName = body.full_name;
  const phoneInput = body.phone;
  const address = body.address;
  const pincodeInput = body.pincode;

  if (
    typeof fullName !== "string" ||
    fullName.length > 80 ||
    typeof phoneInput !== "string" ||
    typeof address !== "string" ||
    address.length > 300 ||
    typeof pincodeInput !== "string"
  ) {
    return profileResponse({ error: "Please check your profile details." }, 400);
  }

  const phoneText = phoneInput.trim();
  const phone = phoneText
    ? normalizeIndianMobileNumber(phoneText)
    : "";
  const pincode = pincodeInput.trim();

  if (phoneText && !phone) {
    return profileResponse(
      { error: "Enter a valid 10-digit Indian mobile number." },
      400
    );
  }
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return profileResponse(
      { error: "Enter a valid 6-digit pincode." },
      400
    );
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName.trim(),
          phone,
          address: address.trim(),
          pincode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select(profileColumns)
      .single();

    if (error) {
      console.error("Could not save customer profile.");
      return profileResponse({ error: "Unable to save your profile." }, 500);
    }

    return profileResponse({ profile });
  } catch {
    console.error("Customer profile update failed.");
    return profileResponse({ error: "Unable to save your profile." }, 500);
  }
}

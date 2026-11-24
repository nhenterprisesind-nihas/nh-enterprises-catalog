import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { supabaseAdmin } from "@/lib/supabase-admin";

const noStoreHeaders = { "Cache-Control": "no-store" };
const confirmationPhrase = "DELETE MY ACCOUNT";

function noStoreJson<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: noStoreHeaders,
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) {
    return user;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Please confirm account deletion." }, 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("confirmation" in body) ||
    body.confirmation !== confirmationPhrase
  ) {
    return noStoreJson(
      { error: `Type "${confirmationPhrase}" to confirm.` },
      400
    );
  }

  try {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.error("Could not remove customer profile.");
      return noStoreJson({ error: "Unable to delete your account." }, 500);
    }

    const { error: userError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (userError) {
      console.error("Could not delete customer auth user.");
      return noStoreJson({ error: "Unable to delete your account." }, 500);
    }

    return noStoreJson({ success: true });
  } catch {
    console.error("Customer account deletion failed.");
    return noStoreJson({ error: "Unable to delete your account." }, 500);
  }
}

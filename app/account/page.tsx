import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Could not load the customer account", error);
    redirect("/account/login?error=1");
  }
  if (!user) {
    redirect("/account/login");
  }

  const fullName = user.user_metadata?.full_name;
  const name =
    (typeof fullName === "string" && fullName.trim()) ||
    (typeof user.user_metadata?.name === "string" &&
      user.user_metadata.name.trim()) ||
    user.email ||
    "there";

  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold text-brand-dark">Hello {name}</h1>
      </main>
    </div>
  );
}

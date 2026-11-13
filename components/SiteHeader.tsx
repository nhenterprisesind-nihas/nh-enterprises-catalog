import { BUSINESS_PROFILE } from "@/lib/businessProfile";

export default function SiteHeader({ home = false }: { home?: boolean }) {
  const brandName = home ? (
    <h1 className="text-xl font-bold tracking-tight text-brand-soft sm:text-2xl">
      {BUSINESS_PROFILE.name}
    </h1>
  ) : (
    <p className="text-xl font-bold tracking-tight text-brand-soft sm:text-2xl">
      {BUSINESS_PROFILE.name}
    </p>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-brand-dark shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand">
            {process.env.NEXT_PUBLIC_LOGO_URL ? (
              <img
                src={process.env.NEXT_PUBLIC_LOGO_URL}
                alt="NH Enterprises logo"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-on-brand">N</span>
            )}
          </div>
          <div>
            {brandName}
            <p className="text-xs text-brand-soft">
              Quality products at retail and wholesale pricing
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

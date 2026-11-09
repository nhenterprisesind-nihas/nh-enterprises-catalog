export default function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      aria-hidden="true"
    >
      <div className="h-48 bg-gray-200" />
      <div className="flex min-h-[245px] flex-col p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200" />
        <div className="mb-1 h-4 w-full rounded bg-gray-200" />
        <div className="mb-4 h-4 w-2/3 rounded bg-gray-200" />
        <div className="mb-4 grid grid-cols-3 gap-1">
          <div className="h-12 rounded-md bg-gray-200" />
          <div className="h-12 rounded-md bg-gray-200" />
          <div className="h-12 rounded-md bg-gray-200" />
        </div>
        <div className="mt-auto flex items-center gap-2">
          <div className="h-9 w-20 rounded-lg bg-gray-200" />
          <div className="h-9 flex-1 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

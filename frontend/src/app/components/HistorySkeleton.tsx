export function HistorySkeleton() {
  return (
    <div className="p-6 space-y-8 w-full animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 rounded" />
        </div>
        <div className="h-5 w-24 bg-slate-200 rounded" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-2xs">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-4 pt-2">
          <div className="h-9 w-60 bg-slate-200 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
          <div className="h-9 w-40 bg-slate-200 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-2xs">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="space-y-1">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-6 w-28 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-2xs">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

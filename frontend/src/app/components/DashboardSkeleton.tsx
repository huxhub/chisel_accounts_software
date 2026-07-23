import { Skeleton } from "./ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 w-full animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-3">
            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Company Balances skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-5 flex flex-col gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfers Log skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

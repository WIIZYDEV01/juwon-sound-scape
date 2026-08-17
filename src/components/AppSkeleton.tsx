import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col gap-4 border-r border-border/40 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden p-5 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="flex items-center gap-3 md:hidden">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-36" />
          </div>

          <Skeleton className="h-36 w-full rounded-2xl md:h-48" />

          <div className="space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

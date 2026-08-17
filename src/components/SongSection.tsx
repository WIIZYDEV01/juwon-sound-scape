import { Song } from "@/lib/types";
import SongCard from "./SongCard";
import { Skeleton } from "./ui/skeleton";

interface SongSectionProps {
  title: string;
  subtitle?: string;
  songs: Song[];
  loading?: boolean;
  limit?: number;
  emptyMessage?: string;
  error?: boolean;
  onRetry?: () => void;
}

export default function SongSection({
  title,
  subtitle,
  songs,
  loading,
  limit,
  emptyMessage = "Nothing here right now.",
}: SongSectionProps) {
  const visible = typeof limit === "number" ? songs.slice(0, limit) : songs;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-1 gap-3">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {songs.length > 0 && (
          <span className="text-xs text-muted-foreground">{songs.length} tracks</span>
        )}
      </div>
      {subtitle ? (
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      ) : (
        <div className="mb-4" />
      )}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="w-full aspect-square rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {visible.map((song) => (
            <SongCard key={song.id} song={song} queue={songs} />
          ))}
        </div>
      )}
    </section>
  );
}

import { Heart } from "lucide-react";
import TopNav from "@/components/TopNav";
import SongSection from "@/components/SongSection";
import { useAuth } from "@/context/AuthContext";
import { useLikedSongs } from "@/hooks/useSongs";

export default function LikedSongsPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError, refetch } = useLikedSongs(user?.id);

  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
            <Heart className="w-7 h-7 text-primary-foreground fill-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Playlist
            </p>
            <h1 className="text-2xl font-bold text-foreground">Liked Songs</h1>
          </div>
        </div>

        <SongSection
          title="Your likes"
          songs={data}
          loading={isLoading}
          error={isError}
          onRetry={() => void refetch()}
          emptyMessage="No liked songs yet. Heart tracks while listening to save them here."
        />
      </div>
    </div>
  );
}

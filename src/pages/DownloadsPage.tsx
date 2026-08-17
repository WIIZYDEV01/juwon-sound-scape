import { useEffect, useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import TopNav from "@/components/TopNav";
import { usePlayer } from "@/context/PlayerContext";
import {
  listDownloads,
  offlineMetaToSong,
  onDownloadsChange,
  removeDownload,
  type OfflineTrackMeta,
} from "@/lib/offline-downloads";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DownloadsPage() {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [items, setItems] = useState<OfflineTrackMeta[]>([]);

  const refresh = async () => {
    setItems(await listDownloads());
  };

  useEffect(() => {
    void refresh();
    return onDownloadsChange(() => void refresh());
  }, []);

  const songs = useMemo(() => items.map(offlineMetaToSong), [items]);

  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
            <Download className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              My Library
            </p>
            <h1 className="text-2xl font-bold text-foreground">Downloads</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6 max-w-xl">
          Saved on this device. Play them without using data. Audius, Archive, and Jamendo
          saves are full songs. Deezer saves are 30-second previews.
        </p>

        {!items.length ? (
          <p className="text-muted-foreground text-sm">
            Nothing saved yet. Play a song and tap the download icon on the player.
          </p>
        ) : (
          <div className="space-y-1 max-w-2xl">
            {items.map((item, index) => {
              const song = songs[index];
              const active = currentSong?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 border border-border ${
                    active ? "bg-secondary" : "bg-card"
                  }`}
                >
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 min-w-0 text-left"
                    onClick={() => playSong(song, songs)}
                  >
                    <img
                      src={
                        item.cover_url ||
                        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
                      }
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${active && isPlaying ? "text-primary" : "text-foreground"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.artist_name}
                        {item.isPreview ? " · Preview" : " · Offline"}
                      </p>
                    </div>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await removeDownload(item.id);
                      toast.success("Removed from Downloads");
                    }}
                    aria-label="Remove download"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

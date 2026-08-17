import { Link, useParams } from "react-router-dom";
import { Loader2, Play, Shuffle } from "lucide-react";
import { useAlbum, useAlbumTracks } from "@/hooks/useSongs";
import { usePlayer } from "@/context/PlayerContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function AlbumPage() {
  const { albumId } = useParams();
  const id = albumId ? decodeURIComponent(albumId) : undefined;
  const { data: album, isLoading: albumLoading, error, refetch } = useAlbum(id);
  const { data: tracks = [], isLoading: tracksLoading } = useAlbumTracks(id);
  const { playSong, currentSong, isPlaying } = usePlayer();

  const playable = tracks.filter((t) => Boolean(t.audio_url));
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  const isFullMix =
    (id || "").includes("mixtrack-") ||
    (playable.length === 1 && (playable[0]?.duration || 0) >= 900);

  const playAlbum = (shuffle = false) => {
    if (!playable.length) {
      toast.error("No playable tracks in this release.");
      return;
    }
    const queue = shuffle ? [...playable].sort(() => Math.random() - 0.5) : playable;
    playSong(queue[0], queue);
    if (isFullMix) {
      toast.success("Playing full mix — it will run to the end.");
    }
  };

  if (albumLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="px-6 pt-10 space-y-3">
        <p className="text-foreground font-semibold">Album unavailable</p>
        <p className="text-sm text-muted-foreground">Try again or search for another release.</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        <Link to="/search" className="block text-sm text-primary underline">Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36">
      <div className="px-6 pt-8 pb-6 flex flex-col sm:flex-row gap-6 items-end">
        <img
          src={
            album.artworkUrl ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
          }
          alt={album.title}
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-md object-cover shadow-2xl"
        />
        <div className="space-y-2 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {isFullMix ? "Full DJ Mix" : album.isAlbum === false ? "Playlist" : "Album"}
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground">{album.title}</h1>
          <p className="text-sm text-muted-foreground">
            {album.artistId ? (
              <Link className="hover:underline text-foreground" to={`/artist/${encodeURIComponent(album.artistId)}`}>
                {album.artistName}
              </Link>
            ) : (
              album.artistName
            )}
            {" · "}
            {isFullMix
              ? `${formatTime(totalDuration)} continuous mix`
              : `${tracks.length || album.trackCount || 0} tracks${totalDuration ? ` · ${formatTime(totalDuration)}` : ""}`}
            {album.releaseDate ? ` · ${new Date(album.releaseDate).getFullYear()}` : ""}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => playAlbum(false)} className="gap-2">
              <Play className="w-4 h-4 fill-current" />
              {isFullMix ? "Play Full Mix" : "Play Album"}
            </Button>
            {!isFullMix && (
              <Button variant="secondary" onClick={() => playAlbum(true)} className="gap-2">
                <Shuffle className="w-4 h-4" /> Shuffle
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6">
        {tracksLoading ? (
          <p className="text-muted-foreground text-sm">Loading tracklist…</p>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tracks returned for this album from the provider.
          </p>
        ) : (
          <div className="space-y-1">
            {tracks.map((song, index) => {
              const available = Boolean(song.audio_url);
              const active = currentSong?.id === song.id;
              return (
                <button
                  key={song.id}
                  disabled={!available}
                  onClick={() => available && playSong(song, playable)}
                  className={`w-full grid grid-cols-[40px_1fr_60px] gap-3 items-center px-3 py-2 rounded-md text-left transition-colors ${
                    available ? "hover:bg-secondary cursor-pointer" : "opacity-50 cursor-not-allowed"
                  } ${active ? "bg-secondary" : ""}`}
                >
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {active && isPlaying ? "▶" : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? "text-primary" : "text-foreground"}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {available ? song.artist_name : "Playback unavailable for this track"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground text-right tabular-nums">
                    {formatTime(song.duration)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

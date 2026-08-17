import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Play, Shuffle } from "lucide-react";
import {
  useArtist,
  useArtistAlbums,
  useArtistTracks,
} from "@/hooks/useSongs";
import { usePlayer } from "@/context/PlayerContext";
import SongCard from "@/components/SongCard";
import AlbumCard from "@/components/AlbumCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ArtistPage() {
  const { artistId } = useParams();
  const id = artistId ? decodeURIComponent(artistId) : undefined;
  const { data: artist, isLoading: artistLoading, error: artistError, refetch } = useArtist(id);
  const { data: tracks = [], isLoading: tracksLoading } = useArtistTracks(id);
  const { data: albums = [], isLoading: albumsLoading } = useArtistAlbums(id);
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [visible, setVisible] = useState(50);

  const playable = useMemo(
    () => tracks.filter((t) => Boolean(t.audio_url)),
    [tracks]
  );

  const popular = useMemo(
    () => [...playable].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10),
    [playable]
  );

  const playAll = (shuffle = false, list = playable) => {
    if (!list.length) {
      toast.error("No playable tracks for this artist.");
      return;
    }
    const queue = shuffle ? [...list].sort(() => Math.random() - 0.5) : list;
    playSong(queue[0], queue);
  };

  if (artistLoading || (tracksLoading && !artist)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (artistError || !artist) {
    return (
      <div className="px-6 pt-10 space-y-3">
        <p className="text-foreground font-semibold">Artist not found</p>
        <p className="text-sm text-muted-foreground">
          Could not load this artist from the live catalog. Try again.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
        <Link to="/countries" className="block text-sm text-primary underline">
          Back to Countries
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36">
      <div className="relative px-6 pt-8 pb-6 flex flex-col sm:flex-row gap-6 items-end">
        <img
          src={
            artist.imageUrl ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
          }
          alt={artist.name}
          className="w-40 h-40 sm:w-52 sm:h-52 rounded-full object-cover shadow-2xl"
        />
        <div className="space-y-2 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Artist</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground">
            {artist.name}
            {artist.isVerified ? " ✓" : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {playable.length} songs
            {albums.length ? ` · ${albums.length} albums` : ""}
            {artist.followerCount ? ` · ${artist.followerCount.toLocaleString()} followers` : ""}
          </p>
          {artist.handle && (
            <p className="text-xs text-muted-foreground">@{artist.handle}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => playAll(false)} className="gap-2" disabled={!playable.length}>
              <Play className="w-4 h-4 fill-current" /> Play
            </Button>
            <Button
              variant="secondary"
              onClick={() => playAll(true)}
              className="gap-2"
              disabled={!playable.length}
            >
              <Shuffle className="w-4 h-4" /> Shuffle
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-10">
        {!!popular.length && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Popular</h2>
            <div className="space-y-1">
              {popular.map((song, index) => {
                const active = currentSong?.id === song.id;
                return (
                  <button
                    key={song.id}
                    onClick={() => playSong(song, playable)}
                    className={`w-full grid grid-cols-[40px_48px_1fr_80px_60px] gap-3 items-center px-3 py-2 rounded-md text-left hover:bg-secondary ${
                      active ? "bg-secondary" : ""
                    }`}
                  >
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {active && isPlaying ? "▶" : index + 1}
                    </span>
                    <img
                      src={
                        song.cover_url ||
                        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop"
                      }
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
                    <p
                      className={`text-sm font-medium truncate ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {song.title}
                    </p>
                    <span className="text-xs text-muted-foreground text-right tabular-nums hidden sm:block">
                      {(song.plays || 0).toLocaleString()} plays
                    </span>
                    <span className="text-xs text-muted-foreground text-right tabular-nums">
                      {formatTime(song.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Albums</h2>
          {albumsLoading ? (
            <p className="text-muted-foreground text-sm">Loading albums…</p>
          ) : albums.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No albums listed for this artist in the live catalog.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Discography</h2>
            <span className="text-xs text-muted-foreground">
              {Math.min(visible, tracks.length)} / {tracks.length}
            </span>
          </div>
          {tracksLoading ? (
            <p className="text-muted-foreground text-sm">Loading all songs…</p>
          ) : playable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No streamable tracks returned for this artist.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tracks.slice(0, visible).map((song) => (
                  <SongCard key={song.id} song={song} queue={playable} />
                ))}
              </div>
              {visible < tracks.length && (
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setVisible((n) => n + 50)}>Load more songs</Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

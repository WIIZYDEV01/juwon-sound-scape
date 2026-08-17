import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, Play, Shuffle } from "lucide-react";
import { useResolveArtistByName } from "@/hooks/useSongs";
import { musicTrackToSong } from "@/lib/music";
import { resolveCuratedArtistName } from "@/lib/music/curated-search";
import { getCuratedSongsForArtist } from "@/lib/music/curated-library";
import { usePlayer } from "@/context/PlayerContext";
import SongCard from "@/components/SongCard";
import CuratedSongRow from "@/components/CuratedSongRow";
import ArtistCard from "@/components/ArtistCard";
import AlbumCard from "@/components/AlbumCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ArtistDiscoverPage() {
  const { artistName } = useParams();
  const rawName = artistName ? decodeURIComponent(artistName) : "";
  const name = resolveCuratedArtistName(rawName) || rawName;
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useResolveArtistByName(name);
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [visible, setVisible] = useState(40);

  const artist = data?.artist || null;
  const tracks = useMemo(
    () => (data?.tracks || []).map(musicTrackToSong),
    [data?.tracks]
  );
  const playable = tracks.filter((t) => Boolean(t.audio_url));
  const albums = data?.albums || [];
  const related = data?.relatedArtists || [];
  const knownSongs = useMemo(() => getCuratedSongsForArtist(name), [name]);

  // If we resolved a strong live artist profile, open the dedicated artist page
  useEffect(() => {
    if (!artist) return;
    const exact =
      artist.name.toLowerCase().trim() === name.toLowerCase().trim() ||
      (artist.handle || "").toLowerCase() === name.toLowerCase().trim();
    if (exact && playable.length > 0) {
      navigate(`/artist/${encodeURIComponent(artist.id)}`, { replace: true });
    }
  }, [artist, name, playable.length, navigate]);

  const playAll = (shuffle = false) => {
    if (!playable.length) {
      toast.error("No playable tracks found for this artist right now.");
      return;
    }
    const queue = shuffle ? [...playable].sort(() => Math.random() - 0.5) : playable;
    playSong(queue[0], queue);
  };

  return (
    <div className="min-h-screen pb-36 px-6 pt-6 space-y-8">
      <div>
        <Link to="/countries" className="text-sm text-muted-foreground hover:text-foreground">
          ← Countries
        </Link>
        <div className="mt-4 flex flex-col sm:flex-row gap-6 items-start sm:items-end">
          {artist?.imageUrl && (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-36 h-36 rounded-full object-cover shadow-2xl"
            />
          )}
          <div className="flex-1 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Artist</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground">
              {artist?.name || name}
              {artist?.isVerified ? " ✓" : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              {playable.length} playable tracks
              {albums.length ? ` · ${albums.length} albums` : ""}
              {artist?.followerCount
                ? ` · ${artist.followerCount.toLocaleString()} followers`
                : ""}
              {" · live catalog"}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => playAll(false)} className="gap-2" disabled={!playable.length}>
                <Play className="w-4 h-4 fill-current" /> Play all
              </Button>
              <Button
                variant="secondary"
                onClick={() => playAll(true)}
                className="gap-2"
                disabled={!playable.length}
              >
                <Shuffle className="w-4 h-4" /> Shuffle
              </Button>
              {artist && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/artist/${encodeURIComponent(artist.id)}`)}
                >
                  Open artist page
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading live music for {name}…
        </div>
      )}

      {isError && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">Could not reach the music catalog. Try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!!knownSongs.length && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-2">Known songs</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Tap Play to load a licensed stream. Titles without a catalog file will not play.
          </p>
          <div className="space-y-1 max-w-2xl">
            {knownSongs.map((song) => (
              <CuratedSongRow
                key={`${song.artist}-${song.title}`}
                song={song}
                existingTracks={data?.tracks || []}
                upcoming={knownSongs}
                extraQueue={playable}
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && !playable.length && !albums.length && !artist && !knownSongs.length && (
        <div className="rounded-xl border border-border bg-card p-5 max-w-xl space-y-2">
          <p className="font-semibold text-foreground">No live tracks found for “{name}”</p>
          <p className="text-sm text-muted-foreground">
            This name is in your country list, but Audius has no streamable songs for them right now.
            Try another spelling, or connect Spotify on the Search page for more results.
          </p>
        </div>
      )}

      {!!albums.length && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {!!tracks.length && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">All songs</h2>
            <span className="text-xs text-muted-foreground">
              {Math.min(visible, tracks.length)} / {tracks.length}
            </span>
          </div>

          <div className="space-y-1 mb-6">
            {tracks.slice(0, visible).map((song, index) => {
              const available = Boolean(song.audio_url);
              const active = currentSong?.id === song.id;
              return (
                <button
                  key={song.id}
                  disabled={!available}
                  onClick={() => available && playSong(song, playable)}
                  className={`w-full grid grid-cols-[40px_48px_1fr_60px] gap-3 items-center px-3 py-2 rounded-md text-left ${
                    available ? "hover:bg-secondary" : "opacity-50 cursor-not-allowed"
                  } ${active ? "bg-secondary" : ""}`}
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
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist_name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground text-right tabular-nums">
                    {formatTime(song.duration)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tracks.slice(0, visible).map((song) => (
              <SongCard key={`card-${song.id}`} song={song} queue={playable} />
            ))}
          </div>

          {visible < tracks.length && (
            <div className="flex justify-center mt-8">
              <Button onClick={() => setVisible((n) => n + 40)}>Load more songs</Button>
            </div>
          )}
        </section>
      )}

      {!!related.length && (
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Related artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

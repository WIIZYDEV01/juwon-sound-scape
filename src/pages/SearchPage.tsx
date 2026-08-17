import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useMusicSearch } from "@/hooks/useSongs";
import { genres } from "@/lib/mock-data";
import SongCard from "@/components/SongCard";
import ArtistCard from "@/components/ArtistCard";
import AlbumCard from "@/components/AlbumCard";
import PlaylistCard from "@/components/PlaylistCard";
import { musicTrackToSong } from "@/lib/music";
import { searchCuratedArtists, searchCuratedSongs } from "@/lib/music/curated-search";
import CuratedSongRow from "@/components/CuratedSongRow";
import SpotifyConnectButton from "@/components/SpotifyConnectButton";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [trackVisible, setTrackVisible] = useState(48);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(input.trim());
      setTrackVisible(48);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);

  const curatedHits = useMemo(() => searchCuratedArtists(query, 20), [query]);
  const curatedSongs = useMemo(() => searchCuratedSongs(query, 24), [query]);
  const { data, isLoading, isError, refetch, isFetching } = useMusicSearch(query);

  const trackSongs = useMemo(
    () => (data?.tracks || []).map(musicTrackToSong),
    [data?.tracks]
  );
  const playableQueue = trackSongs.filter(
    (s) =>
      s.id.startsWith("spotify-") ||
      Boolean(s.audio_url?.startsWith("spotify:")) ||
      (Boolean(s.audio_url) && !s.audio_url.includes("open.spotify.com"))
  );
  const shownTracks = trackSongs.slice(0, trackVisible);

  const hasCurated = curatedHits.length > 0;
  const hasCuratedSongs = curatedSongs.length > 0;
  const hasLive =
    !!data &&
    (data.tracks.length > 0 ||
      data.artists.length > 0 ||
      data.albums.length > 0 ||
      data.playlists.length > 0);

  return (
    <div className="min-h-screen pb-36 px-6 pt-6">
      <div className="relative mb-4 max-w-lg">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Try: Ijoya, Anchovy, Asake, Kizz Daniel..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-8 max-w-2xl space-y-3">
        <SpotifyConnectButton />
        <p className="text-xs text-muted-foreground">
          Full songs: Audius + Internet Archive (free, no login). Your chart titles play as 30-second Deezer previews until Audiomack is approved.
        </p>
      </div>

      {query ? (
        <div className="space-y-10">
          <h1 className="text-xl font-bold text-foreground">Results for “{query}”</h1>

          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching for “{query}”…
            </div>
          )}

          {isError && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Live catalog unavailable. Showing your artist directory
                {hasCurated ? "" : " — try Countries"}.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {hasCurated && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">Matching artists</h2>
              <p className="text-xs text-muted-foreground mb-4">
                From your country lists for “{query}”.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {curatedHits.map((hit) => (
                  <Link
                    key={`${hit.countryId}-${hit.name}`}
                    to={`/discover/${encodeURIComponent(hit.name)}`}
                    className="rounded-lg px-4 py-3 bg-card hover:bg-card-hover border border-border flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{hit.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {hit.flag} {hit.countryName}
                      </p>
                    </div>
                    <span className="text-xs text-primary whitespace-nowrap">Open →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasCuratedSongs && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-2">Songs in your library list</h2>
              <p className="text-xs text-muted-foreground mb-4">
                If a full free copy exists it plays through. Otherwise you get a 30-second preview, then the next song.
              </p>
              <div className="space-y-1">
                {curatedSongs.map((song) => (
                  <CuratedSongRow
                    key={`${song.artist}-${song.title}`}
                    song={song}
                    existingTracks={data?.tracks || []}
                    upcoming={curatedSongs}
                    extraQueue={playableQueue}
                  />
                ))}
              </div>
            </section>
          )}

          {!!trackSongs.length && (
            <section>
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-bold text-foreground">Songs</h2>
                <span className="text-xs text-muted-foreground">
                  {shownTracks.length} of {trackSongs.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {shownTracks.map((song) => (
                  <SongCard key={song.id} song={song} queue={playableQueue} />
                ))}
              </div>
              {trackVisible < trackSongs.length && (
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setTrackVisible((n) => n + 48)}>Load more</Button>
                </div>
              )}
            </section>
          )}

          {!isLoading && !hasCurated && !hasCuratedSongs && !hasLive && !isError && (
            <p className="text-muted-foreground">
              No music found for “{query}”. Try{" "}
              <Link to="/countries/nigeria" className="text-primary underline">
                Nigeria artists
              </Link>
              .
            </p>
          )}

          {!!data?.artists?.length && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.artists.slice(0, 12).map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </section>
          )}

          {!!data?.albums?.length && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Albums</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.albums.slice(0, 20).map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}

          {!!data?.mixes?.length && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">DJ Mixes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.mixes.slice(0, 20).map((pl) => (
                  <PlaylistCard key={pl.id} playlist={pl} />
                ))}
              </div>
            </section>
          )}

          {!!data?.playlists?.length && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.playlists.slice(0, 20).map((pl) => (
                  <PlaylistCard key={pl.id} playlist={pl} />
              ))}
            </div>
            </section>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Browse by country</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/countries/nigeria"
                className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-card-hover"
              >
                🇳🇬 Nigeria
              </Link>
              <Link
                to="/countries/ghana"
                className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-card-hover"
              >
                🇬🇭 Ghana
              </Link>
              <Link
                to="/countries/south_africa"
                className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-card-hover"
              >
                🇿🇦 South Africa
              </Link>
              <Link
                to="/countries/gospel"
                className="rounded-full bg-secondary px-4 py-2 text-sm hover:bg-card-hover"
              >
                🙌 Gospel
              </Link>
              <Link to="/countries" className="rounded-full border border-border px-4 py-2 text-sm text-primary">
                See all →
              </Link>
            </div>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-4">Browse genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                className={`${genre.colorClass} rounded-lg p-5 h-32 flex items-end cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden relative`}
                onClick={() => setInput(genre.name)}
              >
                <span className="text-lg font-bold text-foreground relative z-10">{genre.name}</span>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-foreground/10 rounded-lg rotate-12" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

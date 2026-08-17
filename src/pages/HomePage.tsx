import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTrendingSongs, useNewReleases, useGenreTracks, useMixes, useFreeFullSongs } from "@/hooks/useSongs";
import SongSection from "@/components/SongSection";
import PlaylistCard from "@/components/PlaylistCard";
import TopNav from "@/components/TopNav";
import { curatedCountries, type CuratedCountryId } from "@/lib/music/curated-artists";

const countryAccent: Partial<Record<CuratedCountryId, string>> = {
  nigeria: "from-green-700/50 via-card to-card",
  ghana: "from-amber-700/40 via-card to-card",
  south_africa: "from-yellow-700/40 via-card to-card",
  usa: "from-blue-800/40 via-card to-card",
  uk: "from-indigo-800/40 via-card to-card",
  india: "from-orange-700/40 via-card to-card",
  south_korea: "from-pink-800/40 via-card to-card",
  china: "from-red-800/40 via-card to-card",
  japan: "from-rose-800/35 via-card to-card",
  gospel: "from-violet-800/40 via-card to-card",
  djs: "from-cyan-800/40 via-card to-card",
};

function GenreSection({ title, genre }: { title: string; genre: string }) {
  const { data = [], isLoading } = useGenreTracks(genre);
  return <SongSection title={title} songs={data} loading={isLoading} limit={12} />;
}

function MixSection() {
  const { data = [], isLoading } = useMixes("afrobeats amapiano naija");
  if (isLoading) {
    return <p className="text-sm text-muted-foreground mb-8">Loading mixes…</p>;
  }
  if (!data.length) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-1">Full DJ Mixes</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Long sets play all the way through — tap one and hit Play.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.slice(0, 10).map((pl) => (
          <PlaylistCard key={pl.id} playlist={pl} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: trending = [], isLoading: trendingLoading } = useTrendingSongs();
  const { data: newReleases = [], isLoading: newLoading } = useNewReleases();
  const { data: freeFull = [], isLoading: freeLoading } = useFreeFullSongs();

  return (
    <div className="min-h-screen pb-36">
      <TopNav />

      {/* Country-first hero — original Soundscape feel */}
      <div className="relative mx-4 sm:mx-6 mb-8 overflow-hidden rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md">
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=70"
          alt=""
          className="hero-photo absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-emerald-950/30" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            De Soundwave
          </p>
          <h1 className="max-w-xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Music from every country
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
            Browse Nigeria, Ghana, South Africa, Gospel, DJs and more — then open an artist and play.
          </p>
          <Link
            to="/countries"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Browse countries
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Browse by Country</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick a place to see curated artists from that scene
              </p>
            </div>
            <Link to="/countries" className="text-sm font-medium text-primary hover:underline shrink-0">
              See all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {curatedCountries.map((c) => (
              <Link
                key={c.id}
                to={`/countries/${c.id}`}
                className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${
                  countryAccent[c.id] || "from-secondary via-card to-card"
                } p-4 transition-transform hover:scale-[1.02] hover:border-primary/40`}
              >
                <div className="text-3xl mb-3 drop-shadow-sm">{c.flag}</div>
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{c.blurb}</p>
                <p className="mt-3 text-[11px] font-medium text-primary">
                  {c.artists.length} artists
                </p>
              </Link>
            ))}
          </div>
        </section>

        <SongSection
          title="Free full songs"
          subtitle="These play all the way through — no login, no Premium."
          songs={freeFull}
          loading={freeLoading}
          limit={18}
        />
        <SongSection title="Trending Now" songs={trending} loading={trendingLoading} limit={18} />
        <SongSection title="New Releases" songs={newReleases} loading={newLoading} limit={18} />
        <MixSection />
        <GenreSection title="Afrobeats" genre="afrobeats" />
        <GenreSection title="Amapiano" genre="amapiano" />
        <GenreSection title="Gospel" genre="gospel" />
        <GenreSection title="Hip Hop" genre="hip hop" />
      </div>
    </div>
  );
}

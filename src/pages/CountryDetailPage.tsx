import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { getCountry } from "@/lib/music/curated-artists";
import { searchCuratedArtists } from "@/lib/music/curated-search";

export default function CountryDetailPage() {
  const { countryId } = useParams();
  const country = getCountry(countryId || "");
  const [filter, setFilter] = useState("");

  const artists = useMemo(() => {
    if (!country) return [];
    const q = filter.trim();
    if (!q) return country.artists;

    const hits = searchCuratedArtists(q, 100)
      .filter((h) => h.countryId === country.id)
      .map((h) => h.name);

    if (hits.length) return hits;

    const lower = q.toLowerCase();
    return country.artists.filter((a) => a.toLowerCase().includes(lower));
  }, [country, filter]);

  if (!country) {
    return (
      <div className="px-6 pt-10 space-y-3">
        <p className="text-foreground font-semibold">Country not found</p>
        <Link to="/countries" className="text-sm text-primary underline">
          Back to countries
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36 px-6 pt-6">
      <Link to="/countries" className="text-sm text-muted-foreground hover:text-foreground">
        ← All countries
      </Link>
      <div className="mt-4 mb-6">
        <h1 className="text-3xl font-extrabold text-foreground">
          {country.flag} {country.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{country.blurb}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {country.artists.length} artists · Tap a name to play their catalog
        </p>
      </div>

      <div className="relative mb-6 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Filter ${country.name} artists (e.g. Kizz, Olamide)...`}
          className="w-full pl-9 pr-4 py-2.5 rounded-full bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {artists.map((name) => (
          <Link
            key={name}
            to={`/discover/${encodeURIComponent(name)}`}
            className="rounded-lg px-4 py-3 bg-card hover:bg-card-hover border border-border/60 text-sm font-medium text-foreground transition-colors"
          >
            {name}
          </Link>
        ))}
      </div>

      {!artists.length && (
        <p className="text-sm text-muted-foreground mt-6">No artists match that filter.</p>
      )}
    </div>
  );
}

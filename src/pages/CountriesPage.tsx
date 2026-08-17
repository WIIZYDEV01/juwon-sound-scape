import { Link } from "react-router-dom";
import { curatedCountries, type CuratedCountryId } from "@/lib/music/curated-artists";

const countryAccent: Partial<Record<CuratedCountryId, string>> = {
  nigeria: "from-green-600/40",
  ghana: "from-amber-600/40",
  south_africa: "from-yellow-600/35",
  usa: "from-blue-600/35",
  uk: "from-indigo-600/35",
  india: "from-orange-600/40",
  south_korea: "from-pink-600/35",
  china: "from-red-600/35",
  japan: "from-rose-600/30",
  gospel: "from-violet-600/40",
  djs: "from-cyan-600/35",
};

export default function CountriesPage() {
  return (
    <div className="min-h-screen pb-36 px-4 sm:px-6 pt-6">
      <h1 className="text-3xl font-extrabold text-foreground mb-2">Browse by Country</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Choose a country or category, open an artist, and play tracks from the live catalog.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {curatedCountries.map((country) => (
          <Link
            key={country.id}
            to={`/countries/${country.id}`}
            className={`relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors p-6 bg-gradient-to-br ${
              countryAccent[country.id] || "from-secondary/40"
            } to-card`}
          >
            <div className="text-4xl mb-4">{country.flag}</div>
            <h2 className="text-xl font-bold text-foreground">{country.name}</h2>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{country.blurb}</p>
            <p className="text-xs font-semibold text-primary mt-4">
              {country.artists.length} artists →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

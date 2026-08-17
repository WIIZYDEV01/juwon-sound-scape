import { Link } from "react-router-dom";
import type { MusicArtist } from "@/lib/music";

export default function ArtistCard({ artist }: { artist: MusicArtist }) {
  return (
    <Link
      to={`/artist/${encodeURIComponent(artist.id)}`}
      className="group block rounded-lg p-3 bg-card hover:bg-card-hover transition-colors"
    >
      <div className="relative mb-3">
        <img
          src={
            artist.imageUrl ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
          }
          alt={artist.name}
          className="w-full aspect-square object-cover rounded-full shadow-lg"
        />
      </div>
      <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary">
        {artist.name}
        {artist.isVerified ? " ✓" : ""}
      </p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {artist.trackCount ? `${artist.trackCount} tracks` : "Artist"}
      </p>
    </Link>
  );
}

import { Link } from "react-router-dom";
import type { MusicAlbum } from "@/lib/music";

export default function AlbumCard({ album }: { album: MusicAlbum }) {
  return (
    <Link
      to={`/album/${encodeURIComponent(album.id)}`}
      className="group block rounded-lg p-3 bg-card hover:bg-card-hover transition-colors"
    >
      <img
        src={
          album.artworkUrl ||
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
        }
        alt={album.title}
        className="w-full aspect-square object-cover rounded-md shadow-lg mb-3"
      />
      <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary">
        {album.title}
      </p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {album.artistName}
        {album.trackCount ? ` · ${album.trackCount} tracks` : ""}
      </p>
    </Link>
  );
}

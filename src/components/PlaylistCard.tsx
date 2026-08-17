import { Link } from "react-router-dom";
import type { MusicPlaylist } from "@/lib/music";

export default function PlaylistCard({
  playlist,
  toPrefix = "/album",
}: {
  playlist: MusicPlaylist;
  toPrefix?: string;
}) {
  const id = playlist.isAlbum
    ? playlist.id.replace("audius-playlist-", "audius-album-")
    : playlist.id;
  const isFullMix =
    playlist.id.includes("mixtrack-") ||
    Boolean(playlist.description?.toLowerCase().includes("full mix"));

  return (
    <Link
      to={`${toPrefix}/${encodeURIComponent(id)}`}
      className="group block rounded-lg p-3 bg-card hover:bg-card-hover transition-colors"
    >
      <img
        src={
          playlist.artworkUrl ||
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
        }
        alt={playlist.title}
        className="w-full aspect-square object-cover rounded-md shadow-lg mb-3"
        loading="lazy"
      />
      <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary">
        {playlist.title}
      </p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {playlist.ownerName || "Mix"}
        {isFullMix
          ? playlist.description
            ? ` · ${playlist.description}`
            : " · Full mix"
          : playlist.trackCount
            ? ` · ${playlist.trackCount} tracks`
            : ""}
      </p>
    </Link>
  );
}

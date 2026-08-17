import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SpotifyConnectButton from "@/components/SpotifyConnectButton";

const OWNER_NAME = "Adeyemi Juwon Timileyin";

function welcomeName(user: { email?: string | null; user_metadata?: { full_name?: string } } | null) {
  const meta = user?.user_metadata?.full_name?.trim();
  if (meta && !/adeyemistephen102/i.test(meta)) return meta;
  if (user) return OWNER_NAME;
  return "there";
}

export default function TopNav() {
  const { user, signOut } = useAuth();
  const name = welcomeName(user);

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-5 pb-3">
      <div>
        <p className="text-xs text-muted-foreground">Welcome back</p>
        <h2 className="text-lg font-bold text-foreground truncate max-w-[280px] sm:max-w-md">
          {name}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-card-hover px-3 sm:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search artists & songs</span>
        </Link>
        <Link
          to="/countries"
          className="hidden sm:inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Countries
        </Link>
        <SpotifyConnectButton />
        {user && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full bg-secondary px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

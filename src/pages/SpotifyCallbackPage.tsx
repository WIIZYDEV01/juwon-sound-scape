import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeSpotifyCode } from "@/lib/spotify";
import { Loader2 } from "lucide-react";

export default function SpotifyCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const authError = params.get("error");

    if (authError) {
      setError(authError);
      return;
    }

    if (!code) {
      setError("Missing authorization code");
      return;
    }

    exchangeSpotifyCode(code)
      .then(() => navigate("/search", { replace: true }))
      .catch((err: Error) => setError(err.message || "Spotify login failed"));
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-3 max-w-sm">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Spotify connection failed</h1>
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              If Spotify says Web API is blocked, upgrade that Spotify account to Premium, then try again.
            </p>
            <button
              className="text-primary underline text-sm"
              onClick={() => navigate("/search")}
            >
              Back to Search
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Connecting Spotify…</p>
          </>
        )}
      </div>
    </div>
  );
}

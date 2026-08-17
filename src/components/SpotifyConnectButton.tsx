import { useState } from "react";
import {
  clearSpotifySession,
  getSpotifyAccessToken,
  isSpotifyConfigured,
  startSpotifyLogin,
} from "@/lib/spotify";
import { Button } from "@/components/ui/button";

export default function SpotifyConnectButton() {
  const [connected, setConnected] = useState(() => Boolean(getSpotifyAccessToken()));

  if (!isSpotifyConfigured()) return null;

  if (connected) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => {
          clearSpotifySession();
          setConnected(false);
        }}
      >
        Spotify connected
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className="rounded-full"
      onClick={() => void startSpotifyLogin()}
    >
      Connect Spotify
    </Button>
  );
}

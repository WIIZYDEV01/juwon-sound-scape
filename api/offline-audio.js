export const config = { runtime: "edge" };

const ALLOWED_AUDIO_HOSTS = [
  "dzcdn.net",
  "deezer.com",
  "audius.co",
  "audius.io",
  "archive.org",
  "jamendo.com",
];

function isAllowedAudioUrl(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      ALLOWED_AUDIO_HOSTS.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`)
      )
    ) {
      return true;
    }
    if (
      host.includes("audius") ||
      host.includes("creatornode") ||
      host.includes("dn1.") ||
      host.includes("discoveryprovider")
    ) {
      return true;
    }
    return /\/v1\/tracks\/[^/]+\/stream/i.test(url.pathname);
  } catch {
    return false;
  }
}

function refererFor(raw) {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.includes("deezer") || host.includes("dzcdn")) return "https://www.deezer.com/";
    if (host.includes("jamendo")) return "https://www.jamendo.com/";
    if (host.includes("archive")) return "https://archive.org/";
    return "https://audius.co/";
  } catch {
    return "https://audius.co/";
  }
}

export default async function handler(request) {
  const raw = new URL(request.url).searchParams.get("u") || "";
  if (!isAllowedAudioUrl(raw)) {
    return new Response("Blocked", { status: 400 });
  }

  try {
    const upstream = await fetch(raw, {
      redirect: "follow",
      headers: {
        Accept: "audio/mpeg,audio/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: refererFor(raw),
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream failed", { status: upstream.status || 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}

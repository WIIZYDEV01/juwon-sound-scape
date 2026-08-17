export interface Song {
  id: string;
  title: string;
  artist: string;
  artistAvatar: string;
  cover: string;
  duration: number;
  plays: number;
  lyrics?: string;
}

export interface Playlist {
  id: string;
  name: string;
  cover: string;
  songCount: number;
  creator: string;
}

export interface Genre {
  id: string;
  name: string;
  colorClass: string;
}

const covers = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1446057032654-9d8885db76c6?w=300&h=300&fit=crop",
];

const avatars = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
];

const artists = ["Kojo Vibes", "Amara Soul", "DJ Phantom", "Luna Wave", "Blaze King", "Nova Star", "Echo Mind", "Rhythm X"];

export const trendingSongs: Song[] = Array.from({ length: 8 }, (_, i) => ({
  id: `trending-${i}`,
  title: ["Midnight Groove", "Electric Soul", "Urban Pulse", "Golden Hour", "Neon Dreams", "Fire Walk", "Ocean Breeze", "Star Light"][i],
  artist: artists[i % artists.length],
  artistAvatar: avatars[i % avatars.length],
  cover: covers[i % covers.length],
  duration: 180 + Math.floor(Math.random() * 120),
  plays: Math.floor(Math.random() * 5000000) + 100000,
  lyrics: "♪ Feel the rhythm in your soul\nLet the music take control\nEvery beat a story told\nIn the night, we're bold and gold ♪",
}));

export const newReleases: Song[] = Array.from({ length: 8 }, (_, i) => ({
  id: `new-${i}`,
  title: ["Fresh Start", "Dawn Chorus", "City Lights", "Velvet Night", "Sonic Bloom", "Crystal Clear", "Wild Heart", "Deep Blue"][i],
  artist: artists[(i + 3) % artists.length],
  artistAvatar: avatars[(i + 1) % avatars.length],
  cover: covers[(i + 4) % covers.length],
  duration: 200 + Math.floor(Math.random() * 100),
  plays: Math.floor(Math.random() * 1000000) + 50000,
  lyrics: "♪ A new dawn breaks the silence\nMusic flows like a river\nEvery note a new beginning\nFeel alive, feel the shimmer ♪",
}));

export const recommendedSongs: Song[] = Array.from({ length: 8 }, (_, i) => ({
  id: `rec-${i}`,
  title: ["Chill Mode", "Bass Drop", "Sunset Ride", "Cloud Nine", "Echoes", "Afterglow", "Moonwalk", "Bounce Back"][i],
  artist: artists[(i + 5) % artists.length],
  artistAvatar: avatars[(i + 2) % avatars.length],
  cover: covers[(i + 2) % covers.length],
  duration: 190 + Math.floor(Math.random() * 110),
  plays: Math.floor(Math.random() * 3000000) + 200000,
  lyrics: "♪ Floating through the atmosphere\nEvery sound so crystal clear\nLet the bass line pull you near\nThis is music, have no fear ♪",
}));

export const genres: Genre[] = [
  { id: "afrobeats", name: "Afrobeats", colorClass: "bg-genre-1" },
  { id: "amapiano", name: "Amapiano", colorClass: "bg-genre-2" },
  { id: "naija", name: "Naija Mix", colorClass: "bg-genre-3" },
  { id: "hiphop", name: "Hip Hop", colorClass: "bg-genre-4" },
  { id: "gospel", name: "Gospel", colorClass: "bg-genre-5" },
  { id: "rnb", name: "R&B", colorClass: "bg-genre-6" },
  { id: "jazz", name: "Jazz", colorClass: "bg-genre-7" },
  { id: "edm", name: "EDM", colorClass: "bg-genre-8" },
  { id: "pop", name: "Pop", colorClass: "bg-genre-1" },
  { id: "classical", name: "Classical", colorClass: "bg-genre-2" },
  { id: "oldschool", name: "Old School", colorClass: "bg-genre-3" },
  { id: "highlife", name: "Highlife", colorClass: "bg-genre-4" },
];

export const featuredPlaylists: Playlist[] = [
  { id: "p1", name: "Today's Hits", cover: covers[0], songCount: 50, creator: "De Soundwave" },
  { id: "p2", name: "Afro Vibes", cover: covers[1], songCount: 35, creator: "De Soundwave" },
  { id: "p3", name: "Chill Lounge", cover: covers[2], songCount: 28, creator: "De Soundwave" },
  { id: "p4", name: "Workout Energy", cover: covers[3], songCount: 42, creator: "De Soundwave" },
];

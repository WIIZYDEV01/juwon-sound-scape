export interface Song {
  id: string;
  title: string;
  artist_name: string;
  uploaded_by: string;
  cover_url: string | null;
  audio_url: string;
  duration: number;
  plays: number;
  genre: string | null;
  lyrics: string | null;
  created_at: string;
}

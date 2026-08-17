import { useState, useRef } from "react";
import { Upload, Music, Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const genres = ["Afrobeats", "Hip Hop", "Gospel", "Pop", "R&B", "Jazz", "EDM", "Classical", "Other"];

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [genre, setGenre] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Any signed-in user can upload; artist/admin roles remain for future permissions
  if (!user) {
    return (
      <div className="min-h-screen pb-36 px-6 pt-6 flex flex-col items-center justify-center">
        <Music className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to upload</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Create an account or log in to upload your music to De Soundwave.
        </p>
      </div>
    );
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener("loadedmetadata", () => {
        resolve(Math.floor(audio.duration));
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !user) return;

    setUploading(true);
    try {
      const duration = await getAudioDuration(audioFile);
      const timestamp = Date.now();

      // Upload audio
      const audioPath = `${user.id}/${timestamp}-${audioFile.name}`;
      const { error: audioError } = await supabase.storage.from("audio").upload(audioPath, audioFile);
      if (audioError) throw audioError;

      const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);

      // Upload cover if provided
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverPath = `${user.id}/${timestamp}-${coverFile.name}`;
        const { error: coverError } = await supabase.storage.from("covers").upload(coverPath, coverFile);
        if (coverError) throw coverError;
        const { data: coverUrlData } = supabase.storage.from("covers").getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      // Insert song record
      const { error: insertError } = await supabase.from("songs").insert({
        title,
        artist_name: artistName || user.email || "Unknown Artist",
        uploaded_by: user.id,
        audio_url: audioUrlData.publicUrl,
        cover_url: coverUrl,
        duration,
        genre: genre || null,
        lyrics: lyrics || null,
      });
      if (insertError) throw insertError;

      toast.success("Song uploaded successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-36 px-6 pt-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Upload Music</h1>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {/* Cover art */}
        <div
          onClick={() => coverInputRef.current?.click()}
          className="w-48 h-48 rounded-lg bg-secondary flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors overflow-hidden"
        >
          {coverPreview ? (
            <img src={coverPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              <Image className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Add Cover Art</span>
            </>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Song Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter song title"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Artist Name</label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Artist or band name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select genre</option>
            {genres.map((g) => (
              <option key={g} value={g.toLowerCase()}>{g}</option>
            ))}
          </select>
        </div>

        {/* Audio file */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Audio File *</label>
          <div
            onClick={() => audioInputRef.current?.click()}
            className="w-full px-4 py-6 rounded-lg bg-secondary border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center transition-colors"
          >
            <Upload className="w-6 h-6 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {audioFile ? audioFile.name : "Click to upload MP3, WAV, or M4A"}
            </span>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Lyrics (optional)</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Paste song lyrics here..."
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !audioFile || !title}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Song
            </>
          )}
        </button>
      </form>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Music2, PlusCircle, Upload } from "lucide-react";
import TopNav from "@/components/TopNav";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6 max-w-xl">
        <div className="flex items-center gap-3 mb-2">
          <PlusCircle className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Create</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Share your sound with the De Soundwave community.
        </p>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Upload a track</h2>
          <p className="text-sm text-muted-foreground">
            Add audio, cover art, genre, and lyrics. Your release appears in the catalog
            once processing finishes.
          </p>
          <Button asChild className="gap-2">
            <Link to="/upload">
              <Music2 className="w-4 h-4" />
              Go to Upload
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

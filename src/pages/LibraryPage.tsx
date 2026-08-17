import { Link } from "react-router-dom";
import { Clock, Download, Heart, Library } from "lucide-react";
import TopNav from "@/components/TopNav";

const shortcuts = [
  {
    to: "/downloads",
    icon: Download,
    title: "Downloads",
    description: "Saved on this phone — play without data",
  },
  {
    to: "/liked",
    icon: Heart,
    title: "Liked Songs",
    description: "Tracks you've hearted while listening",
  },
  {
    to: "/recent",
    icon: Clock,
    title: "Recently Played",
    description: "Pick up where you left off",
  },
];

export default function LibraryPage() {
  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Library className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Library</h1>
            <p className="text-sm text-muted-foreground">
              Shortcuts to music you've saved and played
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:bg-card-hover transition-colors"
            >
              <div className="w-12 h-12 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadModalProps {
  onClose: () => void;
}

export default function DownloadModal({ onClose }: DownloadModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-labelledby="download-modal-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <h2 id="download-modal-title" className="text-xl font-bold text-foreground">
            Downloads are Premium
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Free accounts can stream music, but downloading tracks requires a Premium
            plan. Upgrade to save songs offline and enjoy higher-quality audio.
          </p>
          {/* TODO: wire real payment / checkout when billing is ready */}
          <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
            <Button asChild className="flex-1">
              <Link to="/premium" onClick={onClose}>
                Upgrade to Premium
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

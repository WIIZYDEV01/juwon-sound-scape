import { Link } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import TopNav from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSubscription, isPremium } from "@/hooks/useSubscription";

const freeFeatures = [
  "Stream the full catalog",
  "Like songs and build your library",
  "Browse by country and artist",
];

const premiumFeatures = [
  "Download tracks for offline listening",
  "Higher-quality audio",
  "Ad-free experience",
  "Early access to new releases",
];

export default function PremiumPage() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription(user?.id);
  const premium = isPremium(subscription);

  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">De Soundwave Premium</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Unlock downloads and a richer listening experience.
        </p>

        {premium && (
          <div className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
            You're on Premium. Enjoy offline downloads and exclusive perks.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Free</h2>
            <p className="text-2xl font-bold text-foreground">
              $0<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <ul className="space-y-2">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-primary/50 bg-card p-6 space-y-4 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]">
            <h2 className="text-lg font-semibold text-foreground">Premium</h2>
            <p className="text-2xl font-bold text-foreground">
              $4.99<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <ul className="space-y-2">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {/* TODO: integrate Stripe / payment provider checkout */}
            <Button className="w-full" disabled={premium}>
              {premium ? "Current plan" : "Upgrade (coming soon)"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Payment checkout is not wired yet. Contact support or check back soon.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Prefer to create?{" "}
          <Link to="/upload" className="text-primary hover:underline">
            Upload your music
          </Link>
        </p>
      </div>
    </div>
  );
}

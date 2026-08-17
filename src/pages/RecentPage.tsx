import { Clock } from "lucide-react";
import TopNav from "@/components/TopNav";
import SongSection from "@/components/SongSection";
import { useAuth } from "@/context/AuthContext";
import { usePlayHistory } from "@/hooks/useSongs";

export default function RecentPage() {
  const { user } = useAuth();
  const { data = [], isLoading, isError, refetch } = usePlayHistory(user?.id);

  return (
    <div className="min-h-screen pb-36">
      <TopNav />
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recently Played</h1>
            <p className="text-sm text-muted-foreground">Your latest listening history</p>
          </div>
        </div>

        <SongSection
          title="Jump back in"
          songs={data}
          loading={isLoading}
          error={isError}
          onRetry={() => void refetch()}
          emptyMessage="Nothing played yet. Start listening and your history will show up here."
        />
      </div>
    </div>
  );
}

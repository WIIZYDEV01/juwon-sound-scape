import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import AppSidebar from "@/components/AppSidebar";
import BottomNav from "@/components/BottomNav";
import MusicPlayer from "@/components/MusicPlayer";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import LibraryPage from "@/pages/LibraryPage";
import DownloadsPage from "@/pages/DownloadsPage";
import PremiumPage from "@/pages/PremiumPage";
import CreatePage from "@/pages/CreatePage";
import UploadPage from "@/pages/UploadPage";
import LikedSongsPage from "@/pages/LikedSongsPage";
import RecentPage from "@/pages/RecentPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SpotifyCallbackPage from "@/pages/SpotifyCallbackPage";
import ArtistPage from "@/pages/ArtistPage";
import AlbumPage from "@/pages/AlbumPage";
import CountriesPage from "@/pages/CountriesPage";
import CountryDetailPage from "@/pages/CountryDetailPage";
import ArtistDiscoverPage from "@/pages/ArtistDiscoverPage";
import NotFound from "@/pages/NotFound";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PlayerProvider>
      <div className="app-shell flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/countries/:countryId" element={<CountryDetailPage />} />
            <Route path="/discover/:artistName" element={<ArtistDiscoverPage />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
            <Route path="/album/:albumId" element={<AlbumPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/liked" element={<LikedSongsPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
        <MusicPlayer />
      </div>
    </PlayerProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AmbientBackdrop />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/callback" element={<SpotifyCallbackPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <div className="auth-panel w-full max-w-sm space-y-8 rounded-2xl p-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size={64} to={null} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password</Label>
            <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

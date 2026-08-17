import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <div className="auth-panel w-full max-w-sm space-y-8 rounded-2xl p-8">        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size={64} to={null} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
            <Link to="/login"><Button variant="outline">Back to Login</Button></Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">{error}</div>
            )}
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

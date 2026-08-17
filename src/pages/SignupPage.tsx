import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase returns a user with no identities when the email is already registered
    if (data.user?.identities?.length === 0) {
      setError("An account with this email already exists. Please log in.");
      setLoading(false);
      return;
    }

    // Email confirmation disabled → session is returned immediately
    if (data.session) {
      navigate("/");
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-4">
        <div className="auth-panel w-full max-w-sm text-center space-y-4 rounded-2xl p-8">          <BrandLogo size={64} to={null} className="justify-center" />
          <h2 className="text-xl font-bold text-foreground">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link to="/login">
            <Button variant="outline" className="mt-4">Back to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-4">
      <div className="auth-panel w-full max-w-sm space-y-8 rounded-2xl p-8">        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size={64} to={null} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sign up for De Soundwave</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Display Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

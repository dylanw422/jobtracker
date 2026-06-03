import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import { Input } from "@jobtracker/ui/components/input";
import { Label } from "@jobtracker/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Briefcase, User } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const navigate = useNavigate();

  React.useEffect(() => {
    const stored = localStorage.getItem("user_session");
    if (stored) navigate({ to: "/" });
  }, [navigate]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-2">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Job Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Welcome back — sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-md text-sm font-medium transition-all ${
                mode === m
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <LoginForm onSuccess={() => navigate({ to: "/" })} />
        ) : (
          <SignupForm onSuccess={() => navigate({ to: "/" })} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const userResult = useQuery(
    api.users.getByUsername,
    username.trim() ? { username: username.trim() } : "skip"
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      if (userResult === undefined) {
        toast.error("Please wait...");
        return;
      }
      if (!userResult) {
        toast.error("Username not found. Please sign up first.");
        return;
      }
      localStorage.setItem(
        "user_session",
        JSON.stringify({
          userId: userResult._id,
          username: userResult.username,
          firstName: userResult.firstName,
          lastName: userResult.lastName,
        })
      );
      toast.success(`Welcome back, ${userResult.firstName}!`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium">
          Username
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            className="pl-9 h-11"
            required
            autoFocus
            autoComplete="username"
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-11 font-semibold" disabled={loading || !username.trim()}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const register = useMutation(api.users.register);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !username.trim()) return;
    setLoading(true);
    try {
      const userId = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
      });
      localStorage.setItem(
        "user_session",
        JSON.stringify({
          userId,
          username: username.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      );
      toast.success(`Welcome, ${firstName}!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className="h-11"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            className="h-11"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupUsername" className="text-sm font-medium">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signupUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            className="pl-9 h-11"
            required
            autoComplete="username"
          />
        </div>
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores.</p>
      </div>
      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={loading || !firstName.trim() || !lastName.trim() || !username.trim()}
      >
        {loading ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}

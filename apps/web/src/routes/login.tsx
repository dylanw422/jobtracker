import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import { Input } from "@jobtracker/ui/components/input";
import { Label } from "@jobtracker/ui/components/label";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Briefcase, Lock } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [password, setPassword] = React.useState("");
  const navigate = useNavigate();
  const correctPassword = useQuery(api.settings.getPassword);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (correctPassword === undefined) {
      toast.error("Please wait, loading settings...");
      return;
    }

    if (password === correctPassword) {
      localStorage.setItem("admin_session", "true");
      toast.success("Logged in as admin");
      navigate({ to: "/admin" });
    } else {
      toast.error("Incorrect password");
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-2">
            <Briefcase className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Management Portal</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access the admin dashboard.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 h-11"
                required
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-11 font-semibold">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Not an admin?{" "}
          <Link to="/" className="text-primary hover:underline underline-offset-4">
            Back to daily entry
          </Link>
        </p>
      </div>
    </div>
  );
}

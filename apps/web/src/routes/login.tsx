import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@jobtracker/ui/components/card";
import { Input } from "@jobtracker/ui/components/input";
import { Label } from "@jobtracker/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
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
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Enter the admin password to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

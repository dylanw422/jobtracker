import { api } from "@jobtracker/backend/convex/_generated/api";
import { Button } from "@jobtracker/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@jobtracker/ui/components/card";
import { Input } from "@jobtracker/ui/components/input";
import { Label } from "@jobtracker/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import * as React from "react";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin-settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  
  const navigate = useNavigate();
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_session") === "true";
  const storedPassword = useQuery(api.settings.getPassword);
  const updatePasswordMutation = useMutation(api.settings.updatePassword);

  React.useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPassword !== storedPassword) {
      toast.error("Current password incorrect");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }

    try {
      await updatePasswordMutation({ newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to update password");
      console.error(error);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Button 
        variant="ghost" 
        className="mb-6 gap-2" 
        onClick={() => navigate({ to: "/admin" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="border-none shadow-xl ring-1 ring-foreground/5">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4 text-primary">
            <Shield className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Security Settings</CardTitle>
          <CardDescription>
            Update your administrator password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>
            
            <div className="h-px bg-foreground/5 my-2" />

            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-bold shadow-md hover:shadow-lg transition-all">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

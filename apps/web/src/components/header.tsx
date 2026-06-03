import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Briefcase, LogOut } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import * as React from "react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState<{ firstName: string; lastName: string; username: string } | null>(null);
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_session") === "true";

  React.useEffect(() => {
    const stored = localStorage.getItem("user_session");
    setUser(stored ? JSON.parse(stored) : null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("clock_in_time");
    setUser(null);
    navigate({ to: "/auth" });
  };

  const links = isAdmin
    ? [{ to: "/admin", label: "Dashboard" }]
    : user
    ? [{ to: "/", label: "Daily Entry" }]
    : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            to={isAdmin ? "/admin" : user ? "/" : "/auth"}
            className="flex items-center gap-2 font-bold text-foreground"
          >
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-sm">Job Tracker</span>
          </Link>
          <nav className="flex items-center gap-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground font-semibold" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wide ring-1 ring-primary/20">
              Admin
            </span>
          )}
          {!isAdmin && user && (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

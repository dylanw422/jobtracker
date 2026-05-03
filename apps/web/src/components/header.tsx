import { Link } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_session") === "true";

  const links = isAdmin
    ? [{ to: "/admin", label: "Dashboard" }]
    : [{ to: "/", label: "Daily Entry" }];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 font-bold text-foreground">
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
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

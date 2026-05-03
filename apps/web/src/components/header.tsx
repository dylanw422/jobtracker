import { Link } from "@tanstack/react-router";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("admin_session") === "true";
  
  const links = isAdmin 
    ? [{ to: "/admin", label: "Dashboard" }]
    : [{ to: "/", label: "Daily Entry" }];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <nav className="flex items-center gap-6">
          {links.map(({ to, label }) => {
            return (
              <Link 
                key={to} 
                to={to}
                className="text-sm font-bold transition-colors hover:text-primary active:scale-95"
                activeProps={{
                  className: "text-primary underline underline-offset-4 decoration-2",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-tighter ring-1 ring-primary/20 mr-2">
              Admin Mode
            </span>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

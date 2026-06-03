import { Toaster } from "@jobtracker/ui/components/sonner";
import { HeadContent, Outlet, createRootRouteWithContext, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "Job Tracker" },
      { name: "description", content: "Daily job tracking for employees" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
});

// ─── Manifest + PWA meta switcher ────────────────────────────────────────────

const ADMIN_PATHS = ["/login", "/admin", "/admin-settings"];

function ManifestSwitcher() {
  const location = useLocation();

  React.useEffect(() => {
    const isAdmin = ADMIN_PATHS.some((p) => location.pathname.startsWith(p));

    const manifest = isAdmin ? "/manifest-admin.json" : "/manifest-worker.json";
    const icon = isAdmin ? "/icon-admin.svg" : "/icon-worker.svg";
    const title = isAdmin ? "Admin" : "Job Tracker";
    const themeColor = isAdmin ? "#b91c1c" : "#6d28d9";

    // <link rel="manifest">
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifest;

    // <link rel="apple-touch-icon">
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = icon;

    // <meta name="apple-mobile-web-app-title">
    let appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = title;

    // <meta name="theme-color">
    let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.name = "theme-color";
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = themeColor;

    document.title = isAdmin ? "Admin" : "Job Tracker";
  }, [location.pathname]);

  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <ManifestSwitcher />
        <div className="grid grid-rows-[auto_1fr] h-svh">
          <Header />
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}

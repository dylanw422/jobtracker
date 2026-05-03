import { env } from "@jobtracker/env/web";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import ReactDOM from "react-dom/client";
import React from "react";

import { routeTree } from "./routeTree.gen";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: {},
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}

import { useEffect, useState } from "react";
import { StoreProvider } from "./lib/store";
import { registerServiceWorker } from "./lib/pwa";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";

registerServiceWorker();

type Route = "home" | "app";

function currentRoute(): Route {
  return window.location.hash.startsWith("#/app") ? "app" : "home";
}

export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const on = () => {
      setRoute(currentRoute());
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (route === "app" || !hash || hash === "#/") {
      window.scrollTo({ top: 0 });
    } else {
      // Preserve section links, including the ZIP export, on the landing page.
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    }
  }, [route]);

  return <StoreProvider>{route === "app" ? <Shell /> : <Landing />}</StoreProvider>;
}

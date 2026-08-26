"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PREFIX = "abr-agro-";
const DELAY = 900;

function snapshot() {
  const state: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;

    const value = localStorage.getItem(key);
    if (value !== null) state[key] = value;
  }

  return state;
}

function restore(state: Record<string, string>) {
  const remove: string[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) remove.push(key);
  }

  remove.forEach((key) => localStorage.removeItem(key));
  Object.entries(state).forEach(([key, value]) =>
    localStorage.setItem(key, value),
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(pathname === "/login");

  useEffect(() => {
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    let alive = true;
    let timer: number | undefined;
    let installed = false;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    const schedule = () => {
      if (timer) window.clearTimeout(timer);

      timer = window.setTimeout(async () => {
        try {
          await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ state: snapshot() }),
          });
        } catch (error) {
          console.error("[ABR] cloud sync", error);
        }
      }, DELAY);
    };

    async function boot() {
      try {
        const response = await fetch("/api/state", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.ok) {
          const data = (await response.json()) as {
            existe: boolean;
            state?: Record<string, string>;
          };

          if (data.existe) {
            restore(data.state ?? {});
          } else {
            await fetch("/api/state", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ state: snapshot() }),
            });
          }

          Storage.prototype.setItem = function (key, value) {
            originalSetItem.call(this, key, value);
            if (key.startsWith(PREFIX)) schedule();
          };

          Storage.prototype.removeItem = function (key) {
            originalRemoveItem.call(this, key);
            if (key.startsWith(PREFIX)) schedule();
          };

          installed = true;
        }
      } catch (error) {
        console.error("[ABR] cloud boot", error);
      } finally {
        if (alive) setReady(true);
      }
    }

    void boot();

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);

      if (installed) {
        Storage.prototype.setItem = originalSetItem;
        Storage.prototype.removeItem = originalRemoveItem;
      }
    };
  }, [pathname]);

  if (!ready) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0d0e0d",
          color: "rgba(255,255,255,.55)",
          fontSize: 12,
        }}
      >
        Sincronizando dados...
      </main>
    );
  }

  return children;
}

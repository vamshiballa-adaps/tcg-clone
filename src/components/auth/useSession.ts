"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";

// undefined: not known yet. null: nobody is signed in. Asked of /api/auth/session after the page has loaded, because
// the session cookie is httpOnly and pages do not read it (see that route).
export function useSession(): SessionUser | null | undefined {
  const [session, setSession] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: SessionUser | null }) => {
        if (!cancelled) setSession(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}

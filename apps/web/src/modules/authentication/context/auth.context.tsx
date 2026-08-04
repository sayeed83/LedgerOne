"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as authenticationService from "@/services/authentication.service";
import { registerUnauthorizedHandler, setAccessToken as setStoredAccessToken } from "@/services/api-client";
import { useRefreshToken } from "../hooks/use-refresh-token";

// Ahead of the 15-minute access-token expiry (AUTHN-002), per the spec's
// "every 10-14 minutes" guidance (spec §8, Performance Considerations).
const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  mfaChallengeToken: string | null;
  setMfaChallengeToken: (token: string | null) => void;
  completeLogin: (accessToken: string) => void;
  signOut: () => Promise<void>;
}

// FSEC-004/SESS-001: the access token lives only in this in-memory context
// state — never localStorage/sessionStorage. The refresh token is an
// httpOnly cookie this code never reads.
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const refreshTokenMutation = useRefreshToken();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyAccessToken = useCallback((accessToken: string) => {
    setStoredAccessToken(accessToken);
    setIsAuthenticated(true);
  }, []);

  const clearSession = useCallback(() => {
    setStoredAccessToken(null);
    setIsAuthenticated(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleSessionExpired = useCallback(() => {
    clearSession();
    router.push("/session-expired");
  }, [clearSession, router]);

  useEffect(() => {
    registerUnauthorizedHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  useEffect(() => {
    // Silent-refresh on mount: an existing refresh-token cookie hydrates
    // the session across a page reload without re-entering credentials.
    refreshTokenMutation.mutate(undefined, {
      onSuccess: (data) => applyAccessToken(data.accessToken),
      onSettled: () => setIsInitializing(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    intervalRef.current = setInterval(() => {
      refreshTokenMutation.mutate(undefined, {
        onSuccess: (data) => applyAccessToken(data.accessToken),
      });
    }, SILENT_REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const completeLogin = useCallback(
    (accessToken: string) => {
      setMfaChallengeToken(null);
      applyAccessToken(accessToken);
    },
    [applyAccessToken],
  );

  const signOut = useCallback(async () => {
    try {
      await authenticationService.logout();
    } catch {
      // Logout is treated as best-effort client-side: even if the server
      // call fails (e.g. already-revoked token), the local session clears.
    } finally {
      clearSession();
      router.push("/login");
    }
  }, [clearSession, router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        mfaChallengeToken,
        setMfaChallengeToken,
        completeLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

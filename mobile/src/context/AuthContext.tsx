import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "../lib/services";
import {
  clearToken,
  clearUser,
  loadToken,
  loadUser,
  saveToken,
  saveUser,
} from "../lib/storage";
import { ApiError, NetworkError } from "../lib/api";
import type { ApiUser } from "../types";

export interface SessionUser extends ApiUser {
  /** Cached name used on the home screen greeting. */
  displayName: string;
}

interface AuthContextValue {
  ready: boolean;
  token: string | null;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: SessionUser | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSessionUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as ApiUser;
  const name =
    u.preferred_name?.trim() ||
    u.full_name?.trim() ||
    u.username ||
    "Friend";
  return { ...u, displayName: name };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<SessionUser | null>(null);

  const setUser = useCallback((u: SessionUser | null) => setUserState(u), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedToken = await loadToken();
      const storedUser = toSessionUser(await loadUser());
      if (!storedToken) {
        if (!cancelled) {
          setUserState(null);
          setReady(true);
        }
        return;
      }
      setToken(storedToken);
      if (storedUser) setUserState(storedUser);
      try {
        const profile = await auth.me(storedToken);
        const merged = toSessionUser(profile);
        if (merged) {
          setUserState(merged);
          await saveUser(merged);
        } else {
          setUserState(storedUser);
        }
      } catch (e: unknown) {
        if (e instanceof ApiError) {
          // Invalid/expired token: clear the session.
          await clearToken();
          await clearUser();
          setUserState(null);
        }
        // NetworkError: keep the cached session for offline browsing.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await auth.login(email, password);
    await saveToken(res.access_token);
    const su = toSessionUser(res.user);
    await saveUser(su ?? res.user);
    setToken(res.access_token);
    setUserState(su);
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      username: string;
      password: string;
      full_name?: string;
    }) => {
      const res = await auth.register(input);
      await saveToken(res.access_token);
      const su = toSessionUser(res.user);
      await saveUser(su ?? res.user);
      setToken(res.access_token);
      setUserState(su);
    },
    []
  );

  const logout = useCallback(async () => {
    const t = token;
    setToken(null);
    setUserState(null);
    await Promise.allSettled([clearToken(), clearUser()]);
    if (t) {
      try {
        await auth.logout(t);
      } catch {
        // No-op; the local session is already cleared.
      }
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await auth.me(token);
      const merged = toSessionUser(profile);
      if (merged) {
        setUserState(merged);
        await saveUser(merged);
      }
    } catch (e) {
      if (e instanceof NetworkError) return;
      if (e instanceof ApiError) {
        setToken(null);
        setUserState(null);
        await Promise.allSettled([clearToken(), clearUser()]);
      }
    }
  }, [token]);

  const value = useMemo(
    () => ({ ready, token, user, login, register, logout, setUser, refreshProfile }),
    [ready, token, user, login, register, logout, setUser, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { User } from "../types/account";
import {
  setAuthToken,
  signup as apiSignup,
  login as apiLogin,
  fetchMe
} from "../api/client";

type AuthValue = {
  user: User | null;
  ready: boolean; // finished hydrating from localStorage
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
const TOKEN_KEY = "medireport_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // Rehydrate a saved session on load.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setReady(true);
      return;
    }
    setAuthToken(token);
    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      })
      .finally(() => setReady(true));
  }, []);

  function persist(token: string, u: User) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(u);
  }

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const res = await apiLogin(email, password);
        persist(res.token, res.user);
      },
      signup: async (name, email, password) => {
        const res = await apiSignup(name, email, password);
        persist(res.token, res.user);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setUser(null);
      }
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

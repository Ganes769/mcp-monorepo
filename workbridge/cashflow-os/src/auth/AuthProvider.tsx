import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { isXeroConnected, markSignedIn, startXeroLogin } from "@/api/auth";
import { clearAuthSession, readAuthSession } from "@/api/session";
import { useXeroStatus } from "@/hooks/useXero";
import { team } from "@/data/settings";

interface AuthContextValue {
  isAuthenticated: boolean;
  hasSession: boolean;
  xeroConnected: boolean;
  isLoading: boolean;
  connecting: boolean;
  login: () => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  establishSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const statusQuery = useXeroStatus();
  const [hasSession, setHasSession] = useState(readAuthSession);
  const [connecting, setConnecting] = useState(false);

  const xeroConnected = isXeroConnected(statusQuery.data);

  const establishSession = useCallback(() => {
    markSignedIn();
    setHasSession(true);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setHasSession(false);
    setConnecting(false);
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const normalised = email.trim().toLowerCase();
      const known = team.some(
        (member) => member.email.toLowerCase() === normalised,
      );
      if (!known || password.length < 8) {
        throw new Error("Incorrect email or password.");
      }
      establishSession();
      toast.success("Signed in");
      return true;
    },
    [establishSession],
  );

  const login = useCallback(async () => {
    setConnecting(true);
    try {
      await startXeroLogin();
      return true;
    } catch (error) {
      setConnecting(false);
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: hasSession || readAuthSession(),
      hasSession,
      xeroConnected,
      isLoading: false,
      connecting,
      login,
      loginWithEmail,
      logout,
      establishSession,
    }),
    [
      connecting,
      establishSession,
      hasSession,
      login,
      loginWithEmail,
      logout,
      statusQuery.data,
      statusQuery.isLoading,
      xeroConnected,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

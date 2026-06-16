import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi, setTokens, loadTokens, saveTokens, onUnauthorized } from "../lib/api";

type User = {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  gender?: string | null;
  role: string;
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  signIn: (phone: string, otp: string) => Promise<"existing" | "new">;
  signOut: () => void;
  continueAsGuest: () => void;
  completeProfile: (data: { name: string; email?: string; gender?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  signIn: async () => "new",
  signOut: () => {},
  continueAsGuest: () => {},
  completeProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle session expiry
  onUnauthorized(() => {
    setUser(null);
    saveTokens(null);
  });

  // On mount, restore session from stored tokens
  useEffect(() => {
    (async () => {
      try {
        const tokens = await loadTokens();
        if (tokens) {
          setTokens(tokens);
          const profile = await authApi.getProfile();
          setUser(profile);
        }
      } catch {
        await saveTokens(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (phone: string, _otp: string) => {
    setIsLoading(true);
    try {
      // With DEV_BYPASS_FIREBASE=true on backend, any token works
      const mockFirebaseToken = `mock-phone-${phone}`;
      const result = await authApi.login(mockFirebaseToken);

      await saveTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      setUser(result.user);

      // If user has no name, they haven't completed onboarding
      if (!result.user.name) return "new";
      return "existing";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeProfile = useCallback(async (data: { name: string; email?: string; gender?: string }) => {
    setIsLoading(true);
    try {
      const updated = await authApi.updateProfile(data);
      setUser((prev) => (prev ? { ...prev, ...updated } : prev));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIsGuest(false);
    saveTokens(null);
    setTokens(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGuest,
        isLoading,
        signIn,
        signOut,
        continueAsGuest,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

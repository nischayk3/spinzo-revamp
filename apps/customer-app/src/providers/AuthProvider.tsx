import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "expo-router";

type User = {
  uid: string;
  phone: string;
} | null;

type AuthContextType = {
  user: User;
  /** True if fully authenticated (logged in with phone+OTP) */
  isAuthenticated: boolean;
  /** True if browsing as guest (can see home, but not orders/cart) */
  isGuest: boolean;
  isLoading: boolean;
  /**
   * Sign in with phone + OTP.
   * If user exists → sets user, returns "existing"
   * If new user → sets user, returns "new" (caller navigates to create-account)
   */
  signIn: (phone: string, otp: string) => Promise<"existing" | "new">;
  signOut: () => void;
  /** Continue as guest (no auth, limited access) */
  continueAsGuest: () => void;
  /** Complete profile creation for new users */
  completeProfile: (name: string, email?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false,
  signIn: async () => "new",
  signOut: () => {},
  continueAsGuest: () => {},
  completeProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Firebase OTP verification + gateway check
      // For now: simulate — odd UIDs are "new users"
      await new Promise((r) => setTimeout(r, 800));
      const uid = `user_${Date.now()}`;
      const isNewUser = phone.endsWith("99"); // demo: numbers ending in 99 = new
      setUser({ uid, phone });
      return isNewUser ? "new" : "existing";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeProfile = useCallback(async (name: string) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      // Profile saved — user is now fully onboarded
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setIsGuest(false);
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

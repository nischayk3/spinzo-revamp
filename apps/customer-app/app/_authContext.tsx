import { createContext, useContext, ReactNode } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: { uid: string; phone: string } | null;
  isLoading: boolean;
  signIn: (phone: string, otp: string) => Promise<"existing" | "new">;
  signOut: () => void;
  continueAsGuest: () => void;
  completeProfile: (name: string, email?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isGuest: false,
  user: null,
  isLoading: false,
  signIn: async () => "new",
  signOut: () => {},
  continueAsGuest: () => {},
  completeProfile: async () => {},
});

export function AuthContextProvider({ children, value }: { children: ReactNode; value: AuthContextType }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

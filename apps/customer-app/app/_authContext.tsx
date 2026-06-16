import { createContext, useContext, ReactNode } from "react";

type User = {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  gender?: string | null;
  role: string;
} | null;

type AuthContextType = {
  isAuthenticated: boolean;
  isGuest: boolean;
  user: User;
  isLoading: boolean;
  signIn: (phone: string, otp: string) => Promise<"existing" | "new">;
  signOut: () => void;
  continueAsGuest: () => void;
  completeProfile: (data: { name: string; email?: string; gender?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isGuest: false,
  user: null,
  isLoading: true,
  signIn: async () => "new",
  signOut: () => {},
  continueAsGuest: () => {},
  completeProfile: async () => {},
});

export function AuthContextProvider({ children, value }: { children: ReactNode; value: AuthContextType }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

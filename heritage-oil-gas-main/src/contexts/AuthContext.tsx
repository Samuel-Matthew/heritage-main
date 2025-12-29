import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";

export type UserRole = "super_admin" | "store_owner" | "buyer";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user on component mount (refresh persistence)
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await api.get("/api/user");
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error: any) {
      // Silently fail if not authenticated (401 is expected for non-authenticated users)
      if (error?.response?.status !== 401) {
        console.error("Error fetching user:", error);
      }
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      // First, get CSRF cookie from Sanctum
      console.log("[AUTH] Getting CSRF cookie...");
      await api.get("/sanctum/csrf-cookie");
      console.log("[AUTH] CSRF cookie obtained");

      // Then make login request
      console.log("[AUTH] Sending login request with:", { email, password });
      const response = await api.post("/api/login", { email, password });
      console.log("[AUTH] Login response received:", {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });

      const userData = response.data?.user;
      console.log("[AUTH] Extracted userData:", userData);

      if (!userData) {
        console.error("[AUTH] ERROR: User data is missing from response");
        console.error("[AUTH] Response data structure:", response.data);
        throw new Error("User data not found in response");
      }

      if (!userData.id || !userData.email) {
        console.error("[AUTH] ERROR: User data is incomplete", userData);
        throw new Error("Incomplete user data in response");
      }

      console.log("[AUTH] Login successful, setting user state");
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error: any) {
      console.error("[AUTH] Login error:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        fullError: error,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/api/logout");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

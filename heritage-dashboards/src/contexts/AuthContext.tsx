import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";

export type UserRole = "super_admin" | "store_owner" | "buyer";

export interface Subscription {
  id: number;
  plan_id: number;
  plan_name: string;
  plan_display_name: string;
  product_limit: number;
  status: string;
  starts_at: string;
  ends_at: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  subscription?: Subscription | null;
  verification_status?: string;
  profile_image_path?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  fetchStoreSubscription: () => Promise<Subscription | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize CSRF token on app load
  useEffect(() => {
    const initializeCsrfToken = async () => {
      try {
        // This request will trigger the XSRF-TOKEN cookie to be set
        await api.get("/api/user");
      } catch (error) {
        // Ignore errors, we just need the cookie to be set
      }
    };

    initializeCsrfToken();
  }, []);

  // Fetch user on component mount
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async (): Promise<AuthUser | null> => {
    try {
      const response = await api.get("/api/user");
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);

      // Fetch store subscription for non-admin users
      if (userData.role === "store_owner") {
        const subscription = await fetchStoreSubscription();
        setUser((prevUser) =>
          prevUser ? { ...prevUser, subscription } : null
        );
        // Fetch store data including verification status
        await fetchStoreData();
      }

      return userData;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreSubscription = async (): Promise<Subscription | null> => {
    try {
      const response = await api.get("/api/my-store");
      return response.data.active_subscription || null;
    } catch (error) {
      return null;
    }
  };

  const fetchStoreData = async (): Promise<void> => {
    try {
      const response = await api.get("/api/my-store");
      const storeData = response.data;
      if (storeData && storeData.status) {
        setUser((prevUser) =>
          prevUser
            ? {
                ...prevUser,
                verification_status: storeData.status,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to fetch store data:", error);
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
        fetchUser,
        logout,
        fetchStoreSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

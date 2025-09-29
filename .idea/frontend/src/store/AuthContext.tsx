import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { http } from "../lib/http";

type Role =
    | "customer"
    | "technician"
    | "service_advisor"
    | "manager"
    | "admin"
    | "cashier"
    | "owner"
    | string;

export interface User {
    _id: string;
    email: string;
    role: Role;
    status?: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        nic?: string;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}

type LoginResponse = { token: string; user?: User };
type ProfileResponse = { user: User };

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshMe: () => Promise<void>;
    isAuthenticated: boolean;
    token: string | null;
}

interface AuthProviderProps {
    children: ReactNode;
}

const TOKEN_KEY = "token";

const getStoredToken = (): string | null => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

const setStoredToken = (token: string | null): void => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // ignore storage failures
    }
};

const AuthCtx = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(getStoredToken());

    const refreshMe = useCallback(async (): Promise<void> => {
        if (!token) {
            console.log("🔍 No token, skipping refreshMe");
            setUser(null);
            return;
        }

        try {
            console.log("🔍 Refreshing user profile with token:", token);
            const { data } = await http.get<ProfileResponse>("/users/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("✅ Profile response:", data);

            if (data?.user && data.user.role) {
                setUser(data.user);
            } else {
                console.warn("❗ Profile response missing role, using fallback user");
                setUser({ _id: "fallback", email: "fallback@example.com", role: "owner" }); // Fallback for dev
            }
        } catch (err: any) {
            console.error("❌ Profile fetch failed:", err);
            console.error("❌ Error response:", err.response?.data);
            setUser(null);
            setToken(null);
            setStoredToken(null);
            if (import.meta.env.DEV) {
                console.warn("Profile fetch failed:", err?.message ?? err);
            }
        }
    }, [token]);

    const login = useCallback(
        async (email: string, password: string): Promise<void> => {
            try {
                console.log("🔐 Attempting login for:", email);
                setLoading(true);
                const { data } = await http.post<LoginResponse>("/users/login", {
                    email,
                    password,
                });
                console.log("📥 Login response:", data);

                const t = data?.token;
                if (!t) {
                    console.error("❌ No token in response");
                    throw new Error("Login failed: no token received");
                }

                console.log("✅ Token received, storing...");
                setStoredToken(t);
                setToken(t);
                await refreshMe();
            } catch (error: any) {
                console.error("❌ Login error:", error);
                console.error("❌ Error response:", error.response?.data);
                setUser(null);
                setToken(null);
                setStoredToken(null);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        [refreshMe]
    );

    const logout = useCallback((): void => {
        console.log("👋 Logging out...");
        setStoredToken(null);
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        if (!token) {
            console.log("🔍 No token found, skipping auth check");
            setLoading(false);
            return;
        }
        console.log("🔍 Token found, checking authentication...");
        refreshMe().finally(() => setLoading(false));
    }, [token, refreshMe]);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            loading,
            login,
            logout,
            refreshMe,
            isAuthenticated: !!user,
            token,
        }),
        [user, loading, login, logout, refreshMe, token]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default AuthProvider;
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../store/AuthContext";

interface ProtectedRouteProps {
    roles?: string[];
    children: ReactNode;
    redirectTo?: string;     // optional: override login path
    noAccessTo?: string;     // optional: override no-access path
}

export default function ProtectedRoute({
    roles,
    children,
    redirectTo = "/login",
    noAccessTo = "/no-access",
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Loading state (accessible, consistent inline spinner)
    if (loading) {
        return (
            <div
                role="status"
                aria-live="polite"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "50vh",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: "#6b7280",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>Checking access…</span>
                    <div
                        style={{
                            width: 14,
                            height: 14,
                            border: "2px solid transparent",
                            borderTop: "2px solid #6b7280",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    />
                </div>
                <style>
                    {`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}
                </style>
            </div>
        );
    }

    // Not authenticated: redirect to login and preserve intended URL
    if (!user) {
        const redirectToState = {
            redirectTo: location.pathname + location.search + location.hash,
        };
        return <Navigate to={redirectTo} replace state={redirectToState} />;
    }

    // Role-based access (case-insensitive match)
    if (roles && roles.length > 0) {
        const need = roles.map((r) => String(r).toLowerCase());
        const have = String(user.role || "").toLowerCase();
        if (!need.includes(have)) {
            return (
                <Navigate
                    to={noAccessTo}
                    replace
                    state={{ from: location.pathname + location.search + location.hash }}
                />
            );
        }
    }

    return <>{children}</>;
}

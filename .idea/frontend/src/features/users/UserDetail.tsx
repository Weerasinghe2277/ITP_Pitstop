// src/features/users/UserDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../../lib/http";

export default function UserDetail() {
    const { id } = useParams();
    const [u, setU] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get(`/users/${id}`);
                if (!cancelled) setU(r.data?.user || null);
            } catch (e) {
                if (!cancelled) setMsg({ text: e.message || "Failed to load user", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [id]); // Load on id change with cleanup to avoid state updates after unmount [web:71].

    const wrap = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const headerRow = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "12px",
        flexWrap: "wrap",
    };
    const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };
    const row = { display: "flex" };
    const label = { flex: 1, color: "#6b7280" };
    const value = { flex: 2, fontWeight: 500 };
    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #e5e7eb",
    };

    function fmtDate(d) {
        if (!d) return "—";
        try {
            return new Date(d).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
            });
        } catch {
            return "—";
        }
    } // Locale-aware date rendering using toLocaleDateString for readable metadata [web:188].

    if (isLoading) {
        return (
            <div style={wrap}>
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading user…</span>
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
                    {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                </style>
            </div>
        ); // Simple loading card with inline styles for consistency [web:18].
    }

    if (!u) {
        return (
            <div style={wrap}>
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                    }}
                >
                    {msg.text || "User not found"}
                </div>
                <Link
                    to="/users"
                    style={{
                        padding: "10px 14px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "1px solid #2563eb",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    Back to Users
                </Link>
            </div>
        ); // Error state with a clear back action, styled inline for parity with other screens [web:18].
    }

    const fullName = [
        u.profile?.firstName || "",
        u.profile?.lastName || "",
    ]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(" ");

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>{u.userId || u._id}</h1>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link
                        to="/users"
                        style={{
                            padding: "10px 14px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "1px solid #2563eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Back
                    </Link>
                </div>
            </div>

            {/* Message */}
            {msg.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: msg.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {msg.text}
                </div>
            ) /* Inline message styling consistent with other redesigned pages [web:18]. */}

            {/* User info */}
            <div style={card}>
                <h2 style={sectionTitle}>User Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={row}>
                        <span style={label}>Email:</span>
                        <span style={value}>{u.email || "—"}</span>
                    </div>
                    <div style={row}>
                        <span style={label}>Name:</span>
                        <span style={value}>{fullName || u.profile?.displayName || "—"}</span>
                    </div>
                    <div style={row}>
                        <span style={label}>Role:</span>
                        <span style={value}>{u.role || "—"}</span>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div style={card}>
                <h2 style={sectionTitle}>Metadata</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={row}>
                        <span style={label}>Created:</span>
                        <span style={value}>{fmtDate(u.createdAt)}</span>
                    </div>
                    <div style={row}>
                        <span style={label}>Updated:</span>
                        <span style={value}>{fmtDate(u.updatedAt)}</span>
                    </div>
                    {u.lastLogin && (
                        <div style={row}>
                            <span style={label}>Last Login:</span>
                            <span style={value}>
                {new Date(u.lastLogin).toLocaleString()}
              </span>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
        </div>
    ); // Inline style prop usage keeps presentation local and consistent with prior updates [web:18].
}

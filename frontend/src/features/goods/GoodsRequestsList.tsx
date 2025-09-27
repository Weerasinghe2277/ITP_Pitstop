// src/features/goods/GoodsRequestsList.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";

export default function GoodsRequestsList({ mode }) {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });

    const path = mode === "pending" ? "/goods-requests/pending" : "/goods-requests/my-requests";

    async function load() {
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            const r = await http.get(path);
            setRows(r.data?.requests || []);
        } catch (e) {
            setMsg({ text: e.message || "Failed to load goods requests", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get(path);
                if (!cancelled) setRows(r.data?.requests || []);
            } catch (e) {
                if (!cancelled) setMsg({ text: e.message || "Failed to load goods requests", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [path]); // Load on path change with a cancellation guard to avoid setState after unmount [web:69].

    async function act(id, action) {
        const seg = action === "approve" ? "approve" : action === "reject" ? "reject" : "release";
        const label = seg[0].toUpperCase() + seg.slice(1);
        const ok = window.confirm(`${label} this request?`);
        if (!ok) return;
        try {
            setMsg({ text: "", type: "" });
            await http.patch(`/goods-requests/${id}/${seg}`);
            setMsg({ text: `Request ${label.toLowerCase()}d successfully`, type: "success" });
            await load();
        } catch (e) {
            setMsg({ text: e.message || `Failed to ${label.toLowerCase()} request`, type: "error" });
        }
    }

    // Styles
    const wrap = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };
    const refreshBtn = {
        padding: "10px 14px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "1px solid #4b5563",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const tableWrap = { overflowX: "auto" };
    const tableStyle = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
    const thStyle = {
        textAlign: "left",
        padding: "12px",
        fontSize: "12px",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 1,
    };
    const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px", verticalAlign: "top" };
    const pill = (bg, color, border) => ({
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
    });
    const approveBtn = {
        padding: "8px 12px",
        backgroundColor: "#10b981",
        color: "white",
        border: "1px solid #059669",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const rejectBtn = {
        padding: "8px 12px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "1px solid #b91c1c",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const releaseBtn = {
        padding: "8px 12px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Goods Requests {mode === "pending" ? "(Pending)" : "(Mine)"}</h1>
                <button type="button" onClick={load} style={refreshBtn}>Refresh</button>
            </div>

            {/* Message (polite live region) */}
            {msg.text && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: msg.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {msg.text}
                </div>
            ) /* Live regions are appropriate for advisory updates that shouldn't interrupt focus [web:155][web:163]. */}

            {/* Loading */}
            {isLoading && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading requests…</span>
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
            ) /* Simple inline spinner card to indicate progress consistent with other screens [web:69]. */}

            {/* Table */}
            {!isLoading && (
                <div style={{ ...card, padding: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="Goods requests">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Goods requests
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Request</th>
                                <th scope="col" style={thStyle}>Job</th>
                                <th scope="col" style={thStyle}>Created</th>
                                <th scope="col" style={thStyle}>Status</th>
                                {mode === "pending" && <th scope="col" style={thStyle}></th>}
                            </tr>
                            </thead>
                            <tbody>
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={mode === "pending" ? 5 : 4} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                        No goods requests
                                    </td>
                                </tr>
                            )}
                            {rows.map((x) => {
                                const s = String(x.status || "").toLowerCase();
                                const badge =
                                    s === "approved"
                                        ? pill("#f0fdf4", "#166534", "#bbf7d0")
                                        : s === "rejected"
                                            ? pill("#fef2f2", "#991b1b", "#fecaca")
                                            : s === "released"
                                                ? pill("#eff6ff", "#1d4ed8", "#bfdbfe")
                                                : pill("#fffbeb", "#92400e", "#fde68a");
                                return (
                                    <tr key={x._id}>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 700, color: "#111827" }}>{x.requestId || x._id}</span>
                                                <span style={{ color: "#6b7280", fontSize: 12 }}>
                            {Array.isArray(x.items) ? `${x.items.length} item${x.items.length === 1 ? "" : "s"}` : "—"}
                          </span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{x.job?.jobId || x.job || "—"}</td>
                                        <td style={tdStyle}>{x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}</td>
                                        <td style={tdStyle}>
                                            <span style={badge}>{x.status || "pending"}</span>
                                        </td>
                                        {mode === "pending" && (
                                            <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                                <button type="button" onClick={() => act(x._id, "approve")} style={approveBtn}>
                                                    Approve
                                                </button>
                                                <span style={{ display: "inline-block", width: 8 }} />
                                                <button type="button" onClick={() => act(x._id, "reject")} style={rejectBtn}>
                                                    Reject
                                                </button>
                                                <span style={{ display: "inline-block", width: 8 }} />
                                                <button type="button" onClick={() => act(x._id, "release")} style={releaseBtn}>
                                                    Release
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}

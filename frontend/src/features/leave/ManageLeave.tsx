// src/features/leave/ManageLeave.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";

export default function ManageLeave() {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [actingId, setActingId] = useState(null);

    async function load() {
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            const r = await http.get("/leave-requests");
            setRows(r.data?.requests || []);
        } catch (e) {
            setMsg({ text: e.message || "Failed to load leave requests", type: "error" });
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
                const r = await http.get("/leave-requests");
                if (!cancelled) setRows(r.data?.requests || []);
            } catch (e) {
                if (!cancelled) setMsg({ text: e.message || "Failed to load leave requests", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function act(id, type) {
        if (!id || !type) return;
        const pretty = type === "approve" ? "Approve" : "Reject";
        const ok = window.confirm(`${pretty} this request?`);
        if (!ok) return;
        setActingId(id);
        setMsg({ text: "", type: "" });
        try {
            await http.patch(`/leave-requests/${id}/${type}`);
            setMsg({ text: `Request ${pretty.toLowerCase()}d successfully`, type: "success" });
            await load();
        } catch (e) {
            setMsg({ text: e.message || `Failed to ${pretty.toLowerCase()} request`, type: "error" });
        } finally {
            setActingId(null);
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

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Leave Management</h1>
                <button type="button" onClick={load} style={refreshBtn}>Refresh</button>
            </div>

            {/* Message (live region) */}
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
            )}

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
            )}

            {/* Table */}
            {!isLoading && (
                <div style={{ ...card, padding: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="Leave requests">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Leave requests
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Request</th>
                                <th scope="col" style={thStyle}>Employee</th>
                                <th scope="col" style={thStyle}>Dates</th>
                                <th scope="col" style={thStyle}>Reason</th>
                                <th scope="col" style={thStyle}>Status</th>
                                <th scope="col" style={thStyle}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                        No leave requests
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
                                            : pill("#fffbeb", "#92400e", "#fde68a");
                                return (
                                    <tr key={x._id}>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 700, color: "#111827" }}>{x.requestId || x._id}</span>
                                                <span style={{ color: "#6b7280", fontSize: 12 }}>
                            {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : ""}
                          </span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            {x.employee?.profile?.firstName || x.employee?.name || x.employee?.email || "—"}
                                        </td>
                                        <td style={tdStyle}>
                                            {(x.startDate || x.endDate) ? (
                                                <span>
                            {x.startDate ? new Date(x.startDate).toLocaleDateString() : "—"} to{" "}
                                                    {x.endDate ? new Date(x.endDate).toLocaleDateString() : "—"}
                          </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td style={{ ...tdStyle, maxWidth: 360 }}>
                                            <span style={{ color: "#374151" }}>{x.reason || "—"}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={badge}>{x.status || "pending"}</span>
                                        </td>
                                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                            <button
                                                type="button"
                                                onClick={() => act(x._id, "approve")}
                                                disabled={actingId === x._id || s === "approved"}
                                                style={{ ...approveBtn, opacity: actingId === x._id || s === "approved" ? 0.6 : 1 }}
                                                aria-label={`Approve request ${x.requestId || ""}`}
                                            >
                                                Approve
                                            </button>
                                            <span style={{ display: "inline-block", width: 8 }} />
                                            <button
                                                type="button"
                                                onClick={() => act(x._id, "reject")}
                                                disabled={actingId === x._id || s === "rejected"}
                                                style={{ ...rejectBtn, opacity: actingId === x._id || s === "rejected" ? 0.6 : 1 }}
                                                aria-label={`Reject request ${x.requestId || ""}`}
                                            >
                                                Reject
                                            </button>
                                        </td>
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

// src/features/inventory/LowStock.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

export default function LowStock() {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get("/inventory/low-stock");
                if (!isCancelled) setRows(r.data?.items || []);
            } catch (e) {
                if (!isCancelled)
                    setMsg({ text: e.message || "Failed to load low stock items", type: "error" });
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, []);

    // Styles
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

    const actions = { display: "flex", gap: "12px", flexWrap: "wrap" };

    const btn = (bg, border) => ({
        padding: "10px 14px",
        backgroundColor: bg,
        color: "white",
        border: `1px solid ${border}`,
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
    });

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };

    const tableWrap = { overflowX: "auto" };

    const tableStyle = {
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
    };

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

    const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };

    const badge = (bg, color, border) => ({
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
    });

    function severity(it) {
        const min = Number(it?.minimumStock ?? 0);
        const cur = Number(it?.currentStock ?? 0);
        if (min <= 0) return { level: "unknown", percent: 1, shortage: 0 };
        const percent = Math.max(0, Math.min(1, cur / min));
        const level = percent < 0.25 ? "critical" : "low";
        return { level, percent, shortage: Math.max(0, min - cur) };
    }

    function meterBar(it) {
        const { percent, level } = severity(it);
        const min = Number(it?.minimumStock ?? 0);
        const cur = Number(it?.currentStock ?? 0);
        const color = level === "critical" ? "#ef4444" : "#f59e0b";
        return (
            <div
                role="meter"
                aria-valuemin={0}
                aria-valuemax={Math.max(0, min)}
                aria-valuenow={Math.max(0, Math.min(cur, Math.max(0, min)))}
                aria-label={`Stock level for ${it?.name ?? "item"}`}
                aria-valuetext={`${cur} of ${min} required`}
                style={{
                    width: 160,
                    height: 8,
                    background: "#f3f4f6",
                    borderRadius: 9999,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(percent * 100).toFixed(0)}%`,
                        background: color,
                    }}
                />
            </div>
        );
    }

    const sorted = [...rows].sort((a, b) => {
        const sa = severity(a);
        const sb = severity(b);
        if (sa.level === "critical" && sb.level !== "critical") return -1;
        if (sa.level !== "critical" && sb.level === "critical") return 1;
        if (sa.percent !== sb.percent) return sa.percent - sb.percent;
        return sb.shortage - sa.shortage;
    });

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Low Stock</h1>
                <div style={actions}>
                    <Link to="/inventory" style={btn("#3b82f6", "#2563eb")}>Back to Inventory</Link>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={btn("#6b7280", "#4b5563")}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Message */}
            {msg.text && (
                <div
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
                    <span>Loading low stock…</span>
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
                        <table style={tableStyle} aria-label="Low stock items">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Low stock items
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Item</th>
                                <th scope="col" style={thStyle}>Category</th>
                                <th scope="col" style={thStyle}>Stock</th>
                                <th scope="col" style={thStyle}>Min Required</th>
                                <th scope="col" style={thStyle}>Level</th>
                                <th scope="col" style={thStyle}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: "24px" }}>
                                        No low stock items
                                    </td>
                                </tr>
                            )}
                            {sorted.map((it) => {
                                const { level } = severity(it);
                                const badgeStyle =
                                    level === "critical"
                                        ? badge("#fef2f2", "#991b1b", "#fecaca")
                                        : badge("#fffbeb", "#92400e", "#fde68a");
                                return (
                                    <tr key={it._id}>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 700, color: "#111827" }}>
                            {it.itemId ? `${it.itemId} ` : ""}{it.name}
                          </span>
                                                <span style={{ color: "#6b7280", fontSize: 12 }}>
                            {it.unit ?? "—"}
                          </span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{it.category ?? "—"}</td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <span>{it.currentStock ?? "—"}</span>
                                                {meterBar(it)}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{it.minimumStock ?? "—"}</td>
                                        <td style={tdStyle}>
                        <span style={badgeStyle}>
                          {level === "critical" ? "Critical" : "Low"}
                        </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <Link
                                                to={`/inventory/${it._id}`}
                                                style={{
                                                    padding: "8px 12px",
                                                    backgroundColor: "#3b82f6",
                                                    color: "white",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                    border: "1px solid #2563eb",
                                                }}
                                            >
                                                Open
                                            </Link>
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

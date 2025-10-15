// src/features/inventory/LowStock.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

export default function LowStock() {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [filter, setFilter] = useState("all"); // all, critical, low

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get("/inventory/low-stock");
                if (!isCancelled) {
                    setRows(r.data?.items || []);
                    if (r.data?.items?.length === 0) {
                        setMsg({ text: "No low stock items found. All inventory levels are healthy!", type: "success" });
                    }
                }
            } catch (e) {
                if (!isCancelled) {
                    const errorMsg = e.response?.data?.message || e.message || "Failed to load low stock items";
                    setMsg({ text: errorMsg, type: "error" });
                }
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, []);

    // Calculate severity level for an item
    function severity(it) {
        const min = Number(it?.minimumStock ?? 0);
        const cur = Number(it?.currentStock ?? 0);

        if (min <= 0) return { level: "unknown", percent: 0, shortage: 0 };

        const percent = Math.max(0, Math.min(1, cur / min));
        const shortage = Math.max(0, min - cur);

        let level = "low";
        if (percent <= 0) level = "critical";
        else if (percent < 0.25) level = "critical";
        else if (percent < 0.5) level = "low";

        return { level, percent, shortage };
    }

    // Sort items by severity
    const sorted = [...rows].sort((a, b) => {
        const sa = severity(a);
        const sb = severity(b);

        // Critical items first
        if (sa.level === "critical" && sb.level !== "critical") return -1;
        if (sa.level !== "critical" && sb.level === "critical") return 1;

        // Then by percentage (lower percentage = more urgent)
        if (sa.percent !== sb.percent) return sa.percent - sb.percent;

        // Then by shortage amount
        return sb.shortage - sa.shortage;
    });

    // Apply filter
    const filtered = filter === "all"
        ? sorted
        : sorted.filter(it => severity(it).level === filter);

    // Count by severity
    const counts = sorted.reduce((acc, it) => {
        const level = severity(it).level;
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});

    // Meter bar component
    function meterBar(it) {
        const { percent, level } = severity(it);
        const min = Number(it?.minimumStock ?? 0);
        const cur = Number(it?.currentStock ?? 0);

        const color = level === "critical" ? "#ef4444" : "#f59e0b";
        const bgColor = level === "critical" ? "#fee2e2" : "#fef3c7";

        return (
            <div
                role="meter"
                aria-valuemin={0}
                aria-valuemax={Math.max(1, min)}
                aria-valuenow={Math.max(0, Math.min(cur, Math.max(1, min)))}
                aria-label={`Stock level for ${it?.name ?? "item"}`}
                aria-valuetext={`${cur} of ${min} minimum required`}
                style={{
                    width: 160,
                    height: 10,
                    background: bgColor,
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
                        width: `${Math.min(100, percent * 100).toFixed(0)}%`,
                        background: color,
                        transition: "width 0.3s ease",
                    }}
                />
            </div>
        );
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

    const title = {
        fontSize: "28px",
        fontWeight: 700,
        color: "#1f2937",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "12px"
    };

    const actions = { display: "flex", gap: "12px", flexWrap: "wrap" };

    const btn = (bg, border, color = "white") => ({
        padding: "10px 16px",
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
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
        fontWeight: 600,
    };

    const tdStyle = {
        padding: "12px",
        borderBottom: "1px solid #f3f4f6",
        fontSize: "14px",
        verticalAlign: "middle"
    };

    const badge = (bg, color, border) => ({
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
    });

    const filterBtn = (isActive) => ({
        ...btn(
            isActive ? "#3b82f6" : "#f3f4f6",
            isActive ? "#2563eb" : "#e5e7eb",
            isActive ? "white" : "#6b7280"
        ),
        padding: "8px 14px",
        fontSize: "13px",
    });

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>
                    <span>Low Stock Items</span>
                    {!isLoading && sorted.length > 0 && (
                        <span style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#6b7280",
                            background: "#fef2f2",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            border: "1px solid #fecaca"
                        }}>
                            {sorted.length}
                        </span>
                    )}
                </h1>
                <div style={actions}>
                    <Link to="/inventory" style={btn("#3b82f6", "#2563eb")}>
                        Back to Inventory
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        style={btn("#6b7280", "#4b5563")}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            {!isLoading && sorted.length > 0 && (
                <div style={{ ...card, padding: "12px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: 600 }}>Filter:</span>
                    <button
                        onClick={() => setFilter("all")}
                        style={filterBtn(filter === "all")}
                    >
                        All ({sorted.length})
                    </button>
                    <button
                        onClick={() => setFilter("critical")}
                        style={filterBtn(filter === "critical")}
                    >
                        Critical ({counts.critical || 0})
                    </button>
                    <button
                        onClick={() => setFilter("low")}
                        style={filterBtn(filter === "low")}
                    >
                        Low ({counts.low || 0})
                    </button>
                </div>
            )}

            {/* Message */}
            {msg.text && (
                <div
                    role="alert"
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: msg.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    <span style={{ fontSize: "18px" }}>
                        {msg.type === "error" ? "⚠️" : "✅"}
                    </span>
                    <span>{msg.text}</span>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={{
                    ...card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "#6b7280",
                    padding: "32px"
                }}>
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            border: "3px solid #e5e7eb",
                            borderTop: "3px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }}
                    />
                    <span style={{ fontSize: "15px", fontWeight: 500 }}>Loading low stock items...</span>
                </div>
            )}

            {/* Summary Cards */}
            {!isLoading && sorted.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}>
                    <div style={{
                        ...card,
                        background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                        borderColor: "#fecaca"
                    }}>
                        <div style={{ fontSize: "13px", color: "#991b1b", fontWeight: 600, marginBottom: "4px" }}>
                            CRITICAL
                        </div>
                        <div style={{ fontSize: "32px", fontWeight: 700, color: "#991b1b" }}>
                            {counts.critical || 0}
                        </div>
                        <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "4px" }}>
                            Requires immediate attention
                        </div>
                    </div>
                    <div style={{
                        ...card,
                        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                        borderColor: "#fde68a"
                    }}>
                        <div style={{ fontSize: "13px", color: "#92400e", fontWeight: 600, marginBottom: "4px" }}>
                            LOW STOCK
                        </div>
                        <div style={{ fontSize: "32px", fontWeight: 700, color: "#92400e" }}>
                            {counts.low || 0}
                        </div>
                        <div style={{ fontSize: "12px", color: "#92400e", marginTop: "4px" }}>
                            Needs restocking soon
                        </div>
                    </div>
                    <div style={{
                        ...card,
                        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                        borderColor: "#bfdbfe"
                    }}>
                        <div style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600, marginBottom: "4px" }}>
                            TOTAL ITEMS
                        </div>
                        <div style={{ fontSize: "32px", fontWeight: 700, color: "#1e40af" }}>
                            {sorted.length}
                        </div>
                        <div style={{ fontSize: "12px", color: "#1e40af", marginTop: "4px" }}>
                            Below minimum stock
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <div style={{ ...card, padding: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="Low stock items">
                            <caption style={{
                                position: "absolute",
                                left: "-10000px",
                                height: 0,
                                width: 0,
                                overflow: "hidden"
                            }}>
                                Low stock items requiring attention
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Item</th>
                                <th scope="col" style={thStyle}>Category</th>
                                <th scope="col" style={thStyle}>Current Stock</th>
                                <th scope="col" style={thStyle}>Min Required</th>
                                <th scope="col" style={thStyle}>Stock Level</th>
                                <th scope="col" style={thStyle}>Status</th>
                                <th scope="col" style={thStyle}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            ...tdStyle,
                                            color: "#6b7280",
                                            textAlign: "center",
                                            padding: "40px"
                                        }}
                                    >
                                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
                                        <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                                            {filter === "all"
                                                ? "No low stock items"
                                                : `No ${filter} items found`}
                                        </div>
                                        <div style={{ fontSize: "14px" }}>
                                            {filter !== "all" && "Try changing the filter"}
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((it, idx) => {
                                const { level, shortage } = severity(it);
                                const badgeStyle = level === "critical"
                                    ? badge("#fef2f2", "#991b1b", "#fecaca")
                                    : badge("#fffbeb", "#92400e", "#fde68a");

                                return (
                                    <tr
                                        key={it._id || idx}
                                        style={{
                                            backgroundColor: idx % 2 === 0 ? "white" : "#fafafa"
                                        }}
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <span style={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>
                                                        {it.name || "Unnamed Item"}
                                                    </span>
                                                {it.itemId && (
                                                    <span style={{ color: "#6b7280", fontSize: "12px", fontFamily: "monospace" }}>
                                                            {it.itemId}
                                                        </span>
                                                )}
                                                {it.partNumber && (
                                                    <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                                                            PN: {it.partNumber}
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                                <span style={{
                                                    display: "inline-block",
                                                    padding: "4px 8px",
                                                    background: "#f3f4f6",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    color: "#374151",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {it.category || "—"}
                                                </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <div style={{
                                                    fontSize: "16px",
                                                    fontWeight: 700,
                                                    color: level === "critical" ? "#991b1b" : "#92400e"
                                                }}>
                                                    {it.currentStock ?? 0} {it.unit || ""}
                                                </div>
                                                {meterBar(it)}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                                <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                                    {it.minimumStock ?? 0} {it.unit || ""}
                                                </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <span style={{
                                                        fontSize: "14px",
                                                        fontWeight: 600,
                                                        color: level === "critical" ? "#991b1b" : "#92400e"
                                                    }}>
                                                        {shortage > 0 ? `-${shortage}` : "0"} {it.unit || ""}
                                                    </span>
                                                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                                                        shortage
                                                    </span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                                <span style={badgeStyle}>
                                                    {level === "critical" ? "🔴 CRITICAL" : "⚠️ LOW"}
                                                </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <Link
                                                to={`/inventory/${it._id}`}
                                                style={{
                                                    display: "inline-block",
                                                    padding: "8px 14px",
                                                    backgroundColor: "#3b82f6",
                                                    color: "white",
                                                    borderRadius: "6px",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                    border: "1px solid #2563eb",
                                                    transition: "all 0.2s ease"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = "#2563eb";
                                                    e.target.style.transform = "translateY(-1px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = "#3b82f6";
                                                    e.target.style.transform = "translateY(0)";
                                                }}
                                            >
                                                View Details
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

            {/* Footer Info */}
            {!isLoading && sorted.length > 0 && (
                <div style={{
                    ...card,
                    background: "#f9fafb",
                    borderColor: "#e5e7eb",
                    padding: "12px 16px"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        color: "#6b7280"
                    }}>
                        <span>💡</span>
                        <span>
                            <strong>Tip:</strong> Critical items (shown in red) require immediate restocking.
                            Low items (shown in amber) should be restocked soon to avoid stockouts.
                        </span>
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    button:hover {
                        opacity: 0.9;
                    }
                    
                    button:active {
                        transform: scale(0.98);
                    }
                `}
            </style>
        </div>
    );
}
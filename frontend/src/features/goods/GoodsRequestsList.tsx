import { useEffect, useState } from "react";
import { http } from "../../lib/http";

export default function GoodsRequestsList({ mode }) {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [expandedRows, setExpandedRows] = useState(new Set());

    const path = mode === "pending" ? "/goods-requests/pending" : "/goods-requests/my-requests";

    async function load() {
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            console.log("Loading goods requests from:", path);
            const r = await http.get(path);
            console.log("Goods requests response:", r.data);
            const requests = mode === "pending"
                ? r.data?.pendingRequests || []
                : r.data?.goodsRequests || [];
            console.log("Setting goods requests:", requests);
            setRows(requests);
            if (requests.length === 0) {
                console.log("No goods requests found");
            }
        } catch (e) {
            console.error("Error loading goods requests:", e);
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
                console.log("Initial loading goods requests from:", path);
                const r = await http.get(path);
                console.log("Initial goods requests response:", r.data);
                if (!cancelled) {
                    const requests = mode === "pending"
                        ? r.data?.pendingRequests || []
                        : r.data?.goodsRequests || [];
                    console.log("Setting initial goods requests:", requests);
                    setRows(requests);
                }
            } catch (e) {
                console.error("Error in initial goods requests load:", e);
                if (!cancelled) setMsg({ text: e.message || "Failed to load goods requests", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [path, mode]);

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

    function toggleExpand(id) {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    }

    // Styles
    const wrap = {
        maxWidth: "1400px",
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
    const requestCard = {
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
        border: "1px solid #e5e7eb",
        transition: "box-shadow 0.2s",
    };
    const requestHeader = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
        gap: "16px",
        flexWrap: "wrap",
    };
    const pill = (bg, color, border) => ({
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
    });
    const infoGrid = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "16px",
    };
    const infoBox = {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    };
    const label = {
        fontSize: "12px",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 600,
    };
    const value = {
        fontSize: "14px",
        color: "#111827",
        fontWeight: 500,
    };
    const itemsSection = {
        marginTop: "16px",
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
    };
    const itemCard = {
        backgroundColor: "white",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "8px",
        border: "1px solid #e5e7eb",
    };
    const expandBtn = {
        padding: "8px 12px",
        backgroundColor: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const actionBtns = {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    };
    const approveBtn = {
        padding: "8px 16px",
        backgroundColor: "#10b981",
        color: "white",
        border: "1px solid #059669",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const rejectBtn = {
        padding: "8px 16px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "1px solid #b91c1c",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const releaseBtn = {
        padding: "8px 16px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
    };

    const formatDate = (dateStr) => {
        try {
            if (!dateStr) return "—";
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? "—" : date.toLocaleString();
        } catch (error) {
            console.error('Error formatting date:', error);
            return "—";
        }
    };

    const getStatusBadge = (status) => {
        const s = String(status || "").toLowerCase();
        if (s === "approved") return pill("#f0fdf4", "#166534", "#bbf7d0");
        if (s === "rejected") return pill("#fef2f2", "#991b1b", "#fecaca");
        if (s === "released") return pill("#eff6ff", "#1d4ed8", "#bfdbfe");
        return pill("#fffbeb", "#92400e", "#fde68a");
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Goods Requests {mode === "pending" ? "(Pending)" : "(Mine)"}</h1>
                <button type="button" onClick={load} style={refreshBtn}>Refresh</button>
            </div>

            {/* Message */}
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

            {/* Requests List */}
            {!isLoading && rows.length === 0 && (
                <div style={{ ...card, textAlign: "center", color: "#6b7280", padding: "48px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
                    <div style={{ fontSize: "18px", fontWeight: 600 }}>No goods requests found</div>
                    <div style={{ fontSize: "14px", marginTop: "8px" }}>Check back later or create a new request</div>
                </div>
            )}

            {!isLoading && rows.map((x) => {
                const isExpanded = expandedRows.has(x._id);
                return (
                    <div key={x._id} style={requestCard}>
                        {/* Request Header */}
                        <div style={requestHeader}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>
                                    {x.requestId || x._id}
                                </div>
                                <span style={getStatusBadge(x.status)}>{x.status || "pending"}</span>
                            </div>
                            {mode === "pending" && (
                                <div style={actionBtns}>
                                    <button type="button" onClick={() => act(x._id, "approve")} style={approveBtn}>
                                        Approve
                                    </button>
                                    <button type="button" onClick={() => act(x._id, "reject")} style={rejectBtn}>
                                        Reject
                                    </button>
                                    <button type="button" onClick={() => act(x._id, "release")} style={releaseBtn}>
                                        Release
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div style={infoGrid}>
                            <div style={infoBox}>
                                <div style={label}>Job ID</div>
                                <div style={value}>
                                    {x.job.jobId || 'N/A'}
                                </div>
                            </div>
                            <div style={infoBox}>
                                <div style={label}>Requested By</div>
                                <div style={value}>
                                    {x.requestedBy?.name || x.requestedBy?.email || x.requestedBy?._id || x.requestedBy || "—"}
                                </div>
                            </div>
                            <div style={infoBox}>
                                <div style={label}>Created At</div>
                                <div style={value}>{formatDate(x.createdAt)}</div>
                            </div>
                            <div style={infoBox}>
                                <div style={label}>Updated At</div>
                                <div style={value}>{formatDate(x.updatedAt)}</div>
                            </div>
                            <div style={infoBox}>
                                <div style={label}>Total Items</div>
                                <div style={value}>
                                    {x.quantity || 'N/A'}
                                </div>
                            </div>
                            <div style={infoBox}>
                                <div style={label}>Item Name</div>
                                <div style={value}>{x.item?.name || "—"}</div>
                            </div>
                        </div>

                        {/* Notes */}
                        {x.notes && (
                            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fffbeb", borderRadius: "6px", border: "1px solid #fde68a" }}>
                                <div style={{ ...label, marginBottom: "4px" }}>Notes</div>
                                <div style={{ fontSize: "14px", color: "#92400e" }}>{x.notes}</div>
                            </div>
                        )}

                        {/* Items Section */}
                        {Array.isArray(x.items) && x.items.length > 0 && (
                            <div style={itemsSection}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151" }}>
                                        Items ({x.items.length})
                                    </div>
                                    <button type="button" onClick={() => toggleExpand(x._id)} style={expandBtn}>
                                        {isExpanded ? "Hide Details" : "Show Details"}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div>
                                        {x.items.map((item, idx) => (
                                            <div key={item._id || idx} style={itemCard}>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                                                    <div>
                                                        <div style={{ ...label, marginBottom: "4px" }}>Item ID</div>
                                                        <div style={{ fontSize: "13px", color: "#111827", fontWeight: 600 }}>
                                                            {item.item?.name || item.item?.itemId || item.item?._id || item.item || "—"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ ...label, marginBottom: "4px" }}>Quantity</div>
                                                        <div style={{ fontSize: "13px", color: "#111827", fontWeight: 600 }}>
                                                            {item.quantity || 0}
                                                        </div>
                                                    </div>
                                                    <div style={{ gridColumn: "1 / -1" }}>
                                                        <div style={{ ...label, marginBottom: "4px" }}>Purpose</div>
                                                        <div style={{ fontSize: "13px", color: "#374151" }}>
                                                            {item.purpose || "—"}
                                                        </div>
                                                    </div>
                                                    {item._id && (
                                                        <div style={{ gridColumn: "1 / -1" }}>
                                                            <div style={{ ...label, marginBottom: "4px" }}>Item Record ID</div>
                                                            <div style={{ fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>
                                                                {item._id}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MongoDB IDs Section */}
                        {isExpanded && (
                            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                                <div style={{ ...label, marginBottom: "8px" }}>Database IDs</div>
                                <div style={{ display: "grid", gap: "8px" }}>
                                    <div>
                                        <span style={{ fontSize: "11px", color: "#6b7280", marginRight: "8px" }}>Request:</span>
                                        <span style={{ fontSize: "11px", color: "#111827", fontFamily: "monospace" }}>{x._id}</span>
                                    </div>
                                    {x.job?._id && (
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#6b7280", marginRight: "8px" }}>Job:</span>
                                            <span style={{ fontSize: "11px", color: "#111827", fontFamily: "monospace" }}>{x.job._id}</span>
                                        </div>
                                    )}
                                    {x.requestedBy?._id && (
                                        <div>
                                            <span style={{ fontSize: "11px", color: "#6b7280", marginRight: "8px" }}>User:</span>
                                            <span style={{ fontSize: "11px", color: "#111827", fontFamily: "monospace" }}>{x.requestedBy._id}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

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
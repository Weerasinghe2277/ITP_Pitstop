// src/features/inventory/InventoryList.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

export default function InventoryList() {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // Fetch data when debounced query changes
    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const path = debouncedQ
                    ? `/inventory/search?query=${encodeURIComponent(debouncedQ)}`
                    : "/inventory";
                const r = await http.get(path);
                if (!isCancelled) {
                    setRows(r.data?.items || []);
                    // Debug log to verify data (can be removed later)
                    console.log("Inventory data:", r.data?.items);
                }
            } catch (e) {
                if (!isCancelled) setMsg({ text: e.message || "Failed to load inventory", type: "error" });
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, [debouncedQ]);

    // Delete item function
    async function handleDelete(id) {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            await http.delete(`/inventory/${id}`);
            setRows((prev) => prev.filter((item) => item._id !== id));
            setMsg({ text: "Item deleted successfully", type: "success" });
        } catch (e) {
            setMsg({ text: e.message || "Failed to delete item", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    // Styles
    const container = {
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

    const actions = { display: "flex", gap: "12px", flexWrap: "wrap" };

    const primaryBtn = {
        padding: "10px 14px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
    };

    const secondaryBtn = {
        padding: "10px 14px",
        backgroundColor: "#10b981",
        color: "white",
        border: "1px solid #059669",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
    };

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };

    const searchWrap = { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" };

    const searchInput = {
        flex: 1,
        minWidth: 240,
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
        color: "#000000",
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

    const viewBtn = {
        padding: "8px 12px",
        backgroundColor: "#3b82f6",
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #2563eb",
        marginRight: "8px",
    };

    const editBtn = {
        padding: "8px 12px",
        backgroundColor: "#f59e0b",
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #d97706",
        marginRight: "8px",
    };

    const deleteBtn = {
        padding: "8px 12px",
        backgroundColor: "#ef4444",
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        border: "1px solid #dc2626",
        cursor: "pointer",
    };

    function fmtCurrency(n) {
        if (typeof n !== "number") return "—";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    return (
        <div style={container}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Inventory</h1>
                <div style={actions}>
                    <Link to="/inventory/new" style={primaryBtn}>Add Item</Link>
                    <Link to="/inventory/low" style={secondaryBtn}>Low Stock</Link>
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

            {/* Search */}
            <div style={card}>
                <div style={searchWrap}>
                    <input
                        placeholder="Search items, categories, or IDs"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={searchInput}
                        aria-label="Search inventory"
                    />
                    {isLoading && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280" }}>
                            <span>Loading…</span>
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
                </div>
            </div>

            {/* Table */}
            <div style={{ ...card, padding: 0 }}>
                <div style={tableWrap}>
                    <table style={tableStyle} aria-label="Inventory items">
                        <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                            Inventory items
                        </caption>
                        <thead>
                        <tr>
                            <th scope="col" style={thStyle}>Item</th>
                            <th scope="col" style={thStyle}>Category</th>
                            <th scope="col" style={thStyle}>Price</th>
                            <th scope="col" style={thStyle}>Stock</th>
                            <th scope="col" style={thStyle}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: "24px" }}>
                                    No items found
                                </td>
                            </tr>
                        )}
                        {rows.map((it) => (
                            <tr key={it._id}>
                                <td style={tdStyle}>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontWeight: 600, color: "#111827" }}>
                                            {it.itemId ? `${it.itemId} ` : ""}{it.name}
                                        </span>
                                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                                            {it.unit} • {fmtCurrency(it.unitPrice)}
                                        </span>
                                    </div>
                                </td>
                                <td style={tdStyle}>{it.category}</td>
                                <td style={tdStyle}>{fmtCurrency(it.unitPrice)}</td>
                                <td style={tdStyle}>{Number.isFinite(it.currentStock) ? it.currentStock : "—"}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Link to={`/inventory/${it._id}`} style={viewBtn}>View</Link>
                                        <Link to={`/inventory/${it._id}/edit`} style={editBtn}>Edit</Link>
                                        <button
                                            onClick={() => handleDelete(it._id)}
                                            style={deleteBtn}
                                            disabled={isLoading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
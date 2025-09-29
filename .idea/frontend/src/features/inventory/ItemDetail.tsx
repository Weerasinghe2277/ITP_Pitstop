// src/features/inventory/ItemDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";

export default function ItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [it, setIt] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get(`/inventory/${id}`);
                if (!isCancelled) setIt(r.data?.item || null);
            } catch (e) {
                if (!isCancelled) setMsg({ text: e.message || "Failed to load item", type: "error" });
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, [id]);

    async function handleDelete() {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            await http.delete(`/inventory/${id}`);
            setMsg({ text: "Item deleted successfully", type: "success" });
            setTimeout(() => navigate("/inventory"), 1000);
        } catch (e) {
            setMsg({ text: e.message || "Failed to delete item", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    function fmtCurrency(n) {
        if (typeof n !== "number") return "—";
        try {
            return n.toLocaleString("en-LK", {
                style: "currency",
                currency: "LKR",
                maximumFractionDigits: 2,
            });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    if (isLoading) {
        return (
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "50vh",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading item…</span>
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

    if (!it) {
        return (
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "20px",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
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
                    {msg.text || "Item not found"}
                </div>
                <Link
                    to="/inventory"
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
                    Back to Inventory
                </Link>
            </div>
        );
    }

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
        flexWrap: "wrap",
        gap: "12px",
    };

    const title = {
        fontSize: "28px",
        fontWeight: 700,
        color: "#1f2937",
        margin: 0,
    };

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
    };

    const grid = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginBottom: "24px",
    };

    const row = { display: "flex" };
    const label = { flex: 1, color: "#6b7280" };
    const value = { flex: 1, fontWeight: 500 };

    const backBtn = {
        padding: "10px 14px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
    };

    const addBtn = {
        padding: "10px 14px",
        backgroundColor: "#10b981",
        color: "white",
        border: "1px solid #059669",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
    };

    const editBtn = {
        padding: "10px 14px",
        backgroundColor: "#f59e0b",
        color: "white",
        border: "1px solid #d97706",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
    };

    const deleteBtn = {
        padding: "10px 14px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "1px solid #dc2626",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    };

    return (
        <div style={wrap}>
            <div style={headerRow}>
                <h1 style={title}>
                    {it.itemId ? `${it.itemId} - ` : ""}{it.name}
                </h1>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/inventory" style={backBtn}>
                        Back to Inventory
                    </Link>
                    <Link to="/inventory/new" style={addBtn}>
                        Add Item
                    </Link>
                    <Link to={`/inventory/${id}/edit`} style={editBtn}>
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        style={deleteBtn}
                        disabled={isLoading}
                    >
                        Delete
                    </button>
                </div>
            </div>

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
            )}

            <div style={grid}>
                <div style={card}>
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #e5e7eb",
                        }}
                    >
                        Item Information
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={row}>
                            <span style={label}>Name:</span>
                            <span style={value}>{it.name || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Item ID:</span>
                            <span style={value}>{it.itemId || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Category:</span>
                            <span style={value}>{it.category || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Unit:</span>
                            <span style={value}>{it.unit || "—"}</span>
                        </div>
                    </div>
                </div>

                <div style={card}>
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #e5e7eb",
                        }}
                    >
                        Stock & Pricing
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={row}>
                            <span style={label}>Unit Price:</span>
                            <span style={value}>{fmtCurrency(it.unitPrice)}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Current Stock:</span>
                            <span style={value}>{Number.isFinite(it.currentStock) ? it.currentStock : "—"}</span>
                        </div>
                        {"reorderLevel" in it && (
                            <div style={row}>
                                <span style={label}>Reorder Level:</span>
                                <span style={value}>{it.reorderLevel ?? "—"}</span>
                            </div>
                        )}
                        {"notes" in it && (
                            <div style={{ ...row, alignItems: "flex-start" }}>
                                <span style={label}>Notes:</span>
                                <span style={value}>{it.notes || "—"}</span>
                            </div>
                        )}
                    </div>
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
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
            setMsg({ text: "✅ Item deleted successfully", type: "success" });
            setTimeout(() => navigate("/inventory"), 1500);
        } catch (e) {
            setMsg({ text: `❌ ${e.message || "Failed to delete item"}`, type: "error" });
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
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "50vh",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280", fontSize: "14px" }}>
                    <span>Loading item details...</span>
                    <div
                        style={{
                            width: 16,
                            height: 16,
                            border: "2px solid transparent",
                            borderTop: "2px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
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
                    maxWidth: "1400px",
                    margin: "0 auto",
                    padding: "20px",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
            >
                <div
                    style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 500,
                    }}
                >
                    <span style={{ fontSize: "18px" }}>⚠️</span>
                    <span>{msg.text || "Item not found"}</span>
                </div>
                <Link
                    to="/inventory"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    <span>←</span>
                    <span>Back to Inventory</span>
                </Link>
            </div>
        );
    }

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e5e7eb",
    };

    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid #e5e7eb",
    };

    // Check if stock is low
    const isLowStock = it.currentStock > 0 && it.minimumStock > 0 && it.currentStock <= it.minimumStock;
    const stockPercentage = it.minimumStock > 0 ? (it.currentStock / it.minimumStock) * 100 : 100;

    // Status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" };
            case "inactive":
                return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
            case "discontinued":
                return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
            default:
                return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
        }
    };

    const statusColors = getStatusColor(it.status);

    return (
        <div
            style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "20px",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div style={{ flex: 1, minWidth: "300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                            {it.name}
                        </h1>
                        <span
                            style={{
                                padding: "4px 12px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                backgroundColor: statusColors.bg,
                                color: statusColors.text,
                                border: `1px solid ${statusColors.border}`,
                            }}
                        >
                            {it.status?.charAt(0).toUpperCase() + it.status?.slice(1)}
                        </span>
                    </div>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                        Item ID: <span style={{ fontWeight: 600, color: "#374151" }}>{it.itemId || "—"}</span>
                    </p>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Link
                        to="/inventory"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 18px",
                            backgroundColor: "white",
                            color: "#374151",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <span>←</span>
                        <span>Back</span>
                    </Link>
                    <Link
                        to="/inventory/new"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 18px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <span>+</span>
                        <span>Add New</span>
                    </Link>
                    <Link
                        to={`/inventory/${id}/edit`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 18px",
                            backgroundColor: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <span>✏️</span>
                        <span>Edit</span>
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 18px",
                            backgroundColor: isLoading ? "#9ca3af" : "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <span>🗑️</span>
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Message */}
            {msg.text && (
                <div
                    role="alert"
                    style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: msg.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 500,
                    }}
                >
                    <span style={{ fontSize: "18px" }}>
                        {msg.type === "error" ? "⚠️" : "✅"}
                    </span>
                    <span>{msg.text}</span>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 400px",
                    gap: "24px",
                    alignItems: "start",
                }}
            >
                {/* Main Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Item Details Card */}
                    <div style={card}>
                        <h2 style={sectionTitle}>📦 Item Details</h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "16px",
                            }}
                        >
                            <DetailRow label="Item Name" value={it.name || "—"} fullWidth />
                            <DetailRow label="Category" value={it.category ? it.category.charAt(0).toUpperCase() + it.category.slice(1) : "—"} />
                            <DetailRow label="Status" value={it.status ? it.status.charAt(0).toUpperCase() + it.status.slice(1) : "—"} />
                            <DetailRow label="Part Number" value={it.partNumber || "Not set"} />
                            <DetailRow label="Brand" value={it.brand || "Not set"} />
                            {it.description && (
                                <DetailRow label="Description" value={it.description} fullWidth />
                            )}
                        </div>
                    </div>

                    {/* Pricing & Stock Card */}
                    <div style={card}>
                        <h2 style={sectionTitle}>💰 Pricing & Stock</h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "16px",
                            }}
                        >
                            <DetailRow label="Unit Price" value={fmtCurrency(it.unitPrice)} highlight />
                            <DetailRow label="Unit" value={it.unit ? it.unit.charAt(0).toUpperCase() + it.unit.slice(1) : "—"} />
                            <DetailRow label="Current Stock" value={`${it.currentStock || 0} ${it.unit || 'units'}`} highlight />
                            <DetailRow label="Minimum Stock" value={`${it.minimumStock || 0} ${it.unit || 'units'}`} />

                            {/* Stock Level Warning */}
                            {isLowStock && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div
                                        style={{
                                            padding: "12px",
                                            borderRadius: "8px",
                                            backgroundColor: "#fef3c7",
                                            border: "1px solid #fde68a",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span style={{ fontSize: "18px" }}>⚠️</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
                                                Low Stock Alert
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#92400e" }}>
                                                Current stock ({it.currentStock}) is at or below minimum level ({it.minimumStock})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stock Level Progress Bar */}
                            {it.minimumStock > 0 && (
                                <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
                                        Stock Level
                                    </div>
                                    <div
                                        style={{
                                            height: "8px",
                                            background: "#f3f4f6",
                                            borderRadius: "9999px",
                                            overflow: "hidden",
                                            border: "1px solid #e5e7eb",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${Math.min(100, stockPercentage)}%`,
                                                background: isLowStock ? "#f59e0b" : "#10b981",
                                                transition: "width 0.3s ease",
                                            }}
                                        />
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                                        {stockPercentage.toFixed(0)}% of minimum level
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Supplier Information Card */}
                    {it.supplier && (
                        <div style={card}>
                            <h2 style={sectionTitle}>🏢 Supplier Information</h2>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "16px",
                                }}
                            >
                                <DetailRow label="Supplier Name" value={it.supplier.name || "Not set"} />
                                <DetailRow label="Contact Person" value={it.supplier.contactPerson || "Not set"} />
                                <DetailRow label="Phone" value={it.supplier.phone || "Not set"} />
                                <DetailRow label="Email" value={it.supplier.email || "Not set"} />
                            </div>
                        </div>
                    )}

                    {/* Additional Notes Card */}
                    {it.notes && (
                        <div style={card}>
                            <h2 style={sectionTitle}>📝 Additional Notes</h2>
                            <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                {it.notes}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div style={card}>
                        <h2 style={sectionTitle}>🕒 Timestamps</h2>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "16px",
                            }}
                        >
                            <DetailRow
                                label="Created At"
                                value={it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                            />
                            <DetailRow
                                label="Last Updated"
                                value={it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "—"}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div style={{ position: "sticky", top: "20px" }}>
                    <div style={card}>
                        <h2 style={sectionTitle}>📊 Quick Summary</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <SummaryRow label="Item ID" value={it.itemId || "—"} />
                            <SummaryRow label="Item Name" value={it.name || "—"} />
                            <SummaryRow
                                label="Category"
                                value={it.category ? it.category.charAt(0).toUpperCase() + it.category.slice(1) : "—"}
                            />
                            <SummaryRow
                                label="Status"
                                value={it.status ? it.status.charAt(0).toUpperCase() + it.status.slice(1) : "—"}
                            />
                            <SummaryRow
                                label="Unit Price"
                                value={fmtCurrency(it.unitPrice)}
                                highlight
                            />
                            <SummaryRow
                                label="Current Stock"
                                value={`${it.currentStock || 0} ${it.unit || 'units'}`}
                                highlight
                            />
                            <SummaryRow
                                label="Minimum Stock"
                                value={`${it.minimumStock || 0} ${it.unit || 'units'}`}
                            />

                            {/* Total Inventory Value */}
                            {it.unitPrice > 0 && it.currentStock > 0 && (
                                <div
                                    style={{
                                        marginTop: "14px",
                                        padding: "12px",
                                        background: "#f0fdf4",
                                        borderRadius: "8px",
                                        border: "1px solid #bbf7d0",
                                    }}
                                >
                                    <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, marginBottom: "4px" }}>
                                        Total Inventory Value
                                    </div>
                                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#166534" }}>
                                        {fmtCurrency(it.unitPrice * it.currentStock)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Card */}
                    <div style={{ ...card, marginTop: "16px" }}>
                        <h2 style={sectionTitle}>⚡ Quick Actions</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <Link
                                to={`/inventory/${id}/edit`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 14px",
                                    backgroundColor: "#f59e0b",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    textAlign: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <span>✏️</span>
                                <span>Edit Item</span>
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "10px 14px",
                                    backgroundColor: isLoading ? "#9ca3af" : "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    textAlign: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <span>🗑️</span>
                                <span>Delete Item</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    button:not(:disabled):hover, a:hover {
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }
                    
                    button:not(:disabled):active, a:active {
                        transform: translateY(0);
                    }
                `}
            </style>
        </div>
    );
}

function DetailRow({ label, value, highlight, fullWidth }) {
    return (
        <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
            <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>
                {label}
            </div>
            <div
                style={{
                    fontSize: "14px",
                    color: highlight ? "#1f2937" : "#374151",
                    fontWeight: highlight ? 700 : 500,
                }}
            >
                {value}
            </div>
        </div>
    );
}

function SummaryRow({ label, value, highlight, small }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <span
                style={{
                    color: "#6b7280",
                    fontSize: small ? "12px" : "13px",
                    fontWeight: small ? 400 : 500,
                }}
            >
                {label}:
            </span>
            <span
                style={{
                    fontWeight: highlight ? 700 : 600,
                    color: highlight ? "#1f2937" : "#374151",
                    fontSize: small ? "12px" : "14px",
                    textAlign: "right",
                }}
            >
                {value}
            </span>
        </div>
    );
}
// src/features/invoices/InvoiceDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../../lib/http";

export default function InvoiceDetail() {
    const { id } = useParams();
    const [inv, setInv] = useState(null);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get(`/invoices/${id}`);
                if (!ignore) setInv(r.data?.invoice || null);
            } catch (e) {
                if (!ignore) setMsg({ text: e.message || "Failed to load invoice", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, [id]);

    function money(n) {
        if (typeof n !== "number" || !Number.isFinite(n)) return "—";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

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

    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #e5e7eb",
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

    const statusBadge = (status) => {
        const map = {
            draft: { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
            pending: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
            paid: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
            cancelled: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
        };
        const s = map[String(status || "").toLowerCase()] || map.draft;
        return {
            display: "inline-block",
            padding: "4px 8px",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 700,
            backgroundColor: s.bg,
            color: s.color,
            border: `1px solid ${s.border}`,
        };
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
    };
    const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px", verticalAlign: "top" };

    if (isLoading) {
        return (
            <div style={wrap}>
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading invoice…</span>
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
        );
    }

    if (!inv) {
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
                    {msg.text || "Invoice not found"}
                </div>
                <Link
                    to="/invoices"
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
                    Back to Invoices
                </Link>
            </div>
        );
    }

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>
                    {inv.invoiceId || inv._id}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={statusBadge(inv.status)}>{inv.status || "draft"}</span>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link
                            to="/invoices"
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
                        <button
                            type="button"
                            onClick={() => window.print()}
                            style={{
                                padding: "10px 14px",
                                backgroundColor: "#6b7280",
                                color: "white",
                                border: "1px solid #4b5563",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Print
                        </button>
                    </div>
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

            {/* Info grid */}
            <div style={grid}>
                <div style={card}>
                    <h2 style={sectionTitle}>Invoice</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={row}>
                            <span style={label}>Invoice ID:</span>
                            <span style={value}>{inv.invoiceId || inv._id || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Booking:</span>
                            <span style={value}>{inv.booking?.bookingId || inv.booking || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Date:</span>
                            <span style={value}>
                {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
              </span>
                        </div>
                        <div style={row}>
                            <span style={label}>Payment:</span>
                            <span style={value}>{inv.paymentMethod || "—"}</span>
                        </div>
                    </div>
                </div>

                <div style={card}>
                    <h2 style={sectionTitle}>Customer</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={row}>
                            <span style={label}>Name:</span>
                            <span style={value}>
                {inv.customer?.profile?.firstName ||
                    inv.customer?.name ||
                    inv.customer?.email ||
                    "—"}
              </span>
                        </div>
                        <div style={row}>
                            <span style={label}>Email:</span>
                            <span style={value}>{inv.customer?.email || "—"}</span>
                        </div>
                        <div style={row}>
                            <span style={label}>Phone:</span>
                            <span style={value}>{inv.customer?.phone || "—"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div style={{ ...card, padding: 0 }}>
                <div style={{ padding: 16 }}>
                    <h2 style={sectionTitle}>Items</h2>
                </div>
                <div style={{ padding: 16, paddingTop: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="Invoice line items">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Invoice line items
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Description</th>
                                <th scope="col" style={thStyle}>Qty</th>
                                <th scope="col" style={thStyle}>Unit Price</th>
                                <th scope="col" style={thStyle}>Line Total</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(inv.items || []).length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                        No items
                                    </td>
                                </tr>
                            )}
                            {(inv.items || []).map((it, i) => (
                                <tr key={i}>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, color: "#111827" }}>{it.description || "—"}</span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>{it.note || ""}</span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{it.quantity ?? "—"}</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(it.unitPrice)}</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(it.total)}</td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr>
                                <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>Items Subtotal</td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(inv.items?.reduce((s, x) => s + (x.total || 0), 0) || 0)}</td>
                            </tr>
                            {"laborCharges" in inv && (
                                <tr>
                                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>Labor Charges</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(inv.laborCharges)}</td>
                                </tr>
                            )}
                            {"subtotal" in inv && (
                                <tr>
                                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>Subtotal</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(inv.subtotal)}</td>
                                </tr>
                            )}
                            {"tax" in inv && (
                                <tr>
                                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>Tax</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(inv.tax)}</td>
                                </tr>
                            )}
                            {"discount" in inv && (
                                <tr>
                                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>Discount</td>
                                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{money(inv.discount)}</td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, borderTop: "1px solid #e5e7eb" }}>
                                    Total
                                </td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: 700, borderTop: "1px solid #e5e7eb" }}>
                                    {money(inv.total)}
                                </td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <style>
                {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
        </div>
    );
}

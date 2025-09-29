// src/features/goods/CreateGoodsRequest.tsx
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { http } from "../../lib/http";

export default function CreateGoodsRequest() {
    const { jobId } = useParams();
    const [items, setItems] = useState([{ item: "", quantity: 1, purpose: "" }]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    function updateRow(index: number, patch: any) {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    }

    function addRow() {
        setItems((prev) => [...prev, { item: "", quantity: 1, purpose: "" }]);
    }

    function removeRow(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function validate() {
        if (!jobId) return "Job id is missing";
        if (!Array.isArray(items) || items.length === 0) return "Add at least one item";
        for (let i = 0; i < items.length; i++) {
            const r = items[i];
            if (!String(r.item || "").trim()) return `Row ${i + 1}: Inventory Item ID is required`;
            if ((r.quantity ?? 0) < 1) return `Row ${i + 1}: Quantity must be at least 1`;
            if (!String(r.purpose || "").trim()) return `Row ${i + 1}: Purpose is required`;
        }
        return "";
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: "", type: "" });
        try {
            await http.post("/goods-requests", { job: jobId, items });
            setMessage({ text: "Request created", type: "success" });
            setItems([{ item: "", quantity: 1, purpose: "" }]);
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to create request", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Styles
    const wrap: React.CSSProperties = {
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const headerRow: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px",
    };
    const title: React.CSSProperties = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
    const card: React.CSSProperties = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };
    const sectionTitle: React.CSSProperties = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #e5e7eb",
    };
    const control: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
    };
    const tableWrap: React.CSSProperties = { overflowX: "auto" };
    const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "separate", borderSpacing: 0 };
    const thStyle: React.CSSProperties = {
        textAlign: "left",
        padding: "12px",
        fontSize: "12px",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
    };
    const tdStyle: React.CSSProperties = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px", verticalAlign: "top" };
    const primaryBtn: React.CSSProperties = {
        padding: "12px 20px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: isSubmitting ? "not-allowed" : "pointer",
        opacity: isSubmitting ? 0.6 : 1,
    };
    const addBtn: React.CSSProperties = {
        padding: "10px 14px",
        backgroundColor: "#10b981",
        color: "white",
        border: "1px solid #059669",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    };
    const removeBtn: React.CSSProperties = {
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
                <h1 style={title}>New Goods Request</h1>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {jobId && (
                        <Link
                            to={`/jobs/${jobId}`}
                            style={{
                                padding: "10px 14px",
                                backgroundColor: "#6b7280",
                                color: "white",
                                border: "1px solid #4b5563",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Back to Job
                        </Link>
                    )}
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Form */}
            <form onSubmit={submit} style={{ ...card, paddingBottom: 0 }}>
                <div style={{ padding: 16 }}>
                    <h2 style={sectionTitle}>Items</h2>
                    <div style={{ marginBottom: 12 }}>
                        <button type="button" onClick={addRow} style={addBtn} disabled={isSubmitting}>
                            Add Row
                        </button>
                    </div>
                </div>

                <div style={{ padding: 16, paddingTop: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="Goods request items">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Goods request items
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" style={thStyle}>Inventory Item ID</th>
                                    <th scope="col" style={thStyle}>Quantity</th>
                                    <th scope="col" style={thStyle}>Purpose</th>
                                    <th scope="col" style={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index}>
                                        <td style={tdStyle}>
                                            <input
                                                type="text"
                                                placeholder="e.g. INV001"
                                                value={item.item}
                                                onChange={(e) => updateRow(index, { item: e.target.value })}
                                                style={control}
                                                disabled={isSubmitting}
                                                aria-label={`Item ${index + 1} inventory ID`}
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateRow(index, { quantity: Number(e.target.value) })}
                                                style={control}
                                                disabled={isSubmitting}
                                                aria-label={`Item ${index + 1} quantity`}
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="text"
                                                placeholder="e.g. Brake repair"
                                                value={item.purpose}
                                                onChange={(e) => updateRow(index, { purpose: e.target.value })}
                                                style={control}
                                                disabled={isSubmitting}
                                                aria-label={`Item ${index + 1} purpose`}
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    style={removeBtn}
                                                    disabled={isSubmitting}
                                                    aria-label={`Remove item ${index + 1}`}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ padding: 16, paddingTop: 0 }}>
                    <div style={{ textAlign: "right" }}>
                        <button type="submit" style={primaryBtn} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </div>
            </form>

            {/* Helper tips */}
            <div style={card}>
                <h2 style={sectionTitle}>Tips</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151" }}>
                            Inventory Item ID
                        </span>
                        <span style={{ display: "block", fontSize: 14, color: "#6b7280" }}>
                            Use the exact ID from the inventory system.
                        </span>
                    </div>
                    <div>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151" }}>
                            Purpose
                        </span>
                        <span style={{ display: "block", fontSize: 14, color: "#6b7280" }}>
                            Purpose helps approvers understand the request quickly.
                        </span>
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
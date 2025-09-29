// src/features/invoices/CreateInvoice.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { http } from "../../lib/http";

export default function CreateInvoice() {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [items, setItems] = useState([{ description: "Labor", quantity: 1, unitPrice: 0 }]);
    const [laborCharges, setLaborCharges] = useState(0);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                const r = await http.get(`/bookings/${bookingId}`);
                if (!ignore) setBooking(r.data?.booking || null);
            } catch (e) {
                if (!ignore) setMessage({ text: e.message || "Failed to load booking", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, [bookingId]);

    function updateItem(index, patch) {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    }

    function addLine() {
        setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
    }

    function removeLine(index) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function toMoney(n) {
        if (typeof n !== "number" || !Number.isFinite(n)) return "—";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    function itemsSubtotal() {
        return items.reduce((s, x) => s + Math.max(0, x.quantity || 0) * Math.max(0, x.unitPrice || 0), 0);
    }

    function subtotal() {
        return itemsSubtotal() + Math.max(0, laborCharges || 0);
    }

    function total() {
        return Math.max(0, subtotal() + Math.max(0, tax || 0) - Math.max(0, discount || 0));
    }

    function validate() {
        if (!booking) return "Booking not loaded";
        if (!Array.isArray(items) || items.length === 0) return "Add at least one line item";
        for (const [i, it] of items.entries()) {
            if (!String(it.description || "").trim()) return `Line ${i + 1}: description is required`;
            if ((it.quantity ?? 0) < 0) return `Line ${i + 1}: quantity must be >= 0`;
            if ((it.unitPrice ?? 0) < 0) return `Line ${i + 1}: unit price must be >= 0`;
        }
        if ((laborCharges ?? 0) < 0) return "Labor charges must be >= 0";
        if ((tax ?? 0) < 0) return "Tax must be >= 0";
        if ((discount ?? 0) < 0) return "Discount must be >= 0";
        if (!paymentMethod) return "Payment method is required";
        return "";
    }

    async function submit() {
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: "", type: "" });
        try {
            const payload = {
                booking: bookingId,
                customer: booking.customer?._id,
                items: items.map((x) => ({
                    description: x.description,
                    quantity: Math.max(0, x.quantity || 0),
                    unitPrice: Math.max(0, x.unitPrice || 0),
                    total: Math.max(0, x.quantity || 0) * Math.max(0, x.unitPrice || 0),
                })),
                laborCharges: Math.max(0, laborCharges || 0),
                subtotal: subtotal(),
                tax: Math.max(0, tax || 0),
                discount: Math.max(0, discount || 0),
                total: total(),
                paymentMethod,
            };
            await http.post("/invoices", payload);
            setMessage({ text: "Invoice created", type: "success" });
        } catch (e) {
            setMessage({ text: e.message || "Failed to create invoice", type: "error" });
        } finally {
            setIsSubmitting(false);
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
        flexWrap: "wrap",
        gap: "12px",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "24px",
        marginBottom: "24px",
    };

    const label = {
        display: "block",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
        marginBottom: "6px",
    };

    const control = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
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

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Create Invoice</h1>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link
                        to={booking ? `/bookings/${booking._id}` : "/bookings"}
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
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
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

            {/* Loading */}
            {isLoading && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading booking…</span>
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

            {!isLoading && (
                <>
                    {/* Booking Summary */}
                    {booking && (
                        <div style={card}>
                            <h2 style={sectionTitle}>Booking</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                                <Field label="Booking ID" value={booking.bookingId || "—"} />
                                <Field label="Customer" value={booking.customer?.profile?.firstName || booking.customer?.name || "—"} />
                                <Field label="Service Type" value={booking.serviceType || "—"} />
                                <Field
                                    label="Scheduled Date"
                                    value={booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "—"}
                                />
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div style={{ ...card, padding: 0 }}>
                        <div style={{ padding: 16 }}>
                            <h2 style={sectionTitle}>Line Items</h2>
                            <div style={{ marginBottom: 12 }}>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    style={{
                                        padding: "10px 14px",
                                        backgroundColor: "#10b981",
                                        color: "white",
                                        border: "1px solid #059669",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Add Line
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: 16, paddingTop: 0 }}>
                            <div style={tableWrap}>
                                <table style={tableStyle} aria-label="Invoice items">
                                    <thead>
                                    <tr>
                                        <th scope="col" style={thStyle}>Description</th>
                                        <th scope="col" style={thStyle}>Qty</th>
                                        <th scope="col" style={thStyle}>Unit Price</th>
                                        <th scope="col" style={thStyle}>Line Total</th>
                                        <th scope="col" style={thStyle}></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                                No items
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((x, i) => {
                                        const lineTotal = Math.max(0, x.quantity || 0) * Math.max(0, x.unitPrice || 0);
                                        return (
                                            <tr key={i}>
                                                <td style={tdStyle} width="45%">
                                                    <input
                                                        placeholder="Description"
                                                        value={x.description}
                                                        onChange={(e) => updateItem(i, { description: e.target.value })}
                                                        style={control}
                                                    />
                                                </td>
                                                <td style={tdStyle} width="10%">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="1"
                                                        value={x.quantity}
                                                        onChange={(e) => updateItem(i, { quantity: +e.target.value })}
                                                        style={control}
                                                        aria-label="Quantity"
                                                    />
                                                </td>
                                                <td style={tdStyle} width="20%">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={x.unitPrice}
                                                        onChange={(e) => updateItem(i, { unitPrice: +e.target.value })}
                                                        style={control}
                                                        aria-label="Unit price"
                                                    />
                                                </td>
                                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }} width="20%">
                                                    {toMoney(lineTotal)}
                                                </td>
                                                <td style={tdStyle} width="5%">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(i)}
                                                        style={{
                                                            padding: "8px 12px",
                                                            backgroundColor: "#ef4444",
                                                            color: "white",
                                                            border: "1px solid #b91c1c",
                                                            borderRadius: "8px",
                                                            fontSize: "13px",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}
                                                        disabled={items.length <= 1}
                                                        title={items.length <= 1 ? "At least one line required" : "Remove line"}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Totals + Payment */}
                    <div style={grid}>
                        <div style={card}>
                            <h2 style={sectionTitle}>Charges</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                                <div>
                                    <label style={label}>Labor Charges</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={laborCharges}
                                        onChange={(e) => setLaborCharges(+e.target.value)}
                                        style={control}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Tax</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={tax}
                                        onChange={(e) => setTax(+e.target.value)}
                                        style={control}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Discount</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={discount}
                                        onChange={(e) => setDiscount(+e.target.value)}
                                        style={control}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        style={control}
                                    >
                                        <option value="cash">cash</option>
                                        <option value="card">card</option>
                                        <option value="transfer">transfer</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={card}>
                            <h2 style={sectionTitle}>Summary</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <SummaryRow label="Items Subtotal" value={toMoney(itemsSubtotal())} />
                                <SummaryRow label="Labor Charges" value={toMoney(Math.max(0, laborCharges || 0))} />
                                <SummaryRow label="Subtotal" value={toMoney(subtotal())} />
                                <SummaryRow label="Tax" value={toMoney(Math.max(0, tax || 0))} />
                                <SummaryRow label="Discount" value={toMoney(Math.max(0, discount || 0))} />
                                <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "6px 0" }} />
                                <SummaryRow label="Total" value={toMoney(total())} strong />
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "12px 20px",
                                        backgroundColor: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.6 : 1,
                                    }}
                                >
                                    {isSubmitting ? "Creating..." : "Create Invoice"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
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

function Field({ label, value }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280" }}>{label}:</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{value}</span>
        </div>
    );
}

function SummaryRow({ label, value, strong }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280" }}>{label}</span>
            <span style={{ flex: 1, fontWeight: strong ? 700 : 500, color: strong ? "#111827" : undefined }}>{value}</span>
        </div>
    );
}

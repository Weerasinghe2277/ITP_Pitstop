// src/features/leave/MyLeave.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function MyLeave() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({
        leaveType: Enums.LeaveType[0],
        startDate: "",
        endDate: "",
        reason: "",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value })); // Controlled inputs keep state as single source of truth [web:1]
    }

    async function load() {
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            const r = await http.get("/leave-requests/my-requests");
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
                const r = await http.get("/leave-requests/my-requests");
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
    }, []); // Effect runs on mount and guards against updates after unmount for safety [web:71]

    // Date helpers
    const toDateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const formatDateInput = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };
    const today = toDateOnly(new Date());
    const maxWindowDate = toDateOnly(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));

    function validate() {
        if (!form.leaveType?.trim()) return "Leave type is required"; // Controlled form validation keeps UX predictable [web:1]
        if (!form.startDate) return "Start date is required"; // Controlled inputs allow simple presence checks [web:1]
        if (!form.endDate) return "End date is required"; // Controlled inputs allow simple presence checks [web:1]
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Invalid dates provided"; // Basic validation with controlled values [web:1]
        if (end < start) return "End date cannot be before start date"; // Client-side validation before submit [web:1]
        // Enforce window: cannot select past dates and only up to 30 days from today
        if (start < today) return "Start date cannot be in the past";
        if (toDateOnly(end) > maxWindowDate) return "Dates must be within 30 days from today";
        if (!form.reason.trim()) return "Reason is required"; // Keep the form state authoritative [web:1]
        return "";
    }

    async function submit(e) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMsg({ text: v, type: "error" });
            return;
        }
        setIsSubmitting(true);
        setMsg({ text: "", type: "" });
        try {
            await http.post("/leave-requests", form);
            setMsg({ text: "Leave request submitted", type: "success" });
            setForm({ leaveType: Enums.LeaveType[0], startDate: "", endDate: "", reason: "" });
            await load();
        } catch (e) {
            setMsg({ text: e.message || "Failed to submit leave request", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    }

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
    const grid = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginBottom: "24px",
    };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
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
    const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };
    const submitBtn = {
        padding: "12px 20px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    };

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

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>My Leave</h1>
            </div>

            {/* Message (polite live region) */}
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

            {/* Apply Form */}
            <form onSubmit={submit} style={card}>
                <h2 style={sectionTitle}>Apply for Leave</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>Leave Type</label>
                        <select
                            value={form.leaveType}
                            onChange={(e) => update("leaveType", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        >
                            {Enums.LeaveType.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={label}>Start Date</label>
                        <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) => update("startDate", e.target.value)}
                            style={control}
                            min={formatDateInput(today)}
                            max={formatDateInput(maxWindowDate)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label style={label}>End Date</label>
                        <input
                            type="date"
                            value={form.endDate}
                            onChange={(e) => update("endDate", e.target.value)}
                            style={control}
                            min={form.startDate ? form.startDate : formatDateInput(today)}
                            max={formatDateInput(maxWindowDate)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <label style={label}>Reason</label>
                        <input
                            placeholder="Reason"
                            value={form.reason}
                            onChange={(e) => update("reason", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                    <button type="submit" disabled={isSubmitting} style={{ ...submitBtn, opacity: isSubmitting ? 0.6 : 1 }}>
                        {isSubmitting ? "Submitting..." : "Apply"}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setForm({ leaveType: Enums.LeaveType[0], startDate: "", endDate: "", reason: "" })
                        }
                        disabled={isSubmitting}
                        style={{
                            padding: "12px 20px",
                            backgroundColor: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: isSubmitting ? 0.6 : 1,
                        }}
                    >
                        Reset
                    </button>
                </div>
            </form>

            {/* Requests Table */}
            {!isLoading && (
                <div style={{ ...card, padding: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="My leave requests">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                My leave requests
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" style={thStyle}>Request</th>
                                    <th scope="col" style={thStyle}>Dates</th>
                                    <th scope="col" style={thStyle}>Type</th>
                                    <th scope="col" style={thStyle}>Reason</th>
                                    <th scope="col" style={thStyle}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
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
                                                {(x.startDate || x.endDate) ? (
                                                    <span>
                                                        {x.startDate ? new Date(x.startDate).toLocaleDateString() : "—"} to{" "}
                                                        {x.endDate ? new Date(x.endDate).toLocaleDateString() : "—"}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td style={tdStyle}>{x.leaveType || "—"}</td>
                                            <td style={{ ...tdStyle, maxWidth: 360 }}>
                                                <span style={{ color: "#374151" }}>{x.reason || "—"}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={badge}>{x.status || "pending"}</span>
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

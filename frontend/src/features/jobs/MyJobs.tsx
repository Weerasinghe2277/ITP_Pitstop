// src/features/jobs/MyJobs.jsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { Enums } from "../../lib/validators";

export default function MyJobs() {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [status, setStatus] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });

    // Debounce query
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]); // Debouncing reduces unnecessary work while typing [web:52][web:55]

    // Load "my jobs"
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get("/jobs/my-jobs");
                if (!cancelled) setRows(r.data?.jobs || []);
            } catch (e) {
                if (!cancelled) setMsg({ text: e.message || "Failed to load jobs", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []); // Cleanup guard avoids setState on unmounted component [web:71][web:54]

    // Filter + search
    const filtered = useMemo(() => {
        const needle = debouncedQ.toLowerCase();
        let list = rows;
        if (status !== "all") list = list.filter((x) => String(x.status || "").toLowerCase() === status);
        if (needle) {
            list = list.filter((x) => {
                const id = String(x.jobId || x._id || "").toLowerCase();
                const title = String(x.title || "").toLowerCase();
                const booking = String(x.booking?.bookingId || "").toLowerCase();
                return id.includes(needle) || title.includes(needle) || booking.includes(needle);
            });
        }
        return list;
    }, [rows, debouncedQ, status]); // Client-side filter/search keeps UI responsive without extra API calls [web:52][web:54]

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
    const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };
    const controls = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" };
    const control = {
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
        position: "sticky",
        top: 0,
        zIndex: 1,
    };
    const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };
    const openBtn = {
        padding: "8px 12px",
        backgroundColor: "#3b82f6",
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #2563eb",
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>My Jobs</h1>
                <div style={controls}>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={control}
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        {Enums.JobStatus.map((s) => (
                            <option key={s} value={String(s).toLowerCase()}>{s}</option>
                        ))}
                    </select>
                    <input
                        placeholder="Search by Job ID, Title, or Booking"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ ...control, minWidth: 260 }}
                        aria-label="Search my jobs"
                    />
                </div>
            </div>

            {/* Message (live region) */}
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
                    <span>Loading jobs…</span>
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
                        <table style={tableStyle} aria-label="My jobs list">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                My jobs list
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>JobId</th>
                                <th scope="col" style={thStyle}>Booking</th>
                                <th scope="col" style={thStyle}>Title</th>
                                <th scope="col" style={thStyle}>Status</th>
                                <th scope="col" style={thStyle}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                        No jobs
                                    </td>
                                </tr>
                            )}
                            {filtered.map((j) => (
                                <tr key={j._id}>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, color: "#111827" }}>{j.jobId || j._id}</span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.updatedAt ? new Date(j.updatedAt).toLocaleDateString() : ""}
                        </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{j.booking?.bookingId || "—"}</td>
                                    <td style={tdStyle}>{j.title || "—"}</td>
                                    <td style={tdStyle}>
                                        <StatusBadge value={j.status} />
                                    </td>
                                    <td style={tdStyle}>
                                        <Link
                                            to={`/jobs/${j._id}`}
                                            style={openBtn}
                                        >
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            ))}
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

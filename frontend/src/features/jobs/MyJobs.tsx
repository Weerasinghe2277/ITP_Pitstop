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
    const [sortOrder, setSortOrder] = useState("oldest"); // 'oldest' or 'newest'
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [userInfo, setUserInfo] = useState(null);

    // Debounce query
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // Load user info and jobs
    useEffect(() => {
        let cancelled = false;

        async function loadUserInfo() {
            try {
                const response = await http.get("/users/profile");
                if (!cancelled) {
                    setUserInfo(response.data?.user || null);
                    console.log("User info loaded:", response.data?.user);
                }
            } catch (error) {
                console.error("Failed to load user info:", error);
                if (!cancelled) {
                    setMsg({ text: "Failed to load user profile", type: "error" });
                }
            }
        }

        async function loadJobs() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });

            try {
                console.log("Loading jobs for technician...");
                const response = await http.get("/jobs/my-jobs");
                console.log("Jobs API response:", response.data);

                if (!cancelled) {
                    const jobs = response.data?.jobs || [];
                    setRows(jobs);
                    console.log(`Loaded ${jobs.length} jobs for technician`);

                    if (jobs.length === 0) {
                        setMsg({
                            text: "No jobs assigned to you yet. Jobs will appear here once a service advisor assigns them to you.",
                            type: "info"
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load jobs:", error);
                if (!cancelled) {
                    let errorMessage = "Failed to load jobs";

                    if (error.response?.status === 403) {
                        errorMessage = "Access denied. Please ensure you're logged in as a technician.";
                    } else if (error.response?.status === 401) {
                        errorMessage = "Authentication failed. Please log in again.";
                    } else if (error.response?.data?.message) {
                        errorMessage = error.response.data.message;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    setMsg({ text: errorMessage, type: "error" });
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        loadUserInfo();
        loadJobs();

        return () => {
            cancelled = true;
        };
    }, []);

    // Filter + search + sort
    const filtered = useMemo(() => {
        const needle = debouncedQ.toLowerCase();
        let list = rows;

        // Filter by status
        if (status !== "all") {
            list = list.filter((x) => String(x.status || "").toLowerCase() === status);
        }

        // Search filter
        if (needle) {
            list = list.filter((x) => {
                const id = String(x.jobId || x._id || "").toLowerCase();
                const title = String(x.title || "").toLowerCase();
                const booking = String(x.booking?.bookingId || "").toLowerCase();
                const category = String(x.category || "").toLowerCase();
                const description = String(x.description || "").toLowerCase();

                return id.includes(needle) ||
                    title.includes(needle) ||
                    booking.includes(needle) ||
                    category.includes(needle) ||
                    description.includes(needle);
            });
        }

        // Sort by creation date
        list = [...list].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);

            if (sortOrder === "oldest") {
                return dateA - dateB; // Oldest first
            } else {
                return dateB - dateA; // Newest first
            }
        });

        return list;
    }, [rows, debouncedQ, status, sortOrder]);

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

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "—";
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "—";
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "—";
        }
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <div>
                    <h1 style={title}>My Jobs</h1>
                    {userInfo && (
                        <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
                            Welcome, {userInfo.profile?.firstName} {userInfo.profile?.lastName}
                            {userInfo.employeeDetails?.employeeId && ` (${userInfo.employeeDetails.employeeId})`}
                        </p>
                    )}
                </div>
                <div style={controls}>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={control}
                        aria-label="Filter by status"
                    >
                        <option value="all">All Statuses</option>
                        {Enums.JobStatus.map((s) => (
                            <option key={s} value={String(s).toLowerCase()}>
                                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                            </option>
                        ))}
                    </select>

                    {/* Sort Order Selector */}
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={control}
                        aria-label="Sort by date"
                    >
                        <option value="oldest">Oldest First</option>
                        <option value="newest">Newest First</option>
                    </select>

                    <input
                        placeholder="Search jobs, bookings, categories..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ ...control, minWidth: 280 }}
                        aria-label="Search my jobs"
                    />
                </div>
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
                        backgroundColor:
                            msg.type === "error" ? "#fef2f2" :
                                msg.type === "info" ? "#eff6ff" : "#f0fdf4",
                        color:
                            msg.type === "error" ? "#991b1b" :
                                msg.type === "info" ? "#1e40af" : "#166534",
                        border: `1px solid ${
                            msg.type === "error" ? "#fecaca" :
                                msg.type === "info" ? "#93c5fd" : "#bbf7d0"
                        }`,
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading your assigned jobs…</span>
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

            {/* Summary Stats */}
            {!isLoading && rows.length > 0 && (
                <div style={card}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
                        Job Summary
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#3b82f6" }}>{rows.length}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>Total Jobs</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#059669" }}>
                                {rows.filter(j => j.status === 'completed').length}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>Completed</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#dc2626" }}>
                                {rows.filter(j => j.status === 'working').length}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>In Progress</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b" }}>
                                {rows.filter(j => j.status === 'pending').length}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>Pending</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {!isLoading && filtered.length > 0 && (
                <div style={{
                    padding: "12px 16px",
                    marginBottom: "16px",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                    fontSize: "14px",
                    color: "#1e40af",
                    fontWeight: 500
                }}>
                    📋 Showing {filtered.length} job{filtered.length !== 1 ? 's' : ''}
                    {sortOrder === "oldest" ? " (oldest first)" : " (newest first)"}
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <div style={{ ...card, padding: 0 }}>
                    <div style={tableWrap}>
                        <table style={tableStyle} aria-label="My assigned jobs">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                List of jobs assigned to me as a technician
                            </caption>
                            <thead>
                            <tr>
                                <th scope="col" style={thStyle}>Job ID</th>
                                <th scope="col" style={thStyle}>Booking</th>
                                <th scope="col" style={thStyle}>Title & Category</th>
                                <th scope="col" style={thStyle}>Customer & Vehicle</th>
                                <th scope="col" style={thStyle}>Priority</th>
                                <th scope="col" style={thStyle}>Status</th>
                                <th scope="col" style={thStyle}>Created</th>
                                <th scope="col" style={thStyle}></th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                        {rows.length === 0
                                            ? "No jobs assigned to you yet"
                                            : "No jobs match your search criteria"
                                        }
                                    </td>
                                </tr>
                            )}
                            {filtered.map((job) => (
                                <tr key={job._id}>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 600, color: "#111827" }}>
                                                    {job.jobId || job._id}
                                                </span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                    Est: {job.estimatedHours || 0}h
                                                </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 500 }}>
                                                    {job.booking?.bookingId || "—"}
                                                </span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                    {job.booking?.serviceType || "—"}
                                                </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 500 }}>
                                                    {job.title || "—"}
                                                </span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                    {job.category || "—"}
                                                </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 500 }}>
                                                    {job.booking?.customer?.profile?.firstName} {job.booking?.customer?.profile?.lastName}
                                                </span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                    {job.booking?.vehicle?.registrationNumber} | {job.booking?.vehicle?.make} {job.booking?.vehicle?.model}
                                                </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                            <span style={{
                                                padding: "4px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                fontWeight: 500,
                                                backgroundColor:
                                                    job.priority === 'urgent' ? '#fee2e2' :
                                                        job.priority === 'high' ? '#fef3c7' :
                                                            job.priority === 'medium' ? '#e0f2fe' : '#f3f4f6',
                                                color:
                                                    job.priority === 'urgent' ? '#991b1b' :
                                                        job.priority === 'high' ? '#92400e' :
                                                            job.priority === 'medium' ? '#0c4a6e' : '#374151'
                                            }}>
                                                {job.priority || 'medium'}
                                            </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <StatusBadge value={job.status} />
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontSize: 13 }}>
                                                    {formatDate(job.createdAt)}
                                                </span>
                                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                    {formatTime(job.createdAt)}
                                                </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <Link
                                            to={`/jobs/${job._id}`}
                                            style={openBtn}
                                        >
                                            View Job
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
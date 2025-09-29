// src/features/jobs/MyCreatedJobs.tsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { Enums } from "../../lib/validators";

export default function MyCreatedJobs() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Load created jobs
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setMsg({ text: "", type: "" });
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.append("status", status);
        if (priority !== "all") params.append("priority", priority);
        if (category !== "all") params.append("category", category);
        params.append("page", page.toString());
        params.append("limit", pageSize.toString());

        const r = await http.get(`/jobs/my-created-jobs?${params.toString()}`);
        if (!cancelled) {
          setRows(r.data?.jobs || []);
          setStats(r.data?.stats || null);
        }
      } catch (e) {
        if (!cancelled) setMsg({ text: e.message || "Failed to load your created jobs", type: "error" });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [status, priority, category, page]);

  // Filter + search (client-side for responsiveness)
  const filtered = useMemo(() => {
    const needle = debouncedQ.toLowerCase();
    let list = rows;
    if (needle) {
      list = list.filter((x) => {
        const id = String(x.jobId || x._id || "").toLowerCase();
        const title = String(x.title || "").toLowerCase();
        const booking = String(x.booking?.bookingId || "").toLowerCase();
        const customer = String(x.booking?.customer?.profile?.firstName || "" + " " + x.booking?.customer?.profile?.lastName || "").toLowerCase();
        return id.includes(needle) || title.includes(needle) || booking.includes(needle) || customer.includes(needle);
      });
    }
    return list;
  }, [rows, debouncedQ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, priority, category]);

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
    color: "#596274ff",
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

  const statCard = {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  };

  const statGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  };

  const statItem = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "16px",
    backdropFilter: "blur(10px)",
  };

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={headerRow}>
        <h1 style={title}>My Created Jobs</h1>
      </div>

      {/* Statistics Card */}
      {stats && (
        <div style={statCard}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 16px 0" }}>
            📊 Job Creation Statistics
          </h2>
          <div style={statGrid}>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.total}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Jobs Created</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.totalAssignedLabourers}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Labourers Assigned</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>
                {stats.byStatus?.completed || 0}
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Completed Jobs</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>
                {stats.byStatus?.working || 0}
              </div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Jobs in Progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={card}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>
          🔍 Filters & Search
        </h3>
        <div style={controls}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={control}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {Enums.JobStatus.map((s) => (
              <option key={s} value={String(s).toLowerCase()}>{s}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={control}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            {Enums.Priority.map((p) => (
              <option key={p} value={String(p).toLowerCase()}>{p}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={control}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {Enums.JobCategory.map((c) => (
              <option key={c} value={String(c).toLowerCase()}>{c}</option>
            ))}
          </select>
          <input
            placeholder="Search by Job ID, Title, Booking, or Customer"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ ...control, minWidth: 300 }}
            aria-label="Search created jobs"
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
          <span>Loading your created jobs…</span>
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
            <table style={tableStyle} aria-label="My created jobs list">
              <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                My created jobs list
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>Job ID</th>
                  <th scope="col" style={thStyle}>Booking</th>
                  <th scope="col" style={thStyle}>Customer</th>
                  <th scope="col" style={thStyle}>Title</th>
                  <th scope="col" style={thStyle}>Status</th>
                  <th scope="col" style={thStyle}>Priority</th>
                  <th scope="col" style={thStyle}>Category</th>
                  <th scope="col" style={thStyle}>Assigned</th>
                  <th scope="col" style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                      {rows.length === 0 ? "No jobs created yet" : "No jobs match your search"}
                    </td>
                  </tr>
                )}
                {filtered.map((j) => (
                  <tr key={j._id}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{j.jobId || j._id}</span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500 }}>{j.booking?.bookingId || "—"}</span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.booking?.vehicle?.registrationNumber || ""}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500 }}>
                          {j.booking?.customer?.profile?.firstName || ""} {j.booking?.customer?.profile?.lastName || ""}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.booking?.customer?.profile?.phoneNumber || ""}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500 }}>{j.title || "—"}</span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.estimatedHours ? `~${j.estimatedHours}h` : ""}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge value={j.status} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 500,
                        backgroundColor:
                          j.priority === "urgent" ? "#fee2e2" :
                            j.priority === "high" ? "#fef3c7" :
                              j.priority === "medium" ? "#dbeafe" : "#f3f4f6",
                        color:
                          j.priority === "urgent" ? "#991b1b" :
                            j.priority === "high" ? "#92400e" :
                              j.priority === "medium" ? "#1e40af" : "#374151"
                      }}>
                        {j.priority || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {j.category || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500 }}>
                          {j.assignedLabourers?.length || 0} technician{(j.assignedLabourers?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                          {j.assignedLabourers?.length > 0 ? "assigned" : "pending"}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <Link to={`/jobs/${j._id}`} style={openBtn}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
            <span style={{ color: "#6b7280", fontSize: 14 }}>
              Showing {filtered.length} of {rows.length} jobs
            </span>
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
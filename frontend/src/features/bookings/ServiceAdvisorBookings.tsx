// src/features/bookings/ServiceAdvisorBookings.tsx
import { useEffect, useState, useMemo } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import { useAuth } from "../../store/AuthContext";

interface Customer {
  _id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    nic?: string;
  };
}

interface Vehicle {
  _id: string;
  make?: string;
  model?: string;
  registrationNumber?: string;
  year?: number;
}

interface Booking {
  _id: string;
  bookingId: string;
  customer: Customer;
  vehicle: Vehicle;
  serviceType: string;
  status: string;
  priority?: string;
  scheduledDate?: string;
  createdAt: string;
  description?: string;
  timeSlot?: string;
  assignedInspector?: string | { _id: string };
}

interface FilterState {
  serviceType: string;
  priority: string;
  status: string;
}

export default function ServiceAdvisorBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterState>({
    serviceType: "",
    priority: "",
    status: ""
  });
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">("oldest");
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const { user } = useAuth();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (user?._id) {
      loadConfirmedBookings();
    }
  }, [user?._id]);

  const getAssignedInspectorId = (booking: Booking): string | undefined => {
    if (!booking.assignedInspector) return undefined;
    if (typeof booking.assignedInspector === 'string') return booking.assignedInspector;
    if (typeof booking.assignedInspector === 'object' && booking.assignedInspector._id) {
      return booking.assignedInspector._id;
    }
    return undefined;
  };

  async function loadConfirmedBookings() {
    if (!user?._id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await http.get(`/bookings?assignedInspector=${user._id}`);
      const allBookings = response.data?.bookings || [];

      const filteredBookings = allBookings.filter((booking: Booking) => {
        const isPendingOrInspecting = booking.status === "pending" || booking.status === "inspecting";
        const assignedId = getAssignedInspectorId(booking);
        const isAssignedToCurrentUser = assignedId && String(assignedId) === String(user._id);
        return isPendingOrInspecting && isAssignedToCurrentUser;
      });

      setBookings(filteredBookings);
    } catch (error) {
      console.error("Failed to load bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const inspecting = bookings.filter(b => b.status === 'inspecting').length;
    const urgent = bookings.filter(b => b.priority === 'urgent').length;
    return { total, pending, inspecting, urgent };
  }, [bookings]);

  const filtered = useMemo(() => {
    const needle = debouncedQ.toLowerCase();
    let list = bookings.filter(booking => {
      if (filter.status && booking.status !== filter.status) return false;
      if (filter.serviceType && booking.serviceType !== filter.serviceType) return false;
      if (filter.priority && booking.priority !== filter.priority) return false;

      if (needle) {
        const id = String(booking.bookingId || "").toLowerCase();
        const firstName = String(booking.customer?.profile?.firstName || "").toLowerCase();
        const lastName = String(booking.customer?.profile?.lastName || "").toLowerCase();
        const customer = firstName + " " + lastName;
        const vehicle = String(booking.vehicle?.registrationNumber || "").toLowerCase();
        const make = String(booking.vehicle?.make || "").toLowerCase();
        const model = String(booking.vehicle?.model || "").toLowerCase();
        const service = String(booking.serviceType || "").toLowerCase();

        return id.includes(needle) || customer.includes(needle) ||
            vehicle.includes(needle) || make.includes(needle) ||
            model.includes(needle) || service.includes(needle);
      }

      return true;
    });

    // Sort by creation date
    list = [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);

      if (sortOrder === "oldest") {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      } else {
        return dateB.getTime() - dateA.getTime(); // Newest first
      }
    });

    return list;
  }, [bookings, filter, debouncedQ, sortOrder]);

  const serviceTypeOptions = ["inspection", "repair", "maintenance", "bodywork", "detailing"];
  const priorityOptions = ["low", "medium", "high", "urgent"];

  const wrap = { maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
  const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
  const card = { background: "white", borderRadius: "12px", padding: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb", marginBottom: "24px" };
  const control = { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" };
  const tableWrap = { overflowX: "auto" };
  const tableStyle = { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 };
  const thStyle = { textAlign: "left" as const, padding: "12px", fontSize: "12px", color: "#596274", textTransform: "uppercase" as const, letterSpacing: "0.04em", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" };
  const tdStyle = { padding: "12px", borderBottom: "1px solid #f3f4f6", fontSize: "14px" };
  const openBtn = { padding: "8px 12px", backgroundColor: "#3b82f6", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", border: "1px solid #2563eb" };
  const statCard = { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", borderRadius: "12px", padding: "20px", marginBottom: "24px" };
  const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" };
  const statItem = { backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "16px", backdropFilter: "blur(10px)" };

  if (!user?._id) {
    return (
        <div style={wrap}>
          <div style={{ ...card, textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>Authentication Required</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Please log in to view your assigned bookings.</p>
          </div>
        </div>
    );
  }

  return (
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={title}>My Assigned Bookings</h1>
        </div>

        {/* Statistics Card */}
        <div style={statCard}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, margin: "0 0 16px 0" }}>📊 Booking Statistics</h2>
          <div style={statGrid}>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.total}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Assigned Bookings</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.pending}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Pending Bookings</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.inspecting}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Currently Inspecting</div>
            </div>
            <div style={statItem}>
              <div style={{ fontSize: "24px", fontWeight: 700 }}>{stats.urgent}</div>
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Urgent Priority</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={card}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>🔍 Filters & Search</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))} style={control}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="inspecting">Inspecting</option>
            </select>
            <select value={filter.serviceType} onChange={(e) => setFilter(prev => ({ ...prev, serviceType: e.target.value }))} style={control}>
              <option value="">All Services</option>
              {serviceTypeOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
            <select value={filter.priority} onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))} style={control}>
              <option value="">All Priorities</option>
              {priorityOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>

            {/* Sort Order Selector */}
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "oldest" | "newest")}
                style={control}
                aria-label="Sort by date"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>

            <input placeholder="Search by ID, Customer, Vehicle..." value={q} onChange={(e) => setQ(e.target.value)} style={{ ...control, minWidth: 300 }} />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
            <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
              <span>Loading bookings…</span>
              <div style={{ width: 14, height: 14, border: "2px solid transparent", borderTop: "2px solid #6b7280", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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
              📋 Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
              {sortOrder === "oldest" ? " (oldest first)" : " (newest first)"}
            </div>
        )}

        {/* Table */}
        {!isLoading && (
            <div style={{ ...card, padding: 0 }}>
              <div style={tableWrap}>
                <table style={tableStyle}>
                  <thead>
                  <tr>
                    <th style={thStyle}>Booking ID</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Vehicle</th>
                    <th style={thStyle}>Service</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Scheduled</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                          {bookings.length === 0 ? "No assigned bookings yet" : "No bookings match your search"}
                        </td>
                      </tr>
                  )}
                  {filtered.map((b) => (
                      <tr key={b._id}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, color: "#111827" }}>{b.bookingId}</span>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : ""}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 500 }}>
                              {b.customer?.profile?.firstName || ""} {b.customer?.profile?.lastName || ""}
                            </span>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>{b.customer?.profile?.phone || ""}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 500 }}>{b.vehicle?.registrationNumber || "—"}</span>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>
                              {b.vehicle?.make && b.vehicle?.model ? `${b.vehicle.make} ${b.vehicle.model}` : ""}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {b.serviceType ? b.serviceType.charAt(0).toUpperCase() + b.serviceType.slice(1) : "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500,
                            backgroundColor: b.status === 'pending' ? '#fef3c7' : b.status === 'inspecting' ? '#dbeafe' : '#f3f4f6',
                            color: b.status === 'pending' ? '#92400e' : b.status === 'inspecting' ? '#1e40af' : '#374151'
                          }}>
                            {b.status ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500,
                            backgroundColor: b.priority === 'urgent' ? '#fee2e2' : b.priority === 'high' ? '#fef3c7' : b.priority === 'medium' ? '#dbeafe' : '#f3f4f6',
                            color: b.priority === 'urgent' ? '#991b1b' : b.priority === 'high' ? '#92400e' : b.priority === 'medium' ? '#1e40af' : '#374151'
                          }}>
                            {b.priority || "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span>{b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : "—"}</span>
                            <span style={{ color: "#6b7280", fontSize: 12 }}>{b.timeSlot || ""}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Link to={`/bookings/${b._id}`} style={openBtn}>View</Link>
                            <Link to={`/jobs/new/${b._id}`} style={{ ...openBtn, backgroundColor: "#10b981", borderColor: "#059669" }}>Create Job</Link>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
                <span style={{ color: "#6b7280", fontSize: 14 }}>
                  Showing {filtered.length} of {bookings.length} bookings
                </span>
              </div>
            </div>
        )}

        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
  );
}
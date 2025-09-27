import { useMemo } from "react";
import { useAuth } from "../../store/AuthContext";
import MyLeave from "../leave/MyLeave";

export default function MyProfile() {
  const { user } = useAuth();

  const fullName = useMemo(() => {
    const first = user?.profile?.firstName || "";
    const last = user?.profile?.lastName || "";
    const name = `${first} ${last}`.trim();
    return name || (user?.email || "");
  }, [user]);

  const wrap: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const heroCard: React.CSSProperties = {
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%)",
    borderRadius: 16,
    padding: 24,
    color: "white",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  };

  const heroGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 16,
    alignItems: "center",
  };

  const avatar: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: "rgba(255,255,255,0.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 24,
    border: "2px solid rgba(255,255,255,0.35)",
    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
  };

  const heroBadge: React.CSSProperties = {
    display: "inline-block",
    padding: "6px 10px",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: 0.3,
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  };

  const card: React.CSSProperties = {
    background: "white",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  };

  const heading: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: "#1f2937",
    margin: 0,
  };

  const sub: React.CSSProperties = {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
  };

  const row: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
  };

  const label: React.CSSProperties = {
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#6b7280",
  };

  const value: React.CSSProperties = {
    fontSize: 14,
    color: "#111827",
    fontWeight: 600,
    wordBreak: "break-word",
  };

  return (
    <div style={wrap}>
      <section style={heroCard} aria-labelledby="profile-hero">
        <div style={heroGrid}>
          <div style={avatar}>{(fullName || user?.email || "").charAt(0).toUpperCase()}</div>
          <div>
            <h1 id="profile-hero" style={{ ...heading, color: "#fff" }}>{fullName || "My Profile"}</h1>
            <div style={{ ...sub, color: "#e5e7eb" }}>Manage your account details and leave requests</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <span style={heroBadge}>Role: {user?.role ? String(user.role).replace(/_/g, " ") : "—"}</span>
              {user?.status && <span style={heroBadge}>Status: {String(user.status)}</span>}
              {user?.email && <span style={heroBadge}>{user.email}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <a
              href="#leave-section"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 10,
                fontWeight: 700,
                backdropFilter: "blur(4px)",
              }}
            >
              View Leave Requests →
            </a>
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(1200px 300px at 110% -10%, rgba(255,255,255,0.25), transparent)" }} />
      </section>

      <div style={grid}>
        <section style={card} aria-labelledby="profile-info-heading">
          <h2 id="profile-info-heading" style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginTop: 0, marginBottom: 12 }}>Profile Information</h2>
          <div style={{ ...row, borderTop: "1px solid #f3f4f6" }}>
            <div style={label}>Name</div>
            <div style={value}>{fullName || "—"}</div>
          </div>
          <div style={row}>
            <div style={label}>Email</div>
            <div style={value}>{user?.email || "—"}</div>
          </div>
          <div style={row}>
            <div style={label}>Role</div>
            <div style={value}>{user?.role ? String(user.role).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) : "—"}</div>
          </div>
          <div style={row}>
            <div style={label}>Phone</div>
            <div style={value}>{user?.profile?.phoneNumber || "—"}</div>
          </div>
          <div style={row}>
            <div style={label}>NIC</div>
            <div style={value}>{user?.profile?.nic || "—"}</div>
          </div>
          {user?.status && (
            <div style={row}>
              <div style={label}>Status</div>
              <div>
                {(() => {
                  const s = String(user.status || "").toLowerCase();
                  const isActive = s === "active";
                  const badge: React.CSSProperties = {
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    backgroundColor: isActive ? "#f0fdf4" : "#f3f4f6",
                    color: isActive ? "#166534" : "#374151",
                    border: `1px solid ${isActive ? "#bbf7d0" : "#e5e7eb"}`,
                    textTransform: "capitalize",
                  };
                  return <span style={badge}>{String(user.status)}</span>;
                })()}
              </div>
            </div>
          )}
        </section>

        <section style={card} aria-labelledby="security-heading">
          <h2 id="security-heading" style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginTop: 0, marginBottom: 12 }}>Security</h2>
          <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
            For security updates such as password change, please contact an administrator.
          </p>
        </section>
      </div>

      <section aria-labelledby="leave-heading" id="leave-section" style={{ marginTop: 12 }}>
        <h2 id="leave-heading" style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", margin: "0 0 12px 0" }}>My Leave Requests</h2>
        <MyLeave />
      </section>
    </div>
  );
}



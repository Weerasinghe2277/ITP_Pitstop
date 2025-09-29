// src/features/users/UsersList.jsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import { Enums } from "../../lib/validators";

export default function UsersList() {
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [role, setRole] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [deleteConfirm, setDeleteConfirm] = useState(null); // For delete confirmation modal
    const [viewUser, setViewUser] = useState(null); // For view user modal
    const [editUser, setEditUser] = useState(null); // For edit user modal

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // Load users once
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get("/users");
                if (!cancelled) setRows(r.data?.users || []);
            } catch (e) {
                if (!cancelled) setMsg({ text: e.message || "Failed to load users", type: "error" });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // Delete user function
    const handleDelete = async (userId, userName) => {
        try {
            await http.delete(`/users/${userId}`);
            setRows(prev => prev.filter(u => u._id !== userId));
            setMsg({ text: `User ${userName} deleted successfully`, type: "success" });
            setDeleteConfirm(null);
        } catch (e) {
            setMsg({ text: e.message || "Failed to delete user", type: "error" });
        }
    };

    // Update user function
    const handleUpdate = async (userId, updatedData) => {
        try {
            const response = await http.put(`/users/${userId}`, updatedData);
            setRows(prev => prev.map(u => u._id === userId ? { ...u, ...response.data } : u));
            setMsg({ text: "User updated successfully", type: "success" });
            setEditUser(null);
        } catch (e) {
            setMsg({ text: e.message || "Failed to update user", type: "error" });
        }
    };

    // Filter + search
    const filtered = useMemo(() => {
        const needle = debouncedQ.toLowerCase();
        let list = rows;
        if (role !== "all") list = list.filter(u => String(u.role || "").toLowerCase() === role);
        if (needle) {
            list = list.filter(u => {
                const id = String(u.userId || u._id || "").toLowerCase();
                const email = String(u.email || "").toLowerCase();
                const name = [
                    u.profile?.firstName || "",
                    u.profile?.lastName || "",
                ].join(" ").toLowerCase();
                return id.includes(needle) || email.includes(needle) || name.includes(needle);
            });
        }
        return list;
    }, [rows, debouncedQ, role]);

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
    const controls = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" };
    const control = {
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
    };
    const primaryBtn = {
        padding: "10px 14px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "1px solid #2563eb",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
    };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
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

    // Action button styles
    const actionBtnGroup = { display: "flex", gap: "8px", flexWrap: "wrap" };
    const viewBtn = {
        padding: "6px 10px",
        backgroundColor: "#10b981",
        color: "white",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #059669",
        cursor: "pointer",
    };
    const editBtn = {
        padding: "6px 10px",
        backgroundColor: "#f59e0b",
        color: "white",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #d97706",
        cursor: "pointer",
    };
    const deleteBtn = {
        padding: "6px 10px",
        backgroundColor: "#ef4444",
        color: "white",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid #dc2626",
        cursor: "pointer",
    };

    // Modal styles
    const modalOverlay = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    };
    const modal = {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
    };
    const modalHeader = {
        fontSize: "20px",
        fontWeight: 700,
        marginBottom: "16px",
        color: "#1f2937",
    };
    const modalActions = {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        marginTop: "20px",
    };
    const cancelBtn = {
        padding: "8px 16px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "1px solid #4b5563",
        borderRadius: "6px",
        fontSize: "14px",
        cursor: "pointer",
    };
    const confirmBtn = {
        padding: "8px 16px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "1px solid #dc2626",
        borderRadius: "6px",
        fontSize: "14px",
        cursor: "pointer",
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>Users</h1>
                <div style={controls}>
                    <Link to="/users/new" style={primaryBtn}>Create User</Link>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={control}
                        aria-label="Filter by role"
                    >
                        <option value="all">All roles</option>
                        {Enums.Roles.map((r) => (
                            <option key={r} value={String(r).toLowerCase()}>{r}</option>
                        ))}
                    </select>
                    <input
                        placeholder="Search by ID, name, or email"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ ...control, minWidth: 260 }}
                        aria-label="Search users"
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
                    <span>Loading users…</span>
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
                        <table style={tableStyle} aria-label="Users list">
                            <caption style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }}>
                                Users list with CRUD operations
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" style={thStyle}>UserId</th>
                                    <th scope="col" style={thStyle}>Name</th>
                                    <th scope="col" style={thStyle}>Email</th>
                                    <th scope="col" style={thStyle}>Role</th>
                                    <th scope="col" style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((u) => {
                                    const name = [u.profile?.firstName || "", u.profile?.lastName || ""].filter(Boolean).join(" ");
                                    return (
                                        <tr key={u._id}>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 600, color: "#111827" }}>{u.userId || u._id}</span>
                                                    <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>{name || "—"}</td>
                                            <td style={tdStyle}>{u.email || "—"}</td>
                                            <td style={tdStyle}>{u.role || "—"}</td>
                                            <td style={tdStyle}>
                                                <div style={actionBtnGroup}>
                                                    <button
                                                        onClick={() => setViewUser(u)}
                                                        style={viewBtn}
                                                        aria-label={`View user ${name || u.email}`}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => setEditUser(u)}
                                                        style={editBtn}
                                                        aria-label={`Edit user ${name || u.email}`}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm({ user: u, name: name || u.email })}
                                                        style={deleteBtn}
                                                        aria-label={`Delete user ${name || u.email}`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={modalOverlay}>
                    <div style={modal}>
                        <h3 style={modalHeader}>Confirm Delete</h3>
                        <p>Are you sure you want to delete user <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
                        <div style={modalActions}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={cancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.user._id, deleteConfirm.name)}
                                style={confirmBtn}
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View User Modal */}
            {viewUser && (
                <div style={modalOverlay}>
                    <div style={modal}>
                        <h3 style={modalHeader}>User Details</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <strong>User ID:</strong> {viewUser.userId || viewUser._id}
                            </div>
                            <div>
                                <strong>Name:</strong> {[viewUser.profile?.firstName || "", viewUser.profile?.lastName || ""].filter(Boolean).join(" ") || "—"}
                            </div>
                            <div>
                                <strong>Email:</strong> {viewUser.email || "—"}
                            </div>
                            <div>
                                <strong>Role:</strong> {viewUser.role || "—"}
                            </div>
                            <div>
                                <strong>Created:</strong> {viewUser.createdAt ? new Date(viewUser.createdAt).toLocaleString() : "—"}
                            </div>
                            <div>
                                <strong>Updated:</strong> {viewUser.updatedAt ? new Date(viewUser.updatedAt).toLocaleString() : "—"}
                            </div>
                            {viewUser.profile && (
                                <div>
                                    <strong>Profile:</strong>
                                    <pre style={{ fontSize: "12px", background: "#f3f4f6", padding: "8px", borderRadius: "4px", marginTop: "4px" }}>
                                        {JSON.stringify(viewUser.profile, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div style={modalActions}>
                            <button
                                onClick={() => setViewUser(null)}
                                style={cancelBtn}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <EditUserModal
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onUpdate={handleUpdate}
                    roles={Enums.Roles}
                />
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

// Edit User Modal Component
function EditUserModal({ user, onClose, onUpdate, roles }) {
    const [formData, setFormData] = useState({
        email: user.email || "",
        role: user.role || "",
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const updatedData = {
            email: formData.email,
            role: formData.role,
            profile: {
                ...user.profile,
                firstName: formData.firstName,
                lastName: formData.lastName,
            }
        };

        await onUpdate(user._id, updatedData);
        setIsSubmitting(false);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const modalOverlay = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
    };
    const modal = {
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "32px",
        maxWidth: "520px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        position: "relative",
    };
    const modalHeader = {
        fontSize: "24px",
        fontWeight: 700,
        marginBottom: "24px",
        color: "#111827",
        textAlign: "center",
        paddingBottom: "16px",
        borderBottom: "1px solid #e5e7eb",
    };
    const formGroup = {
        marginBottom: "20px",
    };
    const label = {
        display: "block",
        fontSize: "14px",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "8px",
        letterSpacing: "0.025em",
    };
    const input = {
        width: "100%",
        padding: "12px 16px",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: "16px",
        boxSizing: "border-box",
        transition: "all 0.2s ease-in-out",
        backgroundColor: "#ffffff",
        color: "#111827",
        outline: "none",
    };
    const inputFocus = {
        ...input,
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    };
    const modalActions = {
        display: "flex",
        gap: "16px",
        justifyContent: "flex-end",
        marginTop: "32px",
        paddingTop: "24px",
        borderTop: "1px solid #e5e7eb",
    };
    const cancelBtn = {
        padding: "12px 24px",
        backgroundColor: "#ffffff",
        color: "#6b7280",
        border: "2px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        minWidth: "100px",
    };
    const saveBtn = {
        padding: "12px 24px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "2px solid #3b82f6",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        opacity: isSubmitting ? 0.7 : 1,
        transition: "all 0.2s ease-in-out",
        minWidth: "120px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    };

    return (
        <div style={modalOverlay}>
            <div style={modal}>
                <h3 style={modalHeader}>Edit User</h3>
                <form onSubmit={handleSubmit}>
                    <div style={formGroup}>
                        <label style={label}>First Name</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleChange("firstName", e.target.value)}
                            style={input}
                            placeholder="Enter first name"
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3b82f6";
                                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                    <div style={formGroup}>
                        <label style={label}>Last Name</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleChange("lastName", e.target.value)}
                            style={input}
                            placeholder="Enter last name"
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3b82f6";
                                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                    <div style={formGroup}>
                        <label style={label}>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            style={input}
                            placeholder="Enter email address"
                            required
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3b82f6";
                                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                    <div style={formGroup}>
                        <label style={label}>User Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                            style={{
                                ...input,
                                cursor: "pointer",
                                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                                backgroundPosition: "right 12px center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "16px",
                                paddingRight: "40px",
                                appearance: "none",
                            }}
                            required
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3b82f6";
                                e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="" style={{ color: "#9ca3af" }}>Select a role</option>
                            {roles.map((role) => (
                                <option key={role} value={role} style={{ color: "#111827" }}>
                                    {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={modalActions}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={cancelBtn}
                            disabled={isSubmitting}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.target.style.backgroundColor = "#f3f4f6";
                                    e.target.style.borderColor = "#9ca3af";
                                    e.target.style.color = "#374151";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting) {
                                    e.target.style.backgroundColor = "#ffffff";
                                    e.target.style.borderColor = "#d1d5db";
                                    e.target.style.color = "#6b7280";
                                }
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={saveBtn}
                            disabled={isSubmitting}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.target.style.backgroundColor = "#2563eb";
                                    e.target.style.transform = "translateY(-1px)";
                                    e.target.style.boxShadow = "0 6px 8px -1px rgba(0, 0, 0, 0.15)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting) {
                                    e.target.style.backgroundColor = "#3b82f6";
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{
                                        display: "inline-block",
                                        width: "16px",
                                        height: "16px",
                                        border: "2px solid #ffffff",
                                        borderTop: "2px solid transparent",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite"
                                    }}></span>
                                    Saving...
                                </span>
                            ) : "Save Changes"}
                        </button>
                    </div>
                </form>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        </div>
    );
}
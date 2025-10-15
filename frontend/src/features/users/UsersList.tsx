// src/features/users/UsersList.jsx
import { useEffect, useState } from "react";
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
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // Load users with server-side pagination
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString(),
                });

                // Add search parameter if exists
                if (debouncedQ.trim()) {
                    params.append('search', debouncedQ.trim());
                }

                // Add role filter if not 'all'
                if (role && role !== 'all') {
                    params.append('role', role);
                }

                const r = await http.get(`/users?${params.toString()}`);
                if (!cancelled) {
                    setRows(r.data?.users || []);
                    // Update pagination info from server response
                    setTotalItems(r.data?.total || 0);
                    setTotalPages(r.data?.totalPages || 1);
                }
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
    }, [currentPage, itemsPerPage, debouncedQ, role]);

    // Reload data function
    const reloadData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
            });

            if (debouncedQ.trim()) {
                params.append('search', debouncedQ.trim());
            }

            if (role && role !== 'all') {
                params.append('role', role);
            }

            const r = await http.get(`/users?${params.toString()}`);
            setRows(r.data?.users || []);
            setTotalItems(r.data?.total || 0);
            setTotalPages(r.data?.totalPages || 1);
        } catch (e) {
            setMsg({ text: e.message || "Failed to reload users", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // Delete user function
    const handleDelete = async (userId, userName) => {
        try {
            await http.delete(`/users/${userId}`);
            setMsg({ text: `User ${userName} deleted successfully`, type: "success" });
            setDeleteConfirm(null);
            // Reload data to reflect changes
            await reloadData();
        } catch (e) {
            setMsg({ text: e.message || "Failed to delete user", type: "error" });
        }
    };

    // Update user function
    const handleUpdate = async (userId, updatedData) => {
        try {
            await http.put(`/users/${userId}`, updatedData);
            setMsg({ text: "User updated successfully", type: "success" });
            setEditUser(null);
            setViewUser(null); // Close view modal after successful update
            // Reload data to reflect changes
            await reloadData();
        } catch (e) {
            setMsg({ text: e.message || "Failed to update user", type: "error" });
        }
    };

    // Function to open edit modal from view modal
    const handleEditFromView = (user) => {
        setViewUser(null);
        setEditUser(user);
    };

    // Since we're using server-side pagination, rows already contains the paginated results
    const paginatedResults = rows;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedQ, role]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Styles (keeping existing styles)
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
        maxWidth: "600px",
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

    // Pagination styles
    const paginationWrap = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        padding: "16px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        flexWrap: "wrap",
        gap: "16px",
    };

    const paginationInfo = {
        color: "#6b7280",
        fontSize: "14px",
        minWidth: "200px",
    };

    const paginationControls = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    };

    const pageBtn = {
        padding: "8px 12px",
        backgroundColor: "white",
        color: "#374151",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
        cursor: "pointer",
        minWidth: "40px",
        textAlign: "center",
        transition: "all 0.2s",
    };

    const activePage = {
        ...pageBtn,
        backgroundColor: "#3b82f6",
        color: "white",
        borderColor: "#3b82f6",
    };

    const disabledBtn = {
        ...pageBtn,
        backgroundColor: "#f9fafb",
        color: "#9ca3af",
        cursor: "not-allowed",
        borderColor: "#e5e7eb",
    };

    const itemsPerPageSelect = {
        padding: "6px 8px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
        backgroundColor: "white",
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
                                {totalItems === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ ...tdStyle, color: "#6b7280", textAlign: "center", padding: 24 }}>
                                            No users found
                                        </td>
                                    </tr>
                                )}
                                {paginatedResults.map((u) => {
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

            {/* Pagination Controls */}
            {!isLoading && totalItems > 0 && (
                <div style={paginationWrap}>
                    <div style={paginationInfo}>
                        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} users
                    </div>

                    <div style={paginationControls}>
                        <label style={{ fontSize: "14px", color: "#6b7280", marginRight: "8px" }}>
                            Show:
                        </label>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            style={itemsPerPageSelect}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>

                        <span style={{ fontSize: "14px", color: "#6b7280", margin: "0 16px" }}>
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={currentPage === 1 ? disabledBtn : pageBtn}
                        >
                            Previous
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    style={currentPage === pageNum ? activePage : pageBtn}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={currentPage === totalPages ? disabledBtn : pageBtn}
                        >
                            Next
                        </button>
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

            {/* View User Modal - UPDATED with Edit button */}
            {viewUser && (
                <ViewUserModal
                    user={viewUser}
                    onClose={() => setViewUser(null)}
                    onEdit={handleEditFromView}
                />
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

// UPDATED: View User Modal Component with Edit Button
function ViewUserModal({ user, onClose, onEdit }) {
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
        padding: "0",
        maxWidth: "700px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    };

    const modalHeader = {
        padding: "24px 32px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        borderRadius: "16px 16px 0 0",
    };

    const modalTitle = {
        fontSize: "24px",
        fontWeight: 700,
        color: "#111827",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "12px",
    };

    const modalBody = {
        padding: "32px",
    };

    const section = {
        marginBottom: "28px",
    };

    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid #e5e7eb",
    };

    const field = {
        display: "flex",
        marginBottom: "12px",
        alignItems: "flex-start",
    };

    const label = {
        flex: "0 0 140px",
        fontWeight: 600,
        color: "#6b7280",
        fontSize: "14px",
        marginRight: "16px",
    };

    const value = {
        flex: 1,
        color: "#111827",
        fontSize: "14px",
        wordBreak: "break-word",
    };

    const badge = {
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        textTransform: "capitalize",
    };

    const modalFooter = {
        padding: "24px 32px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        borderRadius: "0 0 16px 16px",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
    };

    const editBtn = {
        padding: "12px 24px",
        backgroundColor: "#f59e0b",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        minWidth: "120px",
        transition: "all 0.2s ease-in-out",
    };

    const closeBtn = {
        padding: "12px 24px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        minWidth: "120px",
    };

    function getStatusBadgeStyle(status) {
        const baseStyle = { ...badge };
        switch (status?.toLowerCase()) {
            case "active":
                return { ...baseStyle, backgroundColor: "#dcfce7", color: "#166534" };
            case "inactive":
                return { ...baseStyle, backgroundColor: "#fef2f2", color: "#991b1b" };
            default:
                return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#374151" };
        }
    }

    function getTierBadgeStyle(tier) {
        const baseStyle = { ...badge };
        switch (tier?.toLowerCase()) {
            case "bronze":
                return { ...baseStyle, backgroundColor: "#fef3c7", color: "#92400e" };
            case "silver":
                return { ...baseStyle, backgroundColor: "#e5e7eb", color: "#374151" };
            case "gold":
                return { ...baseStyle, backgroundColor: "#fef3c7", color: "#d97706" };
            case "platinum":
                return { ...baseStyle, backgroundColor: "#e0e7ff", color: "#3730a3" };
            default:
                return { ...baseStyle, backgroundColor: "#f3f4f6", color: "#374151" };
        }
    }

    function fmtDate(d) {
        if (!d) return "—";
        try {
            return new Date(d).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "2-digit",
            });
        } catch {
            return "—";
        }
    }

    function fmtDateTime(d) {
        if (!d) return "—";
        try {
            return new Date(d).toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "—";
        }
    }

    const fullName = [
        user.profile?.firstName || "",
        user.profile?.lastName || "",
    ]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(" ");

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h3 style={modalTitle}>
                        <span>👤</span>
                        User Details
                    </h3>
                </div>

                <div style={modalBody}>
                    {/* Basic Information */}
                    <div style={section}>
                        <h4 style={sectionTitle}>Basic Information</h4>
                        <div style={field}>
                            <span style={label}>User ID:</span>
                            <span style={value}>{user.userId || user._id || "—"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Full Name:</span>
                            <span style={value}>{fullName || "—"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Email:</span>
                            <span style={value}>{user.email || "—"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Role:</span>
                            <span style={value}>{user.role || "—"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Status:</span>
                            <span style={getStatusBadgeStyle(user.status)}>{user.status || "—"}</span>
                        </div>
                    </div>

                    {/* Profile Information */}
                    {user.profile && (
                        <div style={section}>
                            <h4 style={sectionTitle}>Profile Information</h4>
                            <div style={field}>
                                <span style={label}>First Name:</span>
                                <span style={value}>{user.profile.firstName || "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>Last Name:</span>
                                <span style={value}>{user.profile.lastName || "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>Phone:</span>
                                <span style={value}>{user.profile.phoneNumber || "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>NIC:</span>
                                <span style={value}>{user.profile.nic || "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>Date of Birth:</span>
                                <span style={value}>{fmtDate(user.profile.dateOfBirth)}</span>
                            </div>

                            {/* Address */}
                            {user.profile.address && (
                                <>
                                    <div style={field}>
                                        <span style={label}>Address:</span>
                                        <span style={value}>{user.profile.address.street || "—"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>City:</span>
                                        <span style={value}>{user.profile.address.city || "—"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Province:</span>
                                        <span style={value}>{user.profile.address.province || "—"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Postal Code:</span>
                                        <span style={value}>{user.profile.address.postalCode || "—"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Customer Details */}
                    {user.customerDetails && (
                        <div style={section}>
                            <h4 style={sectionTitle}>Customer Details</h4>
                            <div style={field}>
                                <span style={label}>Loyalty Points:</span>
                                <span style={value}>{user.customerDetails.loyaltyPoints ?? "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>Membership Tier:</span>
                                <span style={getTierBadgeStyle(user.customerDetails.membershipTier)}>
                                    {user.customerDetails.membershipTier || "—"}
                                </span>
                            </div>

                            {/* Emergency Contact */}
                            {user.customerDetails.emergencyContact && (
                                <>
                                    <div style={field}>
                                        <span style={label}>Emergency Contact:</span>
                                        <span style={value}>{user.customerDetails.emergencyContact.name || "—"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Emergency Phone:</span>
                                        <span style={value}>{user.customerDetails.emergencyContact.phoneNumber || "—"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Relationship:</span>
                                        <span style={value}>{user.customerDetails.emergencyContact.relationship || "—"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Preferences */}
                    {user.preferences && (
                        <div style={section}>
                            <h4 style={sectionTitle}>Preferences</h4>
                            <div style={field}>
                                <span style={label}>Language:</span>
                                <span style={value}>{user.preferences.language || "—"}</span>
                            </div>
                            <div style={field}>
                                <span style={label}>Timezone:</span>
                                <span style={value}>{user.preferences.timezone || "—"}</span>
                            </div>

                            {/* Notifications */}
                            {user.preferences.notifications && (
                                <>
                                    <div style={field}>
                                        <span style={label}>Email Notifications:</span>
                                        <span style={value}>{user.preferences.notifications.email ? "✅ Enabled" : "❌ Disabled"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>SMS Notifications:</span>
                                        <span style={value}>{user.preferences.notifications.sms ? "✅ Enabled" : "❌ Disabled"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Push Notifications:</span>
                                        <span style={value}>{user.preferences.notifications.push ? "✅ Enabled" : "❌ Disabled"}</span>
                                    </div>
                                    <div style={field}>
                                        <span style={label}>Marketing:</span>
                                        <span style={value}>{user.preferences.notifications.marketing ? "✅ Enabled" : "❌ Disabled"}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Security & Verification */}
                    <div style={section}>
                        <h4 style={sectionTitle}>Security & Verification</h4>
                        <div style={field}>
                            <span style={label}>Email Verified:</span>
                            <span style={value}>{user.emailVerified ? "✅ Verified" : "❌ Not Verified"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Phone Verified:</span>
                            <span style={value}>{user.phoneVerified ? "✅ Verified" : "❌ Not Verified"}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Two Factor Auth:</span>
                            <span style={value}>{user.twoFactorEnabled ? "✅ Enabled" : "❌ Disabled"}</span>
                        </div>
                    </div>

                    {/* System Information */}
                    <div style={section}>
                        <h4 style={sectionTitle}>System Information</h4>
                        <div style={field}>
                            <span style={label}>Created:</span>
                            <span style={value}>{fmtDateTime(user.createdAt)}</span>
                        </div>
                        <div style={field}>
                            <span style={label}>Updated:</span>
                            <span style={value}>{fmtDateTime(user.updatedAt)}</span>
                        </div>
                        {user.lastLogin && (
                            <div style={field}>
                                <span style={label}>Last Login:</span>
                                <span style={value}>{fmtDateTime(user.lastLogin)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={modalFooter}>
                    <button
                        onClick={() => onEdit(user)}
                        style={editBtn}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#d97706";
                            e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#f59e0b";
                            e.target.style.transform = "translateY(0)";
                        }}
                    >
                        Edit User
                    </button>
                    <button
                        onClick={onClose}
                        style={closeBtn}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#2563eb";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#3b82f6";
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// Enhanced Edit User Modal Component
function EditUserModal({ user, onClose, onUpdate, roles }) {
    const [formData, setFormData] = useState({
        email: user.email || "",
        role: user.role || "",
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        phoneNumber: user.profile?.phoneNumber || "",
        nic: user.profile?.nic || "",
        status: user.status || "active",
        // Address fields
        street: user.profile?.address?.street || "",
        city: user.profile?.address?.city || "",
        province: user.profile?.address?.province || "",
        postalCode: user.profile?.address?.postalCode || "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        // Role validation
        if (!formData.role) {
            newErrors.role = "Role is required";
        }

        // Phone validation (if provided)
        if (formData.phoneNumber && !/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Invalid phone number format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const updatedData = {
            email: formData.email,
            role: formData.role,
            status: formData.status,
            profile: {
                ...user.profile,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                nic: formData.nic,
                address: {
                    ...user.profile?.address,
                    street: formData.street,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode,
                }
            }
        };

        await onUpdate(user._id, updatedData);
        setIsSubmitting(false);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
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
        padding: "0",
        maxWidth: "700px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        position: "relative",
    };

    const modalHeader = {
        padding: "24px 32px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        borderRadius: "16px 16px 0 0",
    };

    const modalTitle = {
        fontSize: "24px",
        fontWeight: 700,
        color: "#111827",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "12px",
    };

    const modalBody = {
        padding: "32px",
    };

    const formGrid = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginBottom: "24px",
    };

    const formGroupFull = {
        gridColumn: "1 / -1",
        marginBottom: "20px",
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

    const errorInput = {
        ...input,
        borderColor: "#ef4444",
    };

    const errorText = {
        color: "#ef4444",
        fontSize: "12px",
        marginTop: "4px",
    };

    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid #e5e7eb",
        gridColumn: "1 / -1",
    };

    const modalActions = {
        display: "flex",
        gap: "16px",
        justifyContent: "flex-end",
        padding: "24px 32px",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        borderRadius: "0 0 16px 16px",
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
        <div style={modalOverlay} onClick={onClose}>
            <div style={modal} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h3 style={modalTitle}>
                        <span>✏️</span>
                        Edit User
                    </h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={modalBody}>
                        <div style={formGrid}>
                            {/* Basic Information Section */}
                            <h4 style={sectionTitle}>Basic Information</h4>

                            <div style={formGroup}>
                                <label style={label}>First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                    style={errors.firstName ? errorInput : input}
                                    placeholder="Enter first name"
                                    onFocus={(e) => {
                                        if (!errors.firstName) {
                                            e.target.style.borderColor = "#3b82f6";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!errors.firstName) {
                                            e.target.style.borderColor = "#e5e7eb";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                                {errors.firstName && <div style={errorText}>{errors.firstName}</div>}
                            </div>

                            <div style={formGroup}>
                                <label style={label}>Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    style={errors.lastName ? errorInput : input}
                                    placeholder="Enter last name"
                                    onFocus={(e) => {
                                        if (!errors.lastName) {
                                            e.target.style.borderColor = "#3b82f6";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!errors.lastName) {
                                            e.target.style.borderColor = "#e5e7eb";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                                {errors.lastName && <div style={errorText}>{errors.lastName}</div>}
                            </div>

                            <div style={formGroup}>
                                <label style={label}>Email Address *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    style={errors.email ? errorInput : input}
                                    placeholder="Enter email address"
                                    required
                                    onFocus={(e) => {
                                        if (!errors.email) {
                                            e.target.style.borderColor = "#3b82f6";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!errors.email) {
                                            e.target.style.borderColor = "#e5e7eb";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                                {errors.email && <div style={errorText}>{errors.email}</div>}
                            </div>

                            <div style={formGroup}>
                                <label style={label}>Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                                    style={errors.phoneNumber ? errorInput : input}
                                    placeholder="Enter phone number"
                                    onFocus={(e) => {
                                        if (!errors.phoneNumber) {
                                            e.target.style.borderColor = "#3b82f6";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!errors.phoneNumber) {
                                            e.target.style.borderColor = "#e5e7eb";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                />
                                {errors.phoneNumber && <div style={errorText}>{errors.phoneNumber}</div>}
                            </div>

                            <div style={formGroup}>
                                <label style={label}>User Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => handleChange("role", e.target.value)}
                                    style={{
                                        ...(errors.role ? errorInput : input),
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
                                        if (!errors.role) {
                                            e.target.style.borderColor = "#3b82f6";
                                            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!errors.role) {
                                            e.target.style.borderColor = "#e5e7eb";
                                            e.target.style.boxShadow = "none";
                                        }
                                    }}
                                >
                                    <option value="" style={{ color: "#9ca3af" }}>Select a role</option>
                                    {roles.map((role) => (
                                        <option key={role} value={role} style={{ color: "#111827" }}>
                                            {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                                {errors.role && <div style={errorText}>{errors.role}</div>}
                            </div>

                            <div style={formGroup}>
                                <label style={label}>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
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
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#3b82f6";
                                        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#e5e7eb";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div style={formGroupFull}>
                                <label style={label}>NIC</label>
                                <input
                                    type="text"
                                    value={formData.nic}
                                    onChange={(e) => handleChange("nic", e.target.value)}
                                    style={input}
                                    placeholder="Enter NIC number"
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

                            {/* Address Section */}
                            <h4 style={sectionTitle}>Address Information</h4>

                            <div style={formGroupFull}>
                                <label style={label}>Street Address</label>
                                <input
                                    type="text"
                                    value={formData.street}
                                    onChange={(e) => handleChange("street", e.target.value)}
                                    style={input}
                                    placeholder="Enter street address"
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
                                <label style={label}>City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    style={input}
                                    placeholder="Enter city"
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
                                <label style={label}>Province</label>
                                <input
                                    type="text"
                                    value={formData.province}
                                    onChange={(e) => handleChange("province", e.target.value)}
                                    style={input}
                                    placeholder="Enter province"
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
                                <label style={label}>Postal Code</label>
                                <input
                                    type="text"
                                    value={formData.postalCode}
                                    onChange={(e) => handleChange("postalCode", e.target.value)}
                                    style={input}
                                    placeholder="Enter postal code"
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
                        </div>
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

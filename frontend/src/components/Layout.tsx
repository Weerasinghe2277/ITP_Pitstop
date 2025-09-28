// src/components/Layout.tsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        // Check if user has a dark mode preference in localStorage
        const savedMode = localStorage.getItem("darkMode");
        return savedMode ? JSON.parse(savedMode) : false;
    });
    const [notifications, setNotifications] = useState([
        { id: 1, message: "New booking received", read: false, time: "2 min ago" },
        { id: 2, message: "Inventory low on brake pads", read: false, time: "1 hour ago" },
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const userRole = user?.role;
    const isAdmin = userRole === "admin";
    const isManager = userRole === "manager";
    const isCashier = userRole === "cashier";
    const isServiceAdvisor = userRole === "service_advisor";
    const isTechnician = userRole === "technician";

    const isAdminOrManager = isAdmin || isManager;
    const canViewBookings = isCashier || isAdmin || isManager || isServiceAdvisor;
    const canViewJobs = isServiceAdvisor || isAdmin || isManager || isTechnician;
    const canViewInventory = isAdmin || isManager || isServiceAdvisor || isTechnician;

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Save dark mode preference to localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // Mark notification as read
    const markAsRead = (id: number) => {
        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
        ));
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results page or filter content
            alert(`Searching for: ${searchQuery}`);
            setSearchQuery("");
        }
    };

    // Theme variables
    const theme = {
        background: darkMode ? "#1f2937" : "#f9fafb",
        text: darkMode ? "#f3f4f6" : "#111827",
        sidebar: darkMode ? "#111827" : "#1f2937",
        card: darkMode ? "#374151" : "#ffffff",
        border: darkMode ? "#4b5563" : "#e5e7eb",
        accent: darkMode ? "#3b82f6" : "#2563eb",
        mutedText: darkMode ? "#9ca3af" : "#6b7280",
    };

    const shellStyle: React.CSSProperties = {
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: "background-color 0.3s, color 0.3s",
    };

    const topbarStyle: React.CSSProperties = {
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: darkMode ? "#111827" : "white",
        borderBottom: `1px solid ${theme.border}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    };

    const brandStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: theme.text,
    };

    const sidebarStyle: React.CSSProperties = {
        width: 260,
        backgroundColor: theme.sidebar,
        color: "#e5e7eb",
        padding: "20px 12px",
        borderRight: `1px solid ${darkMode ? "#0b1220" : theme.border}`,
        transition: "background-color 0.3s, border-color 0.3s",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        overscrollBehavior: "contain",
    };

    const sectionTitle: React.CSSProperties = {
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: theme.mutedText,
        padding: "8px 10px",
        marginTop: 8,
        marginBottom: 6,
    };

    const linkBase: React.CSSProperties = {
        display: "block",
        padding: "10px 12px",
        color: "#e5e7eb",
        borderRadius: 8,
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
        transition: "background-color 0.2s",
    };

    function navLinkStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
        return {
            ...linkBase,
            backgroundColor: isActive ? (darkMode ? "#374151" : "#e5e7eb") : "transparent",
            color: isActive ? (darkMode ? "#ffffff" : "#111827") : "#e5e7eb",
            border: isActive ? `1px solid ${theme.border}` : "1px solid transparent",
            boxShadow: isActive ? `inset 2px 0 0 0 ${theme.accent}` : "none",
        };
    }

    return (
        <div style={shellStyle}>
            {/* Skip to content for accessibility */}
            <a
                href="#main-content"
                style={{
                    position: "absolute",
                    left: -10000,
                    top: "auto",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                }}
            >
                Skip to content
            </a>

            <aside style={sidebarStyle} aria-label="Primary">
                <div style={{ padding: "6px 10px", marginBottom: 8 }}>
                    <span
                        style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            background: darkMode ? "#0b1220" : "#1e40af",
                            border: `1px solid ${darkMode ? "#1f2937" : "#3730a3"}`,
                            borderRadius: 8,
                            fontSize: 12,
                            color: "#9ca3af",
                        }}
                    >
                        Menu
                    </span>
                </div>

                <nav aria-label="Main navigation">
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        <li>
                            <NavLink to="/" style={navLinkStyle}>
                                Dashboard
                            </NavLink>
                        </li>

                        {canViewBookings && (
                            <>
                                <li>
                                    <NavLink to="/bookings" style={navLinkStyle}>
                                        Bookings
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/invoices" style={navLinkStyle}>
                                        Invoices
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {canViewJobs && (
                            <>
                                <li>
                                    <NavLink to="/jobs" style={navLinkStyle}>
                                        Jobs
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {(isServiceAdvisor || isAdminOrManager) && (
                            <>
                                <li>
                                    <NavLink to="/goods" style={navLinkStyle}>
                                        Goods Requests
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {isTechnician && (
                            <>
                                <li style={{ ...sectionTitle as React.CSSProperties, display: 'none' }}>Technician</li>
                                <li>
                                    <NavLink to="/jobs/my" style={navLinkStyle}>
                                        My Jobs
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {isAdminOrManager && (
                            <>
                                <li style={sectionTitle as React.CSSProperties}>Admin</li>
                                {/* <li>
                                    <NavLink to="/goods/pending" style={navLinkStyle}>
                                        Approve Goods
                                    </NavLink>
                                </li> */}
                                <li>
                                    <NavLink to="/users" style={navLinkStyle}>
                                        Users
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/leave/manage" style={navLinkStyle}>
                                        Manage Leave
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/reports" style={navLinkStyle}>
                                        Reports
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {canViewInventory && (
                            <>
                                <li>
                                    <NavLink to="/inventory" style={navLinkStyle}>
                                        Inventory
                                    </NavLink>
                                </li>
                                {(isAdmin || isManager || isServiceAdvisor) && (
                                    <li>
                                        <NavLink to="/inventory/low" style={navLinkStyle}>
                                            Low Stock
                                        </NavLink>
                                    </li>
                                )}
                            </>
                        )}

                        {user && (
                            <>
                                {!isAdmin && (
                                    <li>
                                        <NavLink to="/leave" style={navLinkStyle}>
                                            My Leave
                                        </NavLink>
                                    </li>
                                )}
                                <li>
                                    <NavLink to="/vehicles" style={navLinkStyle}>
                                        Vehicles
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/profile" style={navLinkStyle}>
                                        My Profile
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </aside>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <header style={topbarStyle}>
                    <div style={brandStyle}>
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#10b981",
                                boxShadow: "0 0 0 3px rgba(16,185,129,0.2)",
                            }}
                        />
                        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Pitstop</h1>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "8px 12px 8px 36px",
                                    borderRadius: 8,
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: darkMode ? "#374151" : "#f9fafb",
                                    color: theme.text,
                                    width: 200,
                                    fontSize: 14,
                                }}
                            />
                            <svg
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 16,
                                    height: 16,
                                    color: theme.mutedText,
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </form>

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            type="button"
                            style={{
                                padding: "8px",
                                backgroundColor: "transparent",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {darkMode ? (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>

                        {/* Notifications */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                type="button"
                                style={{
                                    padding: "8px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    position: "relative",
                                }}
                                aria-label="Notifications"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            right: 0,
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 16,
                                            height: 16,
                                            fontSize: 10,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        right: 0,
                                        backgroundColor: darkMode ? "#374151" : "white",
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 8,
                                        padding: "8px 0",
                                        width: 320,
                                        maxHeight: 400,
                                        overflowY: "auto",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                        zIndex: 50,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "8px 12px",
                                            borderBottom: `1px solid ${theme.border}`,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <strong>Notifications</strong>
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                color: theme.text,
                                            }}
                                            aria-label="Close notifications"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: "16px", textAlign: "center", color: theme.mutedText }}>
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                style={{
                                                    padding: "12px",
                                                    borderBottom: `1px solid ${theme.border}`,
                                                    backgroundColor: notification.read ? "transparent" : (darkMode ? "rgba(59, 130, 246, 0.1)" : "#eff6ff"),
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div style={{ fontSize: 14, fontWeight: notification.read ? 400 : 600 }}>
                                                    {notification.message}
                                                </div>
                                                <div style={{ fontSize: 12, color: theme.mutedText, marginTop: 4 }}>
                                                    {notification.time}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <span
                            style={{
                                fontSize: 14,
                                color: darkMode ? "#e5e7eb" : "#374151",
                                padding: "6px 10px",
                                background: darkMode ? "#374151" : "#f3f4f6",
                                border: `1px solid ${theme.border}`,
                                borderRadius: 8,
                            }}
                            title={user?.email || ""}
                        >
                            {String(user?.name || user?.email || "User")}
                        </span>
                        <button
                            onClick={logout}
                            type="button"
                            style={{
                                padding: "8px 12px",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div
                    style={{
                        background: theme.card,
                        borderRadius: 12,
                        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                        border: `1px solid ${theme.border}`,
                        transition: "background-color 0.3s, border-color 0.3s",
                    }}
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
// src/components/Layout.tsx
import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem("darkMode");
        return savedMode ? JSON.parse(savedMode) : false;
    });
    const [notifications, setNotifications] = useState([
        { id: 1, message: "New booking received", read: false, time: "2 min ago", type: "booking" },
        { id: 2, message: "Inventory low on brake pads", read: false, time: "1 hour ago", type: "inventory" },
    ]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const userRole = user?.role;
    const isAdmin = userRole === "admin";
    const isManager = userRole === "manager";
    const isCashier = userRole === "cashier";
    const isServiceAdvisor = userRole === "service_advisor";
    const isTechnician = userRole === "technician";

    // Permission-based navigation
    const getAvailableSections = () => {
        const sections = [];

        // Always available
        sections.push({ path: "/", label: "Dashboard", icon: "📊" });

        // Bookings & Invoices
        if (isCashier || isAdmin || isManager || isServiceAdvisor) {
            sections.push(
                { path: "/bookings", label: "Bookings", icon: "📅" },
                { path: "/invoices", label: "Invoices", icon: "🧾" }
            );
        }

        // Jobs - Remove general jobs for technicians, keep for others
        if (isServiceAdvisor || isAdmin || isManager) {
            sections.push({ path: "/jobs", label: "Jobs", icon: "🔧" });
        }

        // Technician specific - My Jobs only
        if (isTechnician) {
            sections.push({ path: "/jobs/my", label: "My Jobs", icon: "👨‍🔧" });
        }

        // Goods Requests
        if (isServiceAdvisor || isAdmin || isManager) {
            sections.push({ path: "/goods", label: "Goods Requests", icon: "📦" });
        }

        // Admin sections
        if (isAdmin || isManager) {
            sections.push(
                { type: "divider", label: "Administration" },
                { path: "/users", label: "Users", icon: "👥" },
                { path: "/leave/manage", label: "Manage Leave", icon: "📋" },
                { path: "/reports", label: "Reports", icon: "📈" }
            );
        }

        // Inventory - Remove for technicians
        if (isAdmin || isManager || isServiceAdvisor) {
            sections.push(
                { path: "/inventory", label: "Inventory", icon: "📦" }
            );
            sections.push({ path: "/inventory/low", label: "Low Stock", icon: "⚠️" });
        }

        // User sections
        if (user) {
            if (!isAdmin) {
                sections.push({ path: "/leave", label: "My Leave", icon: "🏖️" });
            }
            // Vehicles - Remove for technicians
            if (!isTechnician) {
                sections.push({ path: "/vehicles", label: "Vehicles", icon: "🚗" });
            }
            sections.push({ path: "/profile", label: "My Profile", icon: "👤" });
        }

        return sections;
    };

    const availableSections = getAvailableSections();

    // Toggle dark mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // Save dark mode preference
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
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
        }
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    // Theme configuration
    const theme = {
        background: darkMode ? "hsl(220, 15%, 16%)" : "hsl(0, 0%, 98%)",
        surface: darkMode ? "hsl(220, 15%, 20%)" : "hsl(0, 0%, 100%)",
        surfaceElevated: darkMode ? "hsl(220, 15%, 24%)" : "hsl(0, 0%, 100%)",
        primary: darkMode ? "hsl(210, 100%, 60%)" : "hsl(210, 100%, 50%)",
        primaryHover: darkMode ? "hsl(210, 100%, 55%)" : "hsl(210, 100%, 45%)",
        text: darkMode ? "hsl(0, 0%, 95%)" : "hsl(220, 15%, 20%)",
        textMuted: darkMode ? "hsl(0, 0%, 70%)" : "hsl(220, 10%, 50%)",
        border: darkMode ? "hsl(220, 15%, 30%)" : "hsl(220, 15%, 90%)",
        accent: darkMode ? "hsl(160, 70%, 50%)" : "hsl(160, 70%, 40%)",
        danger: darkMode ? "hsl(0, 70%, 60%)" : "hsl(0, 70%, 50%)",
    };

    // Styles
    const styles = {
        layout: {
            display: "flex",
            minHeight: "100vh",
            backgroundColor: theme.background,
            color: theme.text,
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            transition: "all 0.3s ease",
        } as React.CSSProperties,
        sidebar: {
            width: sidebarOpen ? 280 : 80,
            backgroundColor: theme.surface,
            borderRight: `1px solid ${theme.border}`,
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
        } as React.CSSProperties,
        header: {
            position: "sticky",
            top: 0,
            zIndex: 50,
            backgroundColor: theme.surface,
            borderBottom: `1px solid ${theme.border}`,
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backdropFilter: "blur(8px)",
        } as React.CSSProperties,
        main: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem",
            gap: "1.5rem",
        } as React.CSSProperties,
        navItem: (isActive: boolean) => ({
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            textDecoration: "none",
            color: isActive ? theme.primary : theme.textMuted,
            backgroundColor: isActive ?
                (darkMode ? "hsla(210, 100%, 60%, 0.15)" : "hsla(210, 100%, 50%, 0.1)") : "transparent",
            border: isActive ? `1px solid ${theme.primary}33` : "1px solid transparent",
            transition: "all 0.2s ease",
            margin: "0.25rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: isActive ? 600 : 500,
        }) as React.CSSProperties,
        button: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "transparent",
            color: theme.text,
            cursor: "pointer",
            transition: "all 0.2s ease",
        } as React.CSSProperties,
    };

    return (
        <div style={styles.layout}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                {/* Logo */}
                <div style={{
                    padding: sidebarOpen ? "1.5rem 1rem 1rem" : "1.5rem 0.5rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: sidebarOpen ? "flex-start" : "center",
                    gap: "0.75rem",
                    borderBottom: `1px solid ${theme.border}`,
                    marginBottom: "1rem"
                }}>
                    <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "white",
                        fontSize: "14px"
                    }}>
                        P
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                                Pitstop
                            </h1>
                            <div style={{
                                fontSize: "0.75rem",
                                color: theme.textMuted,
                                background: theme.background,
                                padding: "0.125rem 0.5rem",
                                borderRadius: "6px",
                                marginTop: "0.25rem"
                            }}>
                                {userRole}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, overflowY: "auto" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {availableSections.map((section, index) => {
                            if (section.type === "divider") {
                                return sidebarOpen ? (
                                    <li key={`divider-${index}`} style={{
                                        padding: "1rem 1rem 0.5rem",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: theme.textMuted,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                    }}>
                                        {section.label}
                                    </li>
                                ) : null;
                            }
                            return (
                                <li key={section.path}>
                                    <NavLink
                                        to={section.path}
                                        style={({ isActive }) => styles.navItem(isActive)}
                                        title={sidebarOpen ? "" : section.label}
                                    >
                                        <span style={{ fontSize: "1.125rem" }}>{section.icon}</span>
                                        {sidebarOpen && section.label}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar toggle */}
                <div style={{
                    padding: "1rem",
                    borderTop: `1px solid ${theme.border}`,
                    display: "flex",
                    justifyContent: sidebarOpen ? "flex-end" : "center"
                }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={styles.button}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                {/* Header */}
                <header style={styles.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                        {/* Search */}
                        <form onSubmit={handleSearch} style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                            <input
                                type="text"
                                placeholder="Search bookings, inventory, users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                                    borderRadius: "12px",
                                    border: `1px solid ${theme.border}`,
                                    backgroundColor: theme.background,
                                    color: theme.text,
                                    fontSize: "0.875rem",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = theme.primary;
                                    e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = theme.border;
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                            <svg
                                style={{
                                    position: "absolute",
                                    left: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    color: theme.textMuted,
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </form>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            style={styles.button}
                            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {darkMode ? "☀️" : "🌙"}
                        </button>

                        {/* Notifications */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={styles.button}
                                title="Notifications"
                            >
                                🔔
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "0.25rem",
                                        right: "0.25rem",
                                        backgroundColor: theme.danger,
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "1rem",
                                        height: "1rem",
                                        fontSize: "0.625rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "bold",
                                    }}>
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    backgroundColor: theme.surfaceElevated,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: "12px",
                                    padding: "0.5rem 0",
                                    width: "320px",
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                    zIndex: 100,
                                }}>
                                    <div style={{
                                        padding: "0.75rem 1rem",
                                        borderBottom: `1px solid ${theme.border}`,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <strong>Notifications</strong>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <button
                                                onClick={markAllAsRead}
                                                style={{
                                                    ...styles.button,
                                                    fontSize: "0.75rem",
                                                    padding: "0.25rem 0.5rem",
                                                }}
                                            >
                                                Mark all read
                                            </button>
                                            <button
                                                onClick={() => setShowNotifications(false)}
                                                style={styles.button}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div style={{ padding: "2rem", textAlign: "center", color: theme.textMuted }}>
                                            No notifications
                                        </div>
                                    ) : (
                                        <>
                                            {notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    style={{
                                                        padding: "0.75rem 1rem",
                                                        borderBottom: `1px solid ${theme.border}`,
                                                        backgroundColor: notification.read ? "transparent" :
                                                            (darkMode ? "hsla(210, 100%, 60%, 0.1)" : "hsla(210, 100%, 50%, 0.05)"),
                                                        cursor: "pointer",
                                                        transition: "background-color 0.2s ease",
                                                    }}
                                                    onClick={() => markAsRead(notification.id)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            darkMode ? "hsla(220, 15%, 25%, 1)" : "hsla(220, 15%, 97%, 1)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            notification.read ? "transparent" :
                                                                (darkMode ? "hsla(210, 100%, 60%, 0.1)" : "hsla(210, 100%, 50%, 0.05)");
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: "0.875rem",
                                                        fontWeight: notification.read ? 400 : 600,
                                                        marginBottom: "0.25rem",
                                                    }}>
                                                        {notification.message}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "0.75rem",
                                                        color: theme.textMuted,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}>
                                                        <span>{notification.time}</span>
                                                        <span style={{
                                                            padding: "0.125rem 0.5rem",
                                                            borderRadius: "6px",
                                                            backgroundColor: theme.background,
                                                            fontSize: "0.625rem",
                                                            textTransform: "uppercase",
                                                        }}>
                                                            {notification.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div style={{ padding: "0.75rem 1rem" }}>
                                                <button
                                                    onClick={clearAllNotifications}
                                                    style={{
                                                        ...styles.button,
                                                        width: "100%",
                                                        padding: "0.5rem",
                                                        backgroundColor: theme.background,
                                                        fontSize: "0.875rem",
                                                    }}
                                                >
                                                    Clear all notifications
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    ...styles.button,
                                    padding: "0.5rem 0.75rem",
                                    gap: "0.5rem",
                                    backgroundColor: theme.background,
                                    borderRadius: "10px",
                                }}
                            >
                                <div style={{
                                    width: "2rem",
                                    height: "2rem",
                                    borderRadius: "8px",
                                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: "0.875rem",
                                }}>
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                                        {user?.name || "User"}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                                        {userRole}
                                    </div>
                                </div>
                            </button>

                            {userMenuOpen && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    backgroundColor: theme.surfaceElevated,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: "12px",
                                    padding: "0.5rem",
                                    width: "200px",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                    zIndex: 100,
                                }}>
                                    <div style={{ padding: "0.5rem", fontSize: "0.875rem", color: theme.textMuted }}>
                                        {user?.email}
                                    </div>
                                    <NavLink
                                        to="/profile"
                                        style={{
                                            display: "block",
                                            padding: "0.5rem",
                                            borderRadius: "8px",
                                            textDecoration: "none",
                                            color: theme.text,
                                            fontSize: "0.875rem",
                                            transition: "background-color 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme.background;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        👤 My Profile
                                    </NavLink>
                                    <button
                                        onClick={logout}
                                        style={{
                                            width: "100%",
                                            padding: "0.5rem",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: "transparent",
                                            color: theme.danger,
                                            fontSize: "0.875rem",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            transition: "background-color 0.2s ease",
                                            marginTop: "0.25rem",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                darkMode ? "hsla(0, 70%, 60%, 0.1)" : "hsla(0, 70%, 50%, 0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main content area */}
                <main style={styles.main}>
                    <div style={{
                        backgroundColor: theme.surface,
                        borderRadius: "16px",
                        border: `1px solid ${theme.border}`,
                        padding: "1.5rem",
                        flex: 1,
                        minHeight: 0,
                    }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

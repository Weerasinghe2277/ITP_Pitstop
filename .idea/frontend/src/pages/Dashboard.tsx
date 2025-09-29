import { useAuth } from "../store/AuthContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const rolePermissions = {
    cashier: [
        { name: "Booking Management", path: "/bookings", icon: "📋", description: "Manage customer bookings and appointments", color: "#3B82F6" },
        { name: "Invoice Generation", path: "/invoices", icon: "🧾", description: "Create and manage customer invoices", color: "#10B981" },
        { name: "Leave Request", path: "/leave", icon: "🏖️", description: "Request time off work", color: "#F59E0B" },
        { name: "Create Vehicle", path: "/vehicles/new", icon: "🚗", description: "Add new vehicles to the system", color: "#8B5CF6" },
    ],
    service_advisor: [
        { name: "Jobs Management", path: "/jobs", icon: "🔧", description: "Oversee and manage all service jobs", color: "#EF4444" },
        { name: "My Created Jobs", path: "/jobs/my-created", icon: "📋", description: "View jobs you have created", color: "#3B82F6" },
        { name: "Create Job", path: "/jobs/new/:bookingId", icon: "➕", description: "Create new service jobs", color: "#06B6D4" },
        { name: "Goods Requests", path: "/goods", icon: "📦", description: "Request parts and materials", color: "#F97316" },
        { name: "Leave Request", path: "/leave", icon: "🏖️", description: "Request time off work", color: "#F59E0B" },
    ],
    technician: [
        { name: "My Jobs", path: "/jobs/my", icon: "🔧", description: "View and update your assigned jobs", color: "#8B5CF6" },
        { name: "Leave Request", path: "/leave", icon: "🏖️", description: "Request time off work", color: "#F59E0B" },
    ],
    manager: [
        { name: "Inventory Management", path: "/inventory", icon: "📊", description: "Monitor and manage inventory levels", color: "#06B6D4" },
        { name: "Goods Requests", path: "/goods/pending", icon: "📦", description: "Approve or reject goods requests", color: "#F97316" },
        { name: "User Management", path: "/users", icon: "👥", description: "Manage system users and permissions", color: "#EC4899" },
        { name: "Leave Request", path: "/leave", icon: "🏖️", description: "Request time off work", color: "#F59E0B" },
    ],
    admin: [
        { name: "Booking Management", path: "/bookings", icon: "📋", description: "Manage customer bookings and appointments", color: "#3B82F6" },
        { name: "Invoice Generation", path: "/invoices", icon: "🧾", description: "Create and manage customer invoices", color: "#10B981" },
        { name: "Jobs Management", path: "/jobs", icon: "🔧", description: "Oversee and manage all service jobs", color: "#EF4444" },
        { name: "Inventory Management", path: "/inventory", icon: "📊", description: "Monitor and manage inventory levels", color: "#06B6D4" },
        { name: "User Management", path: "/users", icon: "👥", description: "Manage system users and permissions", color: "#EC4899" },
        { name: "Leave Management", path: "/leave/manage", icon: "📝", description: "Manage employee leave requests", color: "#F59E0B" },
        { name: "Create Vehicle", path: "/vehicles/new", icon: "🚗", description: "Add new vehicles to the system", color: "#8B5CF6" },
    ],
    owner: [
        { name: "Booking Management", path: "/bookings", icon: "📋", description: "Manage customer bookings and appointments", color: "#3B82F6" },
        { name: "Invoice Generation", path: "/invoices", icon: "🧾", description: "Create and manage customer invoices", color: "#10B981" },
        { name: "Jobs Management", path: "/jobs", icon: "🔧", description: "Oversee and manage all service jobs", color: "#EF4444" },
        { name: "Inventory Management", path: "/inventory", icon: "📊", description: "Monitor and manage inventory levels", color: "#06B6D4" },
        { name: "User Management", path: "/users", icon: "👥", description: "Manage system users and permissions", color: "#EC4899" },
        { name: "Leave Management", path: "/leave/manage", icon: "📝", description: "Manage employee leave requests", color: "#F59E0B" },
        { name: "Create Vehicle", path: "/vehicles/new", icon: "🚗", description: "Add new vehicles to the system", color: "#8B5CF6" },
        { name: "Salary Report", path: "/reports/salary", icon: "💰", description: "View salary reports and analytics", color: "#84CC16" },
        { name: "Stock Report", path: "/reports/stock", icon: "📈", description: "View stock reports and analytics", color: "#F97316" },
        { name: "Booking Report", path: "/reports/bookings", icon: "📅", description: "View booking reports and analytics", color: "#8B5CF6" },
        { name: "Work Allocation Report", path: "/reports/work-allocation", icon: "👨‍💼", description: "View work allocation reports", color: "#06B6D4" },
        { name: "Employee Report", path: "/reports/employees", icon: "👥", description: "View employee performance reports", color: "#EC4899" },
    ],
};

const getRoleStats = (role) => {
    const stats = {
        cashier: [
            { title: "Today's Bookings", value: 8, change: +2, icon: "📋", trend: "up" },
            { title: "Pending Invoices", value: 3, change: -1, icon: "🧾", trend: "down" },
            { title: "Completed Jobs", value: 12, change: +4, icon: "✅", trend: "up" },
        ],
        service_advisor: [
            { title: "Active Jobs", value: 15, change: +3, icon: "🔧", trend: "up" },
            { title: "Parts Requests", value: 7, change: +2, icon: "📦", trend: "up" },
            { title: "Completed Today", value: 9, change: +1, icon: "✅", trend: "up" },
        ],
        technician: [
            { title: "Assigned Jobs", value: 5, change: 0, icon: "🔧", trend: "neutral" },
            { title: "Completed Today", value: 3, change: +1, icon: "✅", trend: "up" },
            { title: "Pending Parts", value: 2, change: -1, icon: "⏳", trend: "down" },
        ],
        manager: [
            { title: "Team Members", value: 12, change: 0, icon: "👥", trend: "neutral" },
            { title: "Pending Approvals", value: 5, change: +2, icon: "📝", trend: "up" },
            { title: "Low Stock Items", value: 8, change: -3, icon: "📊", trend: "down" },
        ],
        admin: [
            { title: "System Users", value: 24, change: +1, icon: "👥", trend: "up" },
            { title: "Active Sessions", value: 18, change: -2, icon: "🔐", trend: "down" },
            { title: "Pending Tasks", value: 7, change: +1, icon: "📋", trend: "up" },
        ],
        owner: [
            { title: "Monthly Revenue", value: "$24,582", change: +12, icon: "💰", trend: "up" },
            { title: "New Customers", value: 34, change: +5, icon: "👥", trend: "up" },
            { title: "Active Jobs", value: 27, change: +3, icon: "🔧", trend: "up" },
        ],
    };

    return stats[role] || [];
};

const getRecentActivity = (role) => {
    const activities = {
        cashier: [
            { action: "Created invoice", target: "INV-00528", time: "10 mins ago", type: "success" },
            { action: "Updated booking", target: "BK-1024", time: "25 mins ago", type: "info" },
            { action: "Processed payment", target: "$152.50", time: "1 hour ago", type: "success" },
        ],
        service_advisor: [
            { action: "Assigned job", target: "JV-2025", time: "15 mins ago", type: "info" },
            { action: "Ordered parts", target: "Fuel Filter", time: "40 mins ago", type: "warning" },
            { action: "Completed job", target: "JV-2021", time: "2 hours ago", type: "success" },
        ],
        technician: [
            { action: "Started job", target: "JV-2025", time: "30 mins ago", type: "info" },
            { action: "Requested parts", target: "Brake Pads", time: "1 hour ago", type: "warning" },
            { action: "Completed job", target: "JV-2020", time: "2 hours ago", type: "success" },
        ],
        manager: [
            { action: "Approved request", target: "GR-1042", time: "20 mins ago", type: "success" },
            { action: "Updated inventory", target: "Engine Oil", time: "45 mins ago", type: "info" },
            { action: "Scheduled maintenance", target: "Workshop", time: "3 hours ago", type: "info" },
        ],
        admin: [
            { action: "Added new user", target: "Sarah Miller", time: "1 hour ago", type: "success" },
            { action: "Updated permissions", target: "Technician role", time: "3 hours ago", type: "info" },
            { action: "System backup", target: "Completed", time: "5 hours ago", type: "success" },
        ],
        owner: [
            { action: "Reviewed report", target: "Monthly Revenue", time: "30 mins ago", type: "info" },
            { action: "Approved budget", target: "Q2 Marketing", time: "2 hours ago", type: "success" },
            { action: "Met with", target: "Supplier representative", time: "4 hours ago", type: "info" },
        ],
    };

    return activities[role] || [];
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

// Helper function to get display name
const getUserDisplayName = (user) => {
    // Check if user has profile with firstName and lastName
    if (user.profile && user.profile.firstName && user.profile.lastName) {
        return `${user.profile.firstName} ${user.profile.lastName}`;
    }

    // Check if user has profile with firstName only
    if (user.profile && user.profile.firstName && user.profile.firstName.trim() !== '') {
        return user.profile.firstName;
    }

    // Check if user has profile with lastName only
    if (user.profile && user.profile.lastName && user.profile.lastName.trim() !== '') {
        return user.profile.lastName;
    }

    // If user has a name property and it's not empty, use it
    if (user.name && user.name.trim() !== '') {
        return user.name;
    }

    // If user has a username property and it's not empty, use it
    if (user.username && user.username.trim() !== '') {
        return user.username;
    }

    // If user has an email property and it's not empty, extract name from email
    if (user.email && user.email.trim() !== '') {
        return user.email.split('@')[0];
    }

    // Fallback to role-based name
    return user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ');
};

// Helper function to get initials for avatar
const getUserInitials = (user) => {
    // Check for profile firstName and lastName first
    if (user.profile && user.profile.firstName && user.profile.lastName) {
        return (user.profile.firstName.charAt(0) + user.profile.lastName.charAt(0)).toUpperCase();
    }

    // Check for profile firstName only
    if (user.profile && user.profile.firstName) {
        return user.profile.firstName.substring(0, 2).toUpperCase();
    }

    const displayName = getUserDisplayName(user);

    // If display name has spaces, take first letter of each word
    const nameParts = displayName.split(' ');
    if (nameParts.length > 1) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }

    // Otherwise, take first two letters of the name
    return displayName.substring(0, 2).toUpperCase();
};

export default function Dashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem("darkMode");
        return savedMode ? JSON.parse(savedMode) : false;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '18px',
            }}>
                Please log in to view the dashboard
            </div>
        );
    }

    const permissions = rolePermissions[user.role] || [];
    const stats = getRoleStats(user.role);
    const recentActivity = getRecentActivity(user.role);
    const greeting = getGreeting();
    const displayName = getUserDisplayName(user);
    const userInitials = getUserInitials(user);

    // Theme configuration
    const theme = {
        background: darkMode ? "hsl(220, 15%, 16%)" : "hsl(0, 0%, 98%)",
        surface: darkMode ? "hsl(220, 15%, 20%)" : "hsl(0, 0%, 100%)",
        surfaceElevated: darkMode ? "hsl(220, 15%, 24%)" : "hsl(0, 0%, 100%)",
        text: darkMode ? "hsl(0, 0%, 95%)" : "hsl(220, 15%, 20%)",
        textMuted: darkMode ? "hsl(0, 0%, 70%)" : "hsl(220, 10%, 50%)",
        border: darkMode ? "hsl(220, 15%, 30%)" : "hsl(220, 15%, 90%)",
        primary: darkMode ? "hsl(210, 100%, 60%)" : "hsl(210, 100%, 50%)",
    };

    // Filter permissions based on search and category
    const filteredPermissions = permissions.filter(permission => {
        const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "all" || permission.name.includes(activeCategory);
        return matchesSearch && matchesCategory;
    });

    // Get unique categories for filter
    const categories = ["all", ...new Set(permissions.map(p => {
        if (p.name.includes("Management")) return "Management";
        if (p.name.includes("Report")) return "Reports";
        if (p.name.includes("Request")) return "Requests";
        return "General";
    }))];

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.background,
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            transition: 'background 0.3s ease',
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
            }}>
                {/* Enhanced Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    gap: '16px',
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '12px',
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${theme.primary}, #8B5CF6)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '600',
                                boxShadow: `0 4px 12px ${theme.primary}40`,
                            }}>
                                {userInitials}
                            </div>
                            <div>
                                <p style={{
                                    fontSize: '14px',
                                    color: theme.textMuted,
                                    margin: '0 0 4px 0',
                                    fontWeight: '500',
                                }}>
                                    {greeting}
                                </p>
                                <h1 style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    color: theme.text,
                                    margin: 0,
                                    background: `linear-gradient(135deg, ${theme.text}, ${theme.primary})`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    color: 'transparent',
                                }}>
                                    Welcome back, {displayName}
                                </h1>
                            </div>
                        </div>
                        <p style={{
                            fontSize: '14px',
                            color: theme.textMuted,
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{
                                padding: '4px 8px',
                                background: theme.surface,
                                borderRadius: '6px',
                                fontSize: '12px',
                            }}>
                                {user.role.replace('_', ' ').toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>
                                {currentTime.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                    }}>
                        <div style={{
                            padding: '12px 20px',
                            background: theme.surface,
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: theme.primary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: `1px solid ${theme.border}`,
                        }}>
                            <span>🕒</span>
                            {currentTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Overview Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }}>
                    {stats.map((stat, index) => (
                        <div key={index} style={{
                            background: theme.surface,
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            border: `1px solid ${theme.border}`,
                        }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                 e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.15)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                             }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#6B7280'}20, ${stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#6B7280'}40)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                border: `1px solid ${theme.border}`,
                            }}>
                                {stat.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontSize: '14px',
                                    color: theme.textMuted,
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                }}>
                                    {stat.title}
                                </span>
                                <span style={{
                                    fontSize: '32px',
                                    fontWeight: '700',
                                    color: theme.text,
                                    display: 'block',
                                    marginBottom: '8px',
                                }}>
                                    {stat.value}
                                </span>
                                <span style={{
                                    fontSize: '14px',
                                    color: stat.change >= 0 ? '#10b981' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '500',
                                }}>
                                    {stat.change >= 0 ? '↗' : '↘'}
                                    {Math.abs(stat.change)}% from yesterday
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filter Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: theme.text,
                            margin: '0 0 8px 0',
                        }}>
                            Quick Access
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: theme.textMuted,
                            margin: 0,
                        }}>
                            Quickly navigate to your most used features
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            position: 'relative',
                            minWidth: '280px',
                        }}>
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '12px 16px 12px 44px',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    width: '100%',
                                    background: theme.surface,
                                    color: theme.text,
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    transition: 'all 0.2s ease',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = theme.primary;
                                    e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = theme.border;
                                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: theme.textMuted,
                                fontSize: '16px',
                            }}>
                                🔍
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                        }}>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    style={{
                                        padding: '10px 16px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: activeCategory === category ? theme.primary : theme.surface,
                                        color: activeCategory === category ? 'white' : theme.text,
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s ease',
                                        border: `1px solid ${theme.border}`,
                                    }}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: '32px',
                    alignItems: 'flex-start',
                }}>
                    {/* Enhanced Main Content - Permissions Cards */}
                    <div>
                        {filteredPermissions.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '24px',
                            }}>
                                {filteredPermissions.map((permission, index) => (
                                    <Link
                                        key={index}
                                        to={permission.path.replace(":bookingId", "1")}
                                        style={{
                                            padding: '24px',
                                            background: theme.surface,
                                            borderRadius: '20px',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: `1px solid ${theme.border}`,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            height: '140px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.15)';
                                            e.currentTarget.style.borderColor = permission.color;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                                            e.currentTarget.style.borderColor = theme.border;
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: `linear-gradient(90deg, ${permission.color}, ${permission.color}80)`,
                                        }} />

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            marginBottom: '16px',
                                            flex: 1,
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: `${permission.color}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '16px',
                                                fontSize: '20px',
                                                border: `1px solid ${permission.color}30`,
                                            }}>
                                                {permission.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: theme.text,
                                                    margin: '0 0 8px 0',
                                                }}>
                                                    {permission.name}
                                                </h3>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: theme.textMuted,
                                                    margin: 0,
                                                    lineHeight: '1.5',
                                                }}>
                                                    {permission.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}>
                                            <span style={{
                                                fontSize: '14px',
                                                color: permission.color,
                                                fontWeight: '600',
                                            }}>
                                                Access feature →
                                            </span>
                                            <div style={{
                                                padding: '4px 12px',
                                                background: `${permission.color}10`,
                                                color: permission.color,
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                border: `1px solid ${permission.color}20`,
                                            }}>
                                                {permission.name.includes("Management") ? "Management" :
                                                    permission.name.includes("Report") ? "Analytics" : "Action"}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '80px 20px',
                                background: theme.surface,
                                borderRadius: '20px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                border: `1px solid ${theme.border}`,
                            }}>
                                <div style={{
                                    fontSize: '64px',
                                    marginBottom: '16px',
                                    opacity: 0.5,
                                }}>
                                    🔍
                                </div>
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: theme.text,
                                    marginBottom: '8px',
                                }}>
                                    No features found
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: theme.textMuted,
                                }}>
                                    Try adjusting your search or filter criteria
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Sidebar */}
                    <div style={{ position: 'sticky', top: '24px' }}>
                        {/* Enhanced Recent Activity */}
                        <div style={{
                            background: theme.surface,
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            marginBottom: '24px',
                            border: `1px solid ${theme.border}`,
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                            }}>
                                <h2 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: theme.text,
                                    margin: 0,
                                }}>
                                    Recent Activity
                                </h2>
                                <span style={{
                                    fontSize: '12px',
                                    color: theme.primary,
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s ease',
                                }}
                                      onMouseEnter={(e) => {
                                          e.currentTarget.style.background = `${theme.primary}10`;
                                      }}
                                      onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'transparent';
                                      }}>
                                    View All
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                            }}>
                                {recentActivity.map((activity, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: theme.background,
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        border: `1px solid ${theme.border}`,
                                    }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.background = theme.surfaceElevated;
                                             e.currentTarget.style.transform = 'translateX(4px)';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.background = theme.background;
                                             e.currentTarget.style.transform = 'translateX(0)';
                                         }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: activity.type === 'success' ? '#10b98120' :
                                                activity.type === 'warning' ? '#f59e0b20' : '#3b82f620',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '12px',
                                            flexShrink: 0,
                                            border: `1px solid ${activity.type === 'success' ? '#10b98130' :
                                                activity.type === 'warning' ? '#f59e0b30' : '#3b82f630'}`,
                                        }}>
                                            <span style={{
                                                color: activity.type === 'success' ? '#10b981' :
                                                    activity.type === 'warning' ? '#f59e0b' : '#3b82f6',
                                                fontSize: '14px'
                                            }}>
                                                {activity.type === 'success' ? '✓' : activity.type === 'warning' ? '⚠' : 'ℹ'}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                color: theme.text,
                                                margin: '0 0 4px 0',
                                            }}>
                                                {activity.action} <span style={{ color: theme.primary, fontWeight: '600' }}>{activity.target}</span>
                                            </p>
                                            <p style={{
                                                fontSize: '12px',
                                                color: theme.textMuted,
                                                margin: 0,
                                            }}>
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Quick Help Section */}
                        <div style={{
                            background: `linear-gradient(135deg, ${theme.primary}, #8B5CF6)`,
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            color: 'white',
                            border: `1px solid ${theme.border}`,
                        }}>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '16px',
                            }}>
                                🆘 Need Help?
                            </h2>
                            <p style={{
                                fontSize: '14px',
                                marginBottom: '20px',
                                lineHeight: '1.5',
                                opacity: 0.9,
                            }}>
                                Our support team is here to help you with any questions or issues.
                            </p>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                }}
                                     onMouseEnter={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                     }}
                                     onMouseLeave={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                     }}>
                                    <span style={{ marginRight: '12px', fontSize: '16px' }}>📞</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Call Support</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                }}
                                     onMouseEnter={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                     }}
                                     onMouseLeave={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                     }}>
                                    <span style={{ marginRight: '12px', fontSize: '16px' }}>✉️</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Email Support</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                }}
                                     onMouseEnter={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                     }}
                                     onMouseLeave={(e) => {
                                         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                     }}>
                                    <span style={{ marginRight: '12px', fontSize: '16px' }}>📚</span>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>View Documentation</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
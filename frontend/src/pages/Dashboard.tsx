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

export default function Dashboard() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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

    const permissions = rolePermissions[user.role as keyof typeof rolePermissions] || [];
    const stats = getRoleStats(user.role);
    const recentActivity = getRecentActivity(user.role);
    const greeting = getGreeting();

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
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
            }}>
                {/* Enhanced Header Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    gap: '16px',
                }}>
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '600',
                            }}>
                                {user.name?.charAt(0) || user.role.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    margin: '0 0 4px 0',
                                    fontWeight: '500',
                                }}>
                                    {greeting}
                                </p>
                                <h1 style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    margin: 0,
                                }}>
                                    {user.name || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </h1>
                            </div>
                        </div>
                        <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span>📅</span>
                            {currentTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                    }}>
                        <div style={{
                            padding: '12px 20px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span>🕒</span>
                            {currentTime.toLocaleTimeString('en-US')}
                        </div>
                    </div>
                </div>

                {/* Enhanced Stats Overview Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }}>
                    {stats.map((stat, index) => (
                        <div key={index} style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer',
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                            }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '16px',
                                background: `linear-gradient(135deg, ${stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#6B7280'}20, ${stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#6B7280'}40)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                            }}>
                                {stat.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                    display: 'block',
                                    marginBottom: '4px',
                                }}>
                                    {stat.title}
                                </span>
                                <span style={{
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#1f2937',
                                    display: 'block',
                                    marginBottom: '4px',
                                }}>
                                    {stat.value}
                                </span>
                                <span style={{
                                    fontSize: '14px',
                                    color: stat.change >= 0 ? '#10b981' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}>
                                    {stat.change >= 0 ? '📈' : '📉'}
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
                    marginBottom: '24px',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: 0,
                    }}>
                        Quick Access
                    </h2>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            position: 'relative',
                            minWidth: '250px',
                        }}>
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '12px 16px 12px 40px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    width: '100%',
                                    background: 'white',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
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
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: activeCategory === category ? '#3b82f6' : 'white',
                                        color: activeCategory === category ? 'white' : '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.2s ease',
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
                    gridTemplateColumns: '1fr 350px',
                    gap: '32px',
                }}>
                    {/* Enhanced Main Content - Permissions Cards */}
                    <div>
                        {filteredPermissions.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '24px',
                            }}>
                                {filteredPermissions.map((permission, index) => (
                                    <Link
                                        key={index}
                                        to={permission.path.replace(":bookingId", "1")}
                                        style={{
                                            padding: '24px',
                                            background: 'white',
                                            borderRadius: '20px',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: `2px solid ${permission.color}20`,
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.15)';
                                            e.currentTarget.style.borderColor = `${permission.color}40`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                                            e.currentTarget.style.borderColor = `${permission.color}20`;
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '4px',
                                            background: `linear-gradient(90deg, ${permission.color}, ${permission.color}80)`,
                                        }} />

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            marginBottom: '16px',
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: `${permission.color}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '16px',
                                                fontSize: '20px',
                                            }}>
                                                {permission.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    color: '#1f2937',
                                                    margin: '0 0 4px 0',
                                                }}>
                                                    {permission.name}
                                                </h3>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#6b7280',
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
                                            marginTop: 'auto',
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
                                padding: '60px 20px',
                                background: 'white',
                                borderRadius: '20px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            }}>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                }}>
                                    🔍
                                </div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    marginBottom: '8px',
                                }}>
                                    No features found
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#6b7280',
                                }}>
                                    Try adjusting your search or filter criteria
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Sidebar */}
                    <div>
                        {/* Enhanced Recent Activity */}
                        <div style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            marginBottom: '24px',
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
                                    color: '#1f2937',
                                    margin: 0,
                                }}>
                                    Recent Activity
                                </h2>
                                <span style={{
                                    fontSize: '12px',
                                    color: '#3b82f6',
                                    fontWeight: '500',
                                    cursor: 'pointer',
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
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: '#f8fafc',
                                        transition: 'background 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f1f5f9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
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
                                                color: '#1f2937',
                                                margin: '0 0 4px 0',
                                            }}>
                                                {activity.action} <span style={{ color: '#3b82f6', fontWeight: '600' }}>{activity.target}</span>
                                            </p>
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#9ca3af',
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '20px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            color: 'white',
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
                                    borderRadius: '8px',
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
                                    borderRadius: '8px',
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
                                    borderRadius: '8px',
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
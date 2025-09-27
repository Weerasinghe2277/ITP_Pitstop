// frontend/src/features/reports/ReportsList.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { http } from "../../lib/http";

const reports = [
    {
        title: "Salary Report",
        description: "View detailed salary and payroll information for employees.",
        path: "/reports/salary",
        icon: "👤",
        color: "#3b82f6",
        bgColor: "#dbeafe"
    },
    {
        title: "Stock Report",
        description: "Analyze inventory stock levels and trends.",
        path: "/reports/stock",
        icon: "📦",
        color: "#10b981",
        bgColor: "#d1fae5"
    },
    {
        title: "Booking Report",
        description: "Review booking statistics and performance metrics.",
        path: "/reports/bookings",
        icon: "📅",
        color: "#8b5cf6",
        bgColor: "#ede9fe"
    },
    {
        title: "Work Allocation Report",
        description: "Examine job assignments and work distribution.",
        path: "/reports/work-allocation",
        icon: "🏢",
        color: "#f59e0b",
        bgColor: "#fef3c7"
    },
    {
        title: "Employee Report",
        description: "Access comprehensive employee performance data.",
        path: "/reports/employees",
        icon: "👥",
        color: "#ef4444",
        bgColor: "#fee2e2"
    },
    {
        title: "Financial Report",
        description: "Review revenue, expenses and financial metrics.",
        path: "/reports/financial",
        icon: "💰",
        color: "#06b6d4",
        bgColor: "#cffafe"
    },
    {
        title: "Customer Report",
        description: "Analyze customer data and service history.",
        path: "/reports/customers",
        icon: "🤝",
        color: "#84cc16",
        bgColor: "#ecfccb"
    },
    {
        title: "Performance Report",
        description: "Track KPIs and business performance indicators.",
        path: "/reports/performance",
        icon: "📊",
        color: "#f97316",
        bgColor: "#fed7aa"
    }
];

const ReportsList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredReports, setFilteredReports] = useState(reports);
    const [recentReports, setRecentReports] = useState([]);
    const [reportStats, setReportStats] = useState({
        totalGenerated: 0,
        thisMonth: 0,
        lastGenerated: null
    });
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        loadReportStats();
        loadRecentReports();
    }, []);

    useEffect(() => {
        const filtered = reports.filter(report =>
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredReports(filtered);
    }, [searchTerm]);

    async function loadReportStats() {
        try {
            const response = await http.get("/reports/statistics");
            setReportStats(response.data?.stats || {
                totalGenerated: 0,
                thisMonth: 0,
                lastGenerated: null
            });
        } catch (error) {
            // Stats not available, use defaults
        }
    }

    async function loadRecentReports() {
        try {
            const response = await http.get("/reports/recent");
            setRecentReports(response.data?.reports || []);
        } catch (error) {
            // Recent reports not available
        }
    }

    const theme = {
        background: "#f9fafb",
        text: "#111827",
        card: "#ffffff",
        border: "#e5e7eb",
        mutedText: "#6b7280",
    };

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: theme.background,
            color: theme.text,
            minHeight: '100vh'
        }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: theme.text,
                        margin: 0
                    }}>
                        Reports Dashboard
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: theme.mutedText,
                        margin: '8px 0 0 0'
                    }}>
                        Generate and view comprehensive business reports
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🖨️ Print
                    </button>
                    <Link
                        to="/reports/custom"
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        ⚙️ Custom Report
                    </Link>
                </div>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: message.type === 'error' ? '#991b1b' : '#166534',
                    border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
                }}>
                    {message.text}
                    <button
                        onClick={() => setMessage({ text: "", type: "" })}
                        style={{
                            float: 'right',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard
                    title="Total Reports Generated"
                    value={reportStats.totalGenerated}
                    icon="📈"
                    color="#3b82f6"
                />
                <StatCard
                    title="Reports This Month"
                    value={reportStats.thisMonth}
                    icon="📅"
                    color="#10b981"
                />
                <StatCard
                    title="Available Reports"
                    value={reports.length}
                    icon="📊"
                    color="#8b5cf6"
                />
                <StatCard
                    title="Last Generated"
                    value={reportStats.lastGenerated ?
                        new Date(reportStats.lastGenerated).toLocaleDateString() : 'Never'
                    }
                    icon="🕒"
                    color="#f59e0b"
                />
            </div>

            {/* Search and Filters */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`,
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'end',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: theme.text,
                            marginBottom: '6px'
                        }}>
                            🔍 Search Reports
                        </label>
                        <input
                            type="text"
                            placeholder="Search by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: `1px solid ${theme.border}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#000000'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setSearchTerm("")}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Reports Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {filteredReports.map((report, index) => (
                    <ReportCard key={index} report={report} />
                ))}
            </div>

            {/* No Results */}
            {filteredReports.length === 0 && (
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    padding: '60px 20px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`,
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme.text,
                        margin: '0 0 8px 0'
                    }}>
                        No Reports Found
                    </h3>
                    <p style={{
                        color: theme.mutedText,
                        margin: '0 0 20px 0'
                    }}>
                        No reports match your search criteria. Try adjusting your search terms.
                    </p>
                    <button
                        onClick={() => setSearchTerm("")}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Show All Reports
                    </button>
                </div>
            )}

            {/* Recent Reports Section */}
            {recentReports.length > 0 && (
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`
                }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        🕒 Recent Reports
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentReports.slice(0, 5).map((report, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`
                            }}>
                                <div>
                                    <p style={{
                                        margin: 0,
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        {report.title}
                                    </p>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '12px',
                                        color: theme.mutedText
                                    }}>
                                        Generated on {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link
                                    to={`/reports/view/${report.id}`}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        textDecoration: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }}
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function ReportCard({ report }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: isHovered ? '0 10px 15px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'pointer'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: report.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                }}>
                    {report.icon}
                </div>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                }}>
                    {report.title}
                </h3>
            </div>

            <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0 0 20px 0'
            }}>
                {report.description}
            </p>

            <Link
                to={report.path}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: report.color,
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                }}
            >
                📊 View Report
            </Link>
        </div>
    );
}

function StatCard({ title, value, icon, color }) {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
        }}>
            <div style={{
                fontSize: '32px',
                marginBottom: '12px'
            }}>
                {icon}
            </div>
            <h3 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '700',
                color: color
            }}>
                {value}
            </h3>
            <p style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
            }}>
                {title}
            </p>
        </div>
    );
}

export default ReportsList;

import { useAuth } from "../../store/AuthContext";
import { useState, useEffect } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

export default function SalaryReport() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [salaryStats, setSalaryStats] = useState({
        totalSalaries: 0,
        averageSalary: 0,
        highestSalary: 0,
        lowestSalary: 0,
        totalEmployees: 0
    });

    // Fix role check - use array.includes() for multiple roles
    if (!user || !["owner", "admin", "manager"].includes(user.role)) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f7fa',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '40px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444', margin: '0 0 8px 0' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: '#6b7280', margin: '0 0 20px 0' }}>
                        This page is restricted to Owners, Admins, and Managers only.
                    </p>
                    <Link
                        to="/dashboard"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    async function loadEmployees() {
        setIsLoading(true);
        try {
            const response = await http.get(`/employees/salary-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
            const employeeData = response.data?.employees || [];
            setEmployees(employeeData);
            setFilteredEmployees(employeeData);

            // Extract unique departments
            const depts = [...new Set(employeeData.map(emp => emp.department).filter(Boolean))];
            setDepartments(depts);

            // Calculate statistics
            if (employeeData.length > 0) {
                const salaries = employeeData.map(emp => emp.salary || 0);
                setSalaryStats({
                    totalSalaries: salaries.reduce((sum, salary) => sum + salary, 0),
                    averageSalary: salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length,
                    highestSalary: Math.max(...salaries),
                    lowestSalary: Math.min(...salaries),
                    totalEmployees: employeeData.length
                });
            }
        } catch (error) {
            setMessage({ text: "Failed to load salary data", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadEmployees();
    }, [dateRange]);

    useEffect(() => {
        let filtered = employees;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(employee =>
                employee.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply department filter
        if (departmentFilter !== "all") {
            filtered = filtered.filter(employee => employee.department === departmentFilter);
        }

        setFilteredEmployees(filtered);
        setCurrentPage(1);
    }, [searchTerm, departmentFilter, employees]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    async function exportSalaryReport() {
        try {
            const csvContent = [
                ['Employee ID', 'Name', 'Email', 'Department', 'Position', 'Salary (LKR)', 'Status'].join(','),
                ...filteredEmployees.map(emp => [
                    emp.employeeId || 'N/A',
                    `${emp.profile?.firstName || ''} ${emp.profile?.lastName || ''}`.trim(),
                    emp.email,
                    emp.department || 'N/A',
                    emp.position || 'N/A',
                    emp.salary || 0,
                    emp.status || 'active'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `salary-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            setMessage({ text: "Salary report exported successfully", type: "success" });
        } catch (error) {
            setMessage({ text: "Failed to export salary report", type: "error" });
        }
    }

    const theme = {
        background: "#f5f7fa",
        text: "#1f2937",
        card: "#ffffff",
        border: "#e5e7eb",
        mutedText: "#6b7280",
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div>Loading salary report...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: theme.background,
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
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
                        <Link
                            to="/reports"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                marginBottom: '8px',
                                fontSize: '14px'
                            }}
                        >
                            ← Back to Reports
                        </Link>
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: theme.text,
                            margin: 0
                        }}>
                            💰 Employee Salary Report
                        </h1>
                        <p style={{
                            fontSize: '16px',
                            color: theme.mutedText,
                            margin: '8px 0 0 0'
                        }}>
                            {dateRange.startDate} to {dateRange.endDate}
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
                                cursor: 'pointer'
                            }}
                        >
                            🖨️ Print Report
                        </button>
                        <button
                            onClick={exportSalaryReport}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            📊 Export CSV
                        </button>
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '32px'
                }}>
                    <StatCard
                        title="Total Salaries"
                        value={`LKR ${salaryStats.totalSalaries.toLocaleString()}`}
                        icon="💰"
                        color="#3b82f6"
                    />
                    <StatCard
                        title="Average Salary"
                        value={`LKR ${Math.round(salaryStats.averageSalary).toLocaleString()}`}
                        icon="📊"
                        color="#10b981"
                    />
                    <StatCard
                        title="Highest Salary"
                        value={`LKR ${salaryStats.highestSalary.toLocaleString()}`}
                        icon="📈"
                        color="#f59e0b"
                    />
                    <StatCard
                        title="Lowest Salary"
                        value={`LKR ${salaryStats.lowestSalary.toLocaleString()}`}
                        icon="📉"
                        color="#ef4444"
                    />
                    <StatCard
                        title="Total Employees"
                        value={salaryStats.totalEmployees}
                        icon="👥"
                        color="#8b5cf6"
                    />
                </div>

                {/* Filters Section */}
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`,
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '20px'
                    }}>
                        🔍 Filters & Search
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                marginBottom: '6px'
                            }}>
                                Search Employees
                            </label>
                            <input
                                type="text"
                                placeholder="Search by name, email, or employee ID..."
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

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                marginBottom: '6px'
                            }}>
                                Department
                            </label>
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#ffffff',
                                    color: '#000000'
                                }}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                marginBottom: '6px'
                            }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
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

                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                marginBottom: '6px'
                            }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
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
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setDepartmentFilter("all");
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Salary Table */}
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '24px 24px 0 24px'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: theme.text,
                            margin: '0 0 20px 0'
                        }}>
                            👥 Employee Salary Details ({filteredEmployees.length})
                        </h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ backgroundColor: '#f9fafb' }}>
                                <th style={tableHeaderStyle}>Employee ID</th>
                                <th style={tableHeaderStyle}>Name</th>
                                <th style={tableHeaderStyle}>Email</th>
                                <th style={tableHeaderStyle}>Department</th>
                                <th style={tableHeaderStyle}>Position</th>
                                <th style={tableHeaderStyle}>Salary (LKR)</th>
                                <th style={tableHeaderStyle}>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentEmployees.length > 0 ? (
                                currentEmployees.map((employee) => (
                                    <tr key={employee._id} style={{
                                        borderBottom: `1px solid ${theme.border}`
                                    }}>
                                        <td style={tableCellStyle}>
                                                <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                                                    {employee.employeeId || 'N/A'}
                                                </span>
                                        </td>
                                        <td style={tableCellStyle}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {employee.profile?.firstName} {employee.profile?.lastName}
                                                </div>
                                                {employee.profile?.phone && (
                                                    <div style={{ fontSize: '12px', color: theme.mutedText }}>
                                                        {employee.profile.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={tableCellStyle}>{employee.email}</td>
                                        <td style={tableCellStyle}>
                                            {employee.department ? (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#f3f4f6',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                        {employee.department}
                                                    </span>
                                            ) : 'N/A'}
                                        </td>
                                        <td style={tableCellStyle}>{employee.position || 'N/A'}</td>
                                        <td style={tableCellStyle}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    color: '#10b981',
                                                    fontSize: '16px'
                                                }}>
                                                    {employee.salary ? `${employee.salary.toLocaleString()}` : 'N/A'}
                                                </span>
                                        </td>
                                        <td style={tableCellStyle}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: employee.status === 'active' ? '#d1fae5' : '#fee2e2',
                                                    color: employee.status === 'active' ? '#065f46' : '#991b1b',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}>
                                                    {employee.status || 'active'}
                                                </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{
                                        ...tableCellStyle,
                                        textAlign: 'center',
                                        color: theme.mutedText,
                                        fontStyle: 'italic',
                                        padding: '40px 20px'
                                    }}>
                                        No employees found matching your criteria
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 24px',
                            borderTop: `1px solid ${theme.border}`,
                            backgroundColor: '#f9fafb'
                        }}>
                            <div style={{ fontSize: '14px', color: theme.mutedText }}>
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length} employees
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: currentPage === 1 ? '#e5e7eb' : '#3b82f6',
                                        color: currentPage === 1 ? '#9ca3af' : 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 12px',
                                    fontSize: '14px',
                                    color: theme.mutedText
                                }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#3b82f6',
                                        color: currentPage === totalPages ? '#9ca3af' : 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
                fontSize: '20px',
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

const tableHeaderStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
};

const tableCellStyle = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
    verticalAlign: 'top'
};

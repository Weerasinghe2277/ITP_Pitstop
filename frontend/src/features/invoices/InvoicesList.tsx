// src/features/invoices/InvoicesList.jsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../../lib/http";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";

export default function InvoicesList() {
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const pageSize = 10;

    // Debounce search input
    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 400);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Load invoices
    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                const response = await http.get("/invoices");
                if (!cancelled) setInvoices(response.data?.invoices || []);
            } catch (error) {
                if (!cancelled) setMessage({
                    text: error.message || "Failed to load invoices",
                    type: "error"
                });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    // Filter + search + sort
    const filteredInvoices = useMemo(() => {
        const searchTerm = debouncedSearchQuery.toLowerCase();
        let filtered = invoices;

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(invoice =>
                String(invoice.status || "").toLowerCase() === statusFilter
            );
        }

        // Payment method filter
        if (paymentMethodFilter !== "all") {
            filtered = filtered.filter(invoice =>
                String(invoice.paymentMethod || "").toLowerCase() === paymentMethodFilter
            );
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(invoice => {
                const invoiceId = String(invoice.invoiceId || invoice._id || "").toLowerCase();
                const customerName = String(invoice.customer?.profile?.firstName || invoice.customer?.name || "").toLowerCase();
                const customerEmail = String(invoice.customer?.email || "").toLowerCase();
                const bookingId = String(invoice.booking?.bookingId || "").toLowerCase();

                return invoiceId.includes(searchTerm) ||
                    customerName.includes(searchTerm) ||
                    customerEmail.includes(searchTerm) ||
                    bookingId.includes(searchTerm);
            });
        }

        // Sorting
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle nested fields
            if (sortField === 'customer') {
                aValue = a.customer?.profile?.firstName || a.customer?.name;
                bValue = b.customer?.profile?.firstName || b.customer?.name;
            }

            // Handle dates
            if (sortField.includes('Date') || sortField === 'createdAt' || sortField === 'updatedAt') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            }

            // Handle numbers
            if (sortField === 'total') {
                aValue = Number(aValue || 0);
                bValue = Number(bValue || 0);
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [invoices, debouncedSearchQuery, statusFilter, paymentMethodFilter, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(1);
    }, [totalPages, currentPage]);

    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    function handleSort(field) {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    }

    function getSortIndicator(field) {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? " ↑" : " ↓";
    }

    function toMoney(amount) {
        if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
        try {
            return amount.toLocaleString("en-LK", {
                style: "currency",
                currency: "LKR",
                maximumFractionDigits: 2
            });
        } catch {
            return `LKR ${amount.toFixed(2)}`;
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('en-LK', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function handleCreateInvoice() {
        const bookingId = window.prompt("Enter booking ID to create invoice:");
        if (bookingId && bookingId.trim()) {
            navigate(`/invoices/new/${bookingId.trim()}`);
        }
    }

    // Styles
    const containerStyle = {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
    };

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        gap: "16px",
        flexWrap: "wrap",
    };

    const titleStyle = {
        fontSize: "32px",
        fontWeight: 700,
        color: "#1e293b",
        margin: 0,
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    };

    const cardStyle = {
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e2e8f0",
        marginBottom: "24px",
    };

    const controlsStyle = {
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "center"
    };

    const controlStyle = {
        padding: "12px 14px",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "white",
        transition: 'all 0.2s ease',
        outline: 'none',
        minWidth: '140px'
    };

    const controlFocusStyle = {
        ...controlStyle,
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    };

    const primaryButtonStyle = {
        padding: "12px 20px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const tableContainerStyle = {
        overflowX: "auto",
        borderRadius: '12px',
        border: '2px solid #f1f5f9'
    };

    const tableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        background: 'white'
    };

    const thStyle = {
        textAlign: "left",
        padding: "16px",
        fontSize: "13px",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: "#f8fafc",
        borderBottom: "2px solid #e2e8f0",
        fontWeight: 700,
        cursor: "pointer",
        transition: 'background-color 0.2s ease',
        position: "sticky",
        top: 0,
        zIndex: 1,
    };

    const tdStyle = {
        padding: "16px",
        borderBottom: "1px solid #f1f5f9",
        fontSize: "14px",
        verticalAlign: "top"
    };

    const viewButtonStyle = {
        padding: "8px 16px",
        backgroundColor: "#3b82f6",
        color: "white",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "none",
        border: "none",
        cursor: "pointer",
        transition: 'all 0.2s ease'
    };

    const paginationButtonStyle = {
        padding: "10px 16px",
        backgroundColor: "white",
        color: "#475569",
        border: "2px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: 'all 0.2s ease'
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div>
                    <h1 style={titleStyle}>Invoices</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '16px' }}>
                        Manage and view all invoices
                    </p>
                </div>
                <div style={controlsStyle}>
                    <button
                        type="button"
                        onClick={handleCreateInvoice}
                        style={primaryButtonStyle}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2563eb';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#3b82f6';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <span>+</span> Create Invoice
                    </button>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={controlStyle}
                        onFocus={(e) => Object.assign(e.target.style, controlFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, controlStyle)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="overdue">Overdue</option>
                    </select>

                    <select
                        value={paymentMethodFilter}
                        onChange={(e) => {
                            setPaymentMethodFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={controlStyle}
                        onFocus={(e) => Object.assign(e.target.style, controlFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, controlStyle)}
                    >
                        <option value="all">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="transfer">Transfer</option>
                        <option value="check">Check</option>
                        <option value="digital">Digital</option>
                    </select>

                    <input
                        placeholder="Search invoices..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        style={{
                            ...controlStyle,
                            minWidth: '280px',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\' /%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: '12px center',
                            backgroundSize: '16px',
                            paddingLeft: '36px'
                        }}
                        onFocus={(e) => Object.assign(e.target.style, controlFocusStyle)}
                        onBlur={(e) => Object.assign(e.target.style, controlStyle)}
                    />
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    style={{
                        padding: "16px 20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `2px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: message.type === "error" ? "#ef4444" : "#10b981",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {message.type === "error" ? '!' : '✓'}
                    </div>
                    {message.text}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    color: "#64748b",
                    fontSize: '16px'
                }}>
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            border: "2px solid #e2e8f0",
                            borderTop: "2px solid #3b82f6",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    />
                    <span>Loading invoices...</span>
                </div>
            )}

            {/* Invoices Table */}
            {!isLoading && (
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                    <div style={tableContainerStyle}>
                        <table style={tableStyle} aria-label="Invoices list">
                            <thead>
                            <tr>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('invoiceId')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Invoice ID{getSortIndicator('invoiceId')}
                                </th>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('customer')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Customer{getSortIndicator('customer')}
                                </th>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('total')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Amount{getSortIndicator('total')}
                                </th>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('status')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Status{getSortIndicator('status')}
                                </th>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('paymentMethod')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Payment{getSortIndicator('paymentMethod')}
                                </th>
                                <th
                                    scope="col"
                                    style={thStyle}
                                    onClick={() => handleSort('createdAt')}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                >
                                    Date{getSortIndicator('createdAt')}
                                </th>
                                <th scope="col" style={{...thStyle, cursor: 'default'}}>
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ ...tdStyle, color: "#64748b", textAlign: "center", padding: 40 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                            <span style={{ fontSize: '48px' }}>📝</span>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                                                    No invoices found
                                                </div>
                                                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                                                    {debouncedSearchQuery || statusFilter !== 'all' || paymentMethodFilter !== 'all'
                                                        ? 'Try adjusting your search or filters'
                                                        : 'No invoices have been created yet'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInvoices.map((invoice) => (
                                    <tr key={invoice._id}>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 700, color: "#1e293b" }}>
                                                        {invoice.invoiceId || invoice._id}
                                                    </span>
                                                {invoice.booking?.bookingId && (
                                                    <span style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                                                            Booking: {invoice.booking.bookingId}
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                                        {invoice.customer?.profile?.firstName || invoice.customer?.name || "Unknown Customer"}
                                                    </span>
                                                {invoice.customer?.email && (
                                                    <span style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                                                            {invoice.customer.email}
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: 700, color: "#1e293b" }}>
                                            {toMoney(invoice.total)}
                                        </td>
                                        <td style={tdStyle}>
                                            <StatusBadge value={invoice.status} />
                                        </td>
                                        <td style={tdStyle}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#475569',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {invoice.paymentMethod || '—'}
                                                </span>
                                        </td>
                                        <td style={{ ...tdStyle, color: "#64748b", whiteSpace: "nowrap" }}>
                                            {formatDate(invoice.createdAt)}
                                        </td>
                                        <td style={tdStyle}>
                                            <Link
                                                to={`/invoices/${invoice._id}`}
                                                style={viewButtonStyle}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = '#2563eb';
                                                    e.target.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = '#3b82f6';
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginatedInvoices.length > 0 && (
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "20px 24px",
                            borderTop: "2px solid #f1f5f9"
                        }}>
                            <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredInvoices.length)} of {filteredInvoices.length} invoices
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        ...paginationButtonStyle,
                                        backgroundColor: currentPage === 1 ? "#f1f5f9" : "white",
                                        color: currentPage === 1 ? "#94a3b8" : "#475569",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== 1) {
                                            e.target.style.backgroundColor = '#f8fafc';
                                            e.target.style.borderColor = '#cbd5e1';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== 1) {
                                            e.target.style.backgroundColor = 'white';
                                            e.target.style.borderColor = '#e2e8f0';
                                        }
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        ...paginationButtonStyle,
                                        backgroundColor: currentPage === totalPages ? "#f1f5f9" : "white",
                                        color: currentPage === totalPages ? "#94a3b8" : "#475569",
                                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentPage !== totalPages) {
                                            e.target.style.backgroundColor = '#f8fafc';
                                            e.target.style.borderColor = '#cbd5e1';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentPage !== totalPages) {
                                            e.target.style.backgroundColor = 'white';
                                            e.target.style.borderColor = '#e2e8f0';
                                        }
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
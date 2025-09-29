import { useState } from 'react';
import { useAuth } from '../../../store/AuthContext';

interface PaymentFilters {
    status: string;
    method: string;
    dateFrom: string;
    dateTo: string;
    format: string;
}

interface PaymentSummary {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    totalAmount?: number;
}

interface PaymentData {
    _id: string;
    invoiceId: string;
    amount: number;
    method: string;
    status: string;
    paidDate: string;
    dueDate?: string;
    customerName?: string;
    bookingId?: string;
}

interface ReportData {
    message?: string;
    summary?: PaymentSummary;
    payments?: PaymentData[];
}

const PaymentsReport = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [filters, setFilters] = useState<PaymentFilters>({
        status: '',
        method: '',
        dateFrom: '',
        dateTo: '',
        format: 'pdf'
    });

    const buildQueryParams = () => {
        const queryParams = new URLSearchParams();
        
        // Add non-empty filters to query parameters
        (Object.keys(filters) as Array<keyof PaymentFilters>).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });
        
        return queryParams.toString();
    };

    const generateReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);

        try {
            const token = localStorage.getItem('token');
            const queryString = buildQueryParams();
            const url = `http://localhost:5000/api/v1/reports/payments${queryString ? '?' + queryString : ''}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (filters.format === 'pdf') {
                // Handle PDF download
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `payments-report-${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
                
                setReportData({ message: 'PDF downloaded successfully!' });
            } else {
                // Handle JSON response
                const data = await response.json();
                setReportData(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while generating the report');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Check user permissions
    if (!user || !['cashier', 'admin', 'manager'].includes(user.role)) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You don't have permission to view this report.</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f7fa',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '24px',
                }}>
                    Payments Report
                </h1>

                {/* Filters Section */}
                <div style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                }}>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>Filters</h3>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px',
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Payment Method
                            </label>
                            <select
                                value={filters.method}
                                onChange={(e) => handleFilterChange('method', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="card">Credit/Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="check">Check</option>
                                <option value="digital_wallet">Digital Wallet</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Format
                            </label>
                            <select
                                value={filters.format}
                                onChange={(e) => handleFilterChange('format', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="pdf">PDF</option>
                                <option value="json">View in Browser</option>
                            </select>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px',
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={generateReport}
                        disabled={loading}
                        style={{
                            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        padding: '12px',
                        borderRadius: '6px',
                        marginBottom: '20px',
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Report Results */}
                {reportData && (
                    <div style={{ marginTop: '20px' }}>
                        {reportData.message ? (
                            <div style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#16a34a',
                                padding: '12px',
                                borderRadius: '6px',
                                textAlign: 'center',
                            }}>
                                {reportData.message}
                            </div>
                        ) : (
                            <div>
                                {reportData.summary && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '16px',
                                        marginBottom: '24px',
                                    }}>
                                        <div style={{
                                            background: '#eff6ff',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Total Payments</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e40af' }}>
                                                {reportData.summary.totalPayments}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#f0fdf4',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Completed</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>
                                                {reportData.summary.completedPayments}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#fffbeb',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#d97706' }}>Pending</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
                                                {reportData.summary.pendingPayments}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#f3f4f6',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Total Amount</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#374151' }}>
                                                ${reportData.summary.totalAmount?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {reportData.payments && reportData.payments.length > 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: '16px', color: '#374151' }}>
                                            Payment Details {reportData.payments.length > 20 && '(First 20 shown)'}
                                        </h3>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '14px',
                                            }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f9fafb' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Invoice ID</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date Paid</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Due Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.payments.slice(0, 20).map((payment, index) => (
                                                        <tr key={payment._id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                                            <td style={{ padding: '12px' }}>{payment.invoiceId}</td>
                                                            <td style={{ padding: '12px' }}>{payment.customerName || 'N/A'}</td>
                                                            <td style={{ padding: '12px' }}>${payment.amount.toLocaleString()}</td>
                                                            <td style={{ padding: '12px' }}>{payment.method}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: 
                                                                        payment.status === 'paid' ? '#dcfce7' :
                                                                        payment.status === 'pending' ? '#fef3c7' :
                                                                        payment.status === 'overdue' ? '#fee2e2' :
                                                                        payment.status === 'cancelled' ? '#f3f4f6' : '#f3f4f6',
                                                                    color: 
                                                                        payment.status === 'paid' ? '#16a34a' :
                                                                        payment.status === 'pending' ? '#d97706' :
                                                                        payment.status === 'overdue' ? '#dc2626' :
                                                                        payment.status === 'cancelled' ? '#6b7280' : '#374151',
                                                                }}>
                                                                    {payment.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {reportData.payments.length > 20 && (
                                            <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                                                Showing first 20 of {reportData.payments.length} payments. Download PDF for complete report.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentsReport;
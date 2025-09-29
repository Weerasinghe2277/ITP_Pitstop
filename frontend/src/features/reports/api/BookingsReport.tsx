import { useState } from 'react';
import { useAuth } from '../../../store/AuthContext';

interface BookingFilters {
    status: string;
    serviceType: string;
    priority: string;
    dateFrom: string;
    dateTo: string;
    format: string;
}

interface BookingSummary {
    totalBookings: number;
    completedBookings: number;
    inProgressBookings: number;
    totalRevenue?: number;
}

interface BookingData {
    _id: string;
    bookingId: string;
    vehicleId: string;
    customerId: string;
    customerName?: string;
    vehicleInfo?: string;
    serviceType: string;
    bookingDate: string;
    scheduledDate?: string;
    status: string;
    priority: string;
    estimatedCost?: number;
    actualCost?: number;
    notes?: string;
}

interface ReportData {
    message?: string;
    summary?: BookingSummary;
    bookings?: BookingData[];
}

const BookingsReport = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [filters, setFilters] = useState<BookingFilters>({
        status: '',
        serviceType: '',
        priority: '',
        dateFrom: '',
        dateTo: '',
        format: 'pdf'
    });

    const buildQueryParams = () => {
        const queryParams = new URLSearchParams();
        
        // Add non-empty filters to query parameters
        (Object.keys(filters) as Array<keyof BookingFilters>).forEach(key => {
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
            const url = `http://localhost:5000/api/v1/reports/bookings${queryString ? '?' + queryString : ''}`;

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
                link.download = `bookings-report-${new Date().toISOString().split('T')[0]}.pdf`;
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

    const handleFilterChange = (key: keyof BookingFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Check user permissions
    if (!user || !['cashier', 'admin', 'manager', 'service_advisor'].includes(user.role)) {
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
                    Bookings Report
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
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Service Type
                            </label>
                            <select
                                value={filters.serviceType}
                                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Services</option>
                                <option value="general_service">General Service</option>
                                <option value="engine_repair">Engine Repair</option>
                                <option value="transmission">Transmission</option>
                                <option value="brake_service">Brake Service</option>
                                <option value="oil_change">Oil Change</option>
                                <option value="tire_service">Tire Service</option>
                                <option value="inspection">Inspection</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Priority
                            </label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
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
                                            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Total Bookings</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e40af' }}>
                                                {reportData.summary.totalBookings}
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
                                                {reportData.summary.completedBookings}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#fffbeb',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#d97706' }}>In Progress</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
                                                {reportData.summary.inProgressBookings}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#f3f4f6',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>Total Revenue</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#374151' }}>
                                                ${reportData.summary.totalRevenue?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {reportData.bookings && reportData.bookings.length > 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: '16px', color: '#374151' }}>
                                            Booking Details {reportData.bookings.length > 20 && '(First 20 shown)'}
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
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Booking ID</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Vehicle</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Service</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Priority</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.bookings.slice(0, 20).map((booking, index) => (
                                                        <tr key={booking._id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                                            <td style={{ padding: '12px' }}>{booking.bookingId}</td>
                                                            <td style={{ padding: '12px' }}>{booking.customerName || booking.customerId}</td>
                                                            <td style={{ padding: '12px' }}>{booking.vehicleInfo || booking.vehicleId}</td>
                                                            <td style={{ padding: '12px' }}>{booking.serviceType}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                {new Date(booking.scheduledDate || booking.bookingDate).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: 
                                                                        booking.status === 'completed' ? '#dcfce7' :
                                                                        booking.status === 'in_progress' ? '#fef3c7' :
                                                                        booking.status === 'confirmed' ? '#dbeafe' :
                                                                        booking.status === 'cancelled' ? '#fee2e2' : '#f3f4f6',
                                                                    color: 
                                                                        booking.status === 'completed' ? '#16a34a' :
                                                                        booking.status === 'in_progress' ? '#d97706' :
                                                                        booking.status === 'confirmed' ? '#2563eb' :
                                                                        booking.status === 'cancelled' ? '#dc2626' : '#374151',
                                                                }}>
                                                                    {booking.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: 
                                                                        booking.priority === 'urgent' ? '#fee2e2' :
                                                                        booking.priority === 'high' ? '#fed7aa' :
                                                                        booking.priority === 'medium' ? '#fef3c7' : '#f3f4f6',
                                                                    color: 
                                                                        booking.priority === 'urgent' ? '#dc2626' :
                                                                        booking.priority === 'high' ? '#ea580c' :
                                                                        booking.priority === 'medium' ? '#d97706' : '#374151',
                                                                }}>
                                                                    {booking.priority}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                ${(booking.actualCost || booking.estimatedCost || 0).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {reportData.bookings.length > 20 && (
                                            <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                                                Showing first 20 of {reportData.bookings.length} bookings. Download PDF for complete report.
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

export default BookingsReport;
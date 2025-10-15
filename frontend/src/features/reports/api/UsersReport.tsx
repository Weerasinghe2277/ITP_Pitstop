import { useState } from 'react';
import { useAuth } from '../../../store/AuthContext';

interface UserFilters {
  role: string;
  status: string;
  specialization: string;
  dateFrom: string;
  dateTo: string;
  format: string;
}

interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentRegistrations: number;
  profileCompletionRate: string;
}

interface UserData {
  _id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  loyaltyPoints?: number;
}

interface RoleDistribution {
  role: string;
  count: number;
  active: number;
  inactive: number;
  percentage: string;
}

interface ReportData {
  message?: string;
  summary?: UserSummary;
  users?: UserData[];
  roleDistribution?: RoleDistribution[];
  activeUsersPercentage?: string;
}

const UsersReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    status: '',
    specialization: '',
    dateFrom: '',
    dateTo: '',
    format: 'pdf'
  });

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  const buildQueryParams = () => {
    const queryParams = new URLSearchParams();

    // Add non-empty filters to query parameters
    (Object.keys(filters) as Array<keyof UserFilters>).forEach(key => {
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
      const url = `http://localhost:5000/api/v1/reports/users${queryString ? '?' + queryString : ''}`;

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
        link.download = `users-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        setReportData({ message: 'PDF downloaded successfully!' });
      } else {
        // Handle JSON response
        const data = await response.json();
        setReportData(data.data || data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check user permissions
  if (!user || !['manager', 'admin'].includes(user.role)) {
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
          Users Report
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
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="service_advisor">Service Advisor</option>
                <option value="technician">Technician</option>
                <option value="cashier">Cashier</option>
                <option value="customer">Customer</option>
              </select>
            </div>

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
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Specialization
              </label>
              <input
                type="text"
                value={filters.specialization}
                onChange={(e) => handleFilterChange('specialization', e.target.value)}
                placeholder="e.g., Engine, Brake, Electrical"
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
                Registration Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                max={today}
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
                Registration Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                max={today}
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
                      <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Total Users</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e40af' }}>
                        {reportData.summary.totalUsers}
                      </p>
                    </div>

                    <div style={{
                      background: '#f0fdf4',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Active Users</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>
                        {reportData.summary.activeUsers}
                      </p>
                    </div>

                    <div style={{
                      background: '#fef2f2',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Inactive Users</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
                        {reportData.summary.inactiveUsers}
                      </p>
                    </div>

                    <div style={{
                      background: '#fffbeb',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#d97706' }}>Recent Registrations</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
                        {reportData.summary.recentRegistrations}
                      </p>
                      <small style={{ color: '#92400e' }}>Last 30 days</small>
                    </div>

                    <div style={{
                      background: '#f5f3ff',
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#7c3aed' }}>Profile Completion</h4>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#7c3aed' }}>
                        {reportData.summary.profileCompletionRate}%
                      </p>
                    </div>
                  </div>
                )}

                {reportData.roleDistribution && reportData.roleDistribution.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>Role Distribution</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        marginBottom: '20px',
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Role</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Active</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Inactive</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.roleDistribution.map((role, index) => (
                            <tr key={role.role} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                }}>
                                  {role.role}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>{role.count}</td>
                              <td style={{ padding: '12px', color: '#16a34a' }}>{role.active}</td>
                              <td style={{ padding: '12px', color: '#dc2626' }}>{role.inactive}</td>
                              <td style={{ padding: '12px' }}>{role.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {reportData.users && reportData.users.length > 0 && (
                  <div>
                    <h3 style={{ marginBottom: '16px', color: '#374151' }}>
                      User Details {reportData.users.length > 20 && '(First 20 shown)'}
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
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>User ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Role</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Specialization</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Registered</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Last Login</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.users.slice(0, 20).map((user, index) => (
                            <tr key={user.userId} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                              <td style={{ padding: '12px', fontFamily: 'monospace' }}>{user.userId}</td>
                              <td style={{ padding: '12px' }}>
                                {`${user.firstName} ${user.lastName}`.trim() || 'N/A'}
                              </td>
                              <td style={{ padding: '12px' }}>{user.email}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>{user.phone}</td>
                              <td style={{ padding: '12px' }}>{user.specialization}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                                  color: user.isActive ? '#16a34a' : '#dc2626',
                                }}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>{formatDate(user.createdAt)}</td>
                              <td style={{ padding: '12px' }}>
                                {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {reportData.users.length > 20 && (
                      <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                        Showing first 20 of {reportData.users.length} users. Download PDF for complete report.
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

export default UsersReport;
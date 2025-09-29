import { useState } from 'react';
import { useAuth } from '../../../store/AuthContext';

interface InventoryFilters {
    category: string;
    stockStatus: string;
    supplier: string;
    dateFrom: string;
    dateTo: string;
    format: string;
}

interface InventorySummary {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue?: number;
}

interface InventoryData {
    _id: string;
    itemId: string;
    name: string;
    description?: string;
    category: string;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel?: number;
    unitPrice: number;
    supplier?: string;
    lastUpdated: string;
    stockStatus?: string;
    totalValue?: number;
}

interface ReportData {
    message?: string;
    summary?: InventorySummary;
    inventory?: InventoryData[];
}

const InventoryReport = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [filters, setFilters] = useState<InventoryFilters>({
        category: '',
        stockStatus: '',
        supplier: '',
        dateFrom: '',
        dateTo: '',
        format: 'pdf'
    });

    const buildQueryParams = () => {
        const queryParams = new URLSearchParams();
        
        // Add non-empty filters to query parameters
        (Object.keys(filters) as Array<keyof InventoryFilters>).forEach(key => {
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
            const url = `http://localhost:5000/api/v1/reports/inventory${queryString ? '?' + queryString : ''}`;

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
                link.download = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
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

    const handleFilterChange = (key: keyof InventoryFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
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
                    Inventory Report
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
                                Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Categories</option>
                                <option value="parts">Parts</option>
                                <option value="tools">Tools</option>
                                <option value="fluids">Fluids</option>
                                <option value="filters">Filters</option>
                                <option value="electrical">Electrical</option>
                                <option value="consumables">Consumables</option>
                                <option value="accessories">Accessories</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Stock Status
                            </label>
                            <select
                                value={filters.stockStatus}
                                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }}
                            >
                                <option value="">All Stock Levels</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                                <option value="overstocked">Overstocked</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                                Supplier
                            </label>
                            <input
                                type="text"
                                value={filters.supplier}
                                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                                placeholder="Enter supplier name"
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
                                            <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>Total Items</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e40af' }}>
                                                {reportData.summary.totalItems}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#fffbeb',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#d97706' }}>Low Stock</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
                                                {reportData.summary.lowStockItems}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#fef2f2',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Out of Stock</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
                                                {reportData.summary.outOfStockItems}
                                            </p>
                                        </div>

                                        <div style={{
                                            background: '#f0fdf4',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Total Value</h4>
                                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#16a34a' }}>
                                                ${reportData.summary.totalValue?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {reportData.inventory && reportData.inventory.length > 0 && (
                                    <div>
                                        <h3 style={{ marginBottom: '16px', color: '#374151' }}>
                                            Inventory Details {reportData.inventory.length > 20 && '(First 20 shown)'}
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
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Item ID</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Category</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Current Stock</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Min/Max</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Unit Price</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Total Value</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reportData.inventory.slice(0, 20).map((item, index) => (
                                                        <tr key={item._id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                                            <td style={{ padding: '12px' }}>{item.itemId}</td>
                                                            <td style={{ padding: '12px' }}>{item.name}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: '#f3f4f6',
                                                                    color: '#374151',
                                                                }}>
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>{item.currentStock}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                {item.minStockLevel}/{item.maxStockLevel || 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>${item.unitPrice.toFixed(2)}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                ${(item.currentStock * item.unitPrice).toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    backgroundColor: 
                                                                        item.currentStock === 0 ? '#fee2e2' :
                                                                        item.currentStock <= item.minStockLevel ? '#fef3c7' :
                                                                        item.maxStockLevel && item.currentStock > item.maxStockLevel ? '#e0e7ff' : '#dcfce7',
                                                                    color: 
                                                                        item.currentStock === 0 ? '#dc2626' :
                                                                        item.currentStock <= item.minStockLevel ? '#d97706' :
                                                                        item.maxStockLevel && item.currentStock > item.maxStockLevel ? '#3730a3' : '#16a34a',
                                                                }}>
                                                                    {item.currentStock === 0 ? 'Out of Stock' :
                                                                     item.currentStock <= item.minStockLevel ? 'Low Stock' :
                                                                     item.maxStockLevel && item.currentStock > item.maxStockLevel ? 'Overstocked' : 'In Stock'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {reportData.inventory.length > 20 && (
                                            <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
                                                Showing first 20 of {reportData.inventory.length} items. Download PDF for complete report.
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

export default InventoryReport;
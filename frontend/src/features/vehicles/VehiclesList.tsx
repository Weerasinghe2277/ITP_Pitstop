// src/features/vehicles/VehiclesList.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";

export default function VehiclesList() {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        maintenance: 0,
        inactive: 0
    });

    async function loadVehicles() {
        setIsLoading(true);
        try {
            const response = await http.get("/vehicles");
            const vehicleData = response.data?.vehicles || [];
            setVehicles(vehicleData);
            setFilteredVehicles(vehicleData);

            // Calculate statistics
            const statistics = {
                total: vehicleData.length,
                active: vehicleData.filter(v => v.status === 'active').length,
                maintenance: vehicleData.filter(v => v.status === 'maintenance').length,
                inactive: vehicleData.filter(v => v.status === 'inactive').length
            };
            setStats(statistics);
        } catch (error) {
            setMessage({ text: "Failed to load vehicles", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadVehicles();
    }, []);

    // Filter and search functionality
    useEffect(() => {
        let filtered = vehicles;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(vehicle =>
                vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.owner?.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.owner?.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
        }

        setFilteredVehicles(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }, [searchTerm, statusFilter, vehicles]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVehicles = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

    async function exportVehicles() {
        try {
            const csvContent = [
                ['Registration', 'Owner', 'Make', 'Model', 'Year', 'Status', 'Fuel Type', 'Transmission'].join(','),
                ...filteredVehicles.map(v => [
                    v.registrationNumber,
                    `${v.owner?.profile?.firstName || ''} ${v.owner?.profile?.lastName || ''}`.trim(),
                    v.make,
                    v.model,
                    v.year,
                    v.status,
                    v.fuelType,
                    v.transmission
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vehicles.csv';
            a.click();
            window.URL.revokeObjectURL(url);

            setMessage({ text: "Vehicles exported successfully", type: "success" });
        } catch (error) {
            setMessage({ text: "Failed to export vehicles", type: "error" });
        }
    }

    const theme = {
        background: "#f9fafb",
        text: "#111827",
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
                <div>Loading vehicles...</div>
            </div>
        );
    }

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
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: theme.text,
                    margin: 0
                }}>
                    Vehicles ({filteredVehicles.length})
                </h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={exportVehicles}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Export CSV
                    </button>
                    <Link
                        to="/vehicles/new"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Add Vehicle
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <StatCard title="Total Vehicles" value={stats.total} color="#3b82f6" />
                <StatCard title="Active" value={stats.active} color="#10b981" />
                <StatCard title="In Maintenance" value={stats.maintenance} color="#f59e0b" />
                <StatCard title="Inactive" value={stats.inactive} color="#ef4444" />
            </div>

            {/* Filters and Search */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`,
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    alignItems: 'end'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: theme.text,
                            marginBottom: '6px'
                        }}>
                            Search Vehicles
                        </label>
                        <input
                            type="text"
                            placeholder="Search by registration, make, model, or owner..."
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
                            Filter by Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                            }}
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
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Vehicles Table */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`,
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                            <th style={tableHeaderStyle}>Registration</th>
                            <th style={tableHeaderStyle}>Owner</th>
                            <th style={tableHeaderStyle}>Vehicle</th>
                            <th style={tableHeaderStyle}>Year</th>
                            <th style={tableHeaderStyle}>Fuel Type</th>
                            <th style={tableHeaderStyle}>Status</th>
                            <th style={tableHeaderStyle}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentVehicles.length > 0 ? (
                            currentVehicles.map((vehicle, index) => (
                                <tr key={vehicle._id} style={{
                                    borderBottom: `1px solid ${theme.border}`,
                                    '&:hover': { backgroundColor: '#f9fafb' }
                                }}>
                                    <td style={tableCellStyle}>
                                            <span style={{ fontWeight: '500', color: '#3b82f6' }}>
                                                {vehicle.registrationNumber}
                                            </span>
                                    </td>
                                    <td style={tableCellStyle}>
                                        {vehicle.owner ? (
                                            <div>
                                                <div style={{ fontWeight: '500' }}>
                                                    {vehicle.owner.profile?.firstName} {vehicle.owner.profile?.lastName}
                                                </div>
                                                <div style={{ fontSize: '12px', color: theme.mutedText }}>
                                                    {vehicle.owner.email}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: theme.mutedText }}>No owner</span>
                                        )}
                                    </td>
                                    <td style={tableCellStyle}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>
                                                {vehicle.make} {vehicle.model}
                                            </div>
                                            {vehicle.color && (
                                                <div style={{ fontSize: '12px', color: theme.mutedText }}>
                                                    {vehicle.color}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={tableCellStyle}>{vehicle.year}</td>
                                    <td style={tableCellStyle}>
                                            <span style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {vehicle.fuelType}
                                            </span>
                                    </td>
                                    <td style={tableCellStyle}>
                                        <StatusBadge value={vehicle.status} />
                                    </td>
                                    <td style={tableCellStyle}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link
                                                to={`/vehicles/${vehicle._id}`}
                                                style={{
                                                    padding: '4px 8px',
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
                                            <Link
                                                to={`/bookings/new/${vehicle._id}`}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                Book
                                            </Link>
                                        </div>
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
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'No vehicles match your search criteria'
                                        : 'No vehicles found'
                                    }
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
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVehicles.length)} of {filteredVehicles.length} vehicles
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
    );
}

function StatCard({ title, value, color }) {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
        }}>
            <h3 style={{
                margin: 0,
                fontSize: '32px',
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

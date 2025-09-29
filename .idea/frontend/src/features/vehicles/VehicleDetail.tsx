// src/features/vehicles/VehicleDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../../lib/http";
import StatusBadge from "../../components/StatusBadge";

export default function VehicleDetail() {
    const { id } = useParams();
    const [vehicle, setVehicle] = useState(null);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    async function loadVehicle() {
        try {
            const response = await http.get(`/vehicles/${id}`);
            setVehicle(response.data?.vehicle);
        } catch (error) {
            setMessage({ text: "Failed to load vehicle details", type: "error" });
        }
    }

    async function loadServiceHistory() {
        try {
            const response = await http.get(`/vehicles/${id}/service-history`);
            setServiceHistory(response.data?.history || []);
        } catch (error) {
            // Service history might not be available, silently handle
            setServiceHistory([]);
        }
    }

    useEffect(() => {
        if (id) {
            loadVehicle();
            loadServiceHistory();
        }
    }, [id]);

    async function updateStatus(newStatus) {
        setIsLoading(true);
        try {
            await http.patch(`/vehicles/${id}/status`, { status: newStatus });
            setMessage({ text: `Status updated to ${newStatus}`, type: "success" });
            await loadVehicle();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to update status", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    if (!vehicle) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                <div>Loading vehicle details...</div>
            </div>
        );
    }

    // Theme variables
    const theme = {
        background: "#f9fafb",
        text: "#111827",
        card: "#ffffff",
        border: "#e5e7eb",
        mutedText: "#6b7280",
    };

    return (
        <div style={{
            maxWidth: '1200px',
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
                    <Link
                        to="/vehicles"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            marginBottom: '8px',
                            fontSize: '14px'
                        }}
                    >
                        ← Back to Vehicles
                    </Link>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: theme.text,
                        margin: 0
                    }}>
                        {vehicle.registrationNumber}
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: theme.mutedText,
                        margin: '4px 0 0 0'
                    }}>
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                    </p>
                </div>
                <StatusBadge value={vehicle.status} size="large" />
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {/* Vehicle Information Card */}
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${theme.border}`
                    }}>
                        Vehicle Information
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <InfoRow label="Registration Number" value={vehicle.registrationNumber} />
                        <InfoRow label="Make" value={vehicle.make} />
                        <InfoRow label="Model" value={vehicle.model} />
                        <InfoRow label="Year" value={vehicle.year} />
                        <InfoRow label="Color" value={vehicle.color || 'N/A'} />
                        <InfoRow label="Fuel Type" value={vehicle.fuelType} />
                        <InfoRow label="Transmission" value={vehicle.transmission} />
                        <InfoRow
                            label="Mileage"
                            value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
                        />
                        <InfoRow label="Engine Number" value={vehicle.engineNumber || 'N/A'} />
                        <InfoRow label="Chassis Number" value={vehicle.chassisNumber || 'N/A'} />
                    </div>
                </div>

                {/* Owner Information Card */}
                <div style={{
                    background: theme.card,
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${theme.border}`
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: theme.text,
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${theme.border}`
                    }}>
                        Owner Information
                    </h2>

                    {vehicle.owner ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <InfoRow
                                label="Name"
                                value={`${vehicle.owner.profile?.firstName || ''} ${vehicle.owner.profile?.lastName || ''}`.trim() || 'N/A'}
                            />
                            <InfoRow label="Email" value={vehicle.owner.email || 'N/A'} />
                            <InfoRow label="Phone" value={vehicle.owner.profile?.phone || 'N/A'} />
                            <InfoRow label="Address" value={vehicle.owner.profile?.address || 'N/A'} />
                            <InfoRow
                                label="Member Since"
                                value={vehicle.owner.createdAt ? new Date(vehicle.owner.createdAt).toLocaleDateString() : 'N/A'}
                            />
                        </div>
                    ) : (
                        <p style={{ color: theme.mutedText }}>Owner information not available</p>
                    )}
                </div>

                {/* Notes Card */}
                {vehicle.notes && (
                    <div style={{
                        background: theme.card,
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${theme.border}`,
                        gridColumn: '1 / -1'
                    }}>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: theme.text,
                            marginBottom: '20px',
                            paddingBottom: '12px',
                            borderBottom: `1px solid ${theme.border}`
                        }}>
                            Notes
                        </h2>
                        <p style={{
                            margin: 0,
                            lineHeight: '1.6',
                            color: theme.text
                        }}>
                            {vehicle.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Actions Card */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`,
                marginBottom: '32px'
            }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${theme.border}`
                }}>
                    Vehicle Actions
                </h2>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Link
                        to={`/bookings/new/${vehicle._id}`}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>Book Service</span>
                    </Link>

                    <Link
                        to={`/vehicles/edit/${vehicle._id}`}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>Edit Vehicle</span>
                    </Link>

                    <button
                        onClick={() => window.print()}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>Print Details</span>
                    </button>

                    {/* Quick Status Update Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                        {vehicle.status === 'active' && (
                            <button
                                onClick={() => updateStatus('maintenance')}
                                disabled={isLoading}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Mark as Maintenance
                            </button>
                        )}
                        {vehicle.status === 'maintenance' && (
                            <button
                                onClick={() => updateStatus('active')}
                                disabled={isLoading}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Mark as Active
                            </button>
                        )}
                        {vehicle.status !== 'inactive' && (
                            <button
                                onClick={() => updateStatus('inactive')}
                                disabled={isLoading}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Deactivate
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Service History Card */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`,
                marginBottom: '32px'
            }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${theme.border}`
                }}>
                    Service History
                </h2>

                {serviceHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {serviceHistory.map((service, index) => (
                            <div key={index} style={{
                                padding: '16px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <p style={{
                                        margin: 0,
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        {service.serviceType || 'Service'}
                                    </p>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '12px',
                                        color: theme.mutedText
                                    }}>
                                        {service.description || 'No description'}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '12px',
                                        color: theme.mutedText
                                    }}>
                                        {new Date(service.date).toLocaleDateString()}
                                    </p>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: service.status === 'completed' ? '#10b981' : '#f59e0b'
                                    }}>
                                        {service.status || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: theme.mutedText
                    }}>
                        <p>No service history available for this vehicle.</p>
                        <Link
                            to={`/bookings/new/${vehicle._id}`}
                            style={{
                                display: 'inline-block',
                                marginTop: '12px',
                                padding: '8px 16px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontSize: '14px'
                            }}
                        >
                            Book First Service
                        </Link>
                    </div>
                )}
            </div>

            {/* Vehicle Stats Card */}
            <div style={{
                background: theme.card,
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${theme.border}`
            }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: `1px solid ${theme.border}`
                }}>
                    Vehicle Statistics
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <StatCard
                        title="Vehicle Age"
                        value={`${new Date().getFullYear() - vehicle.year} years`}
                        color="#3b82f6"
                    />
                    <StatCard
                        title="Total Services"
                        value={serviceHistory.length.toString()}
                        color="#10b981"
                    />
                    <StatCard
                        title="Last Service"
                        value={serviceHistory.length > 0 ?
                            new Date(serviceHistory[0]?.date).toLocaleDateString() : 'Never'
                        }
                        color="#8b5cf6"
                    />
                    <StatCard
                        title="Registration Date"
                        value={vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : 'Unknown'}
                        color="#f59e0b"
                    />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: 'flex' }}>
            <span style={{ flex: '1', color: '#6b7280' }}>{label}:</span>
            <span style={{ flex: '1', fontWeight: '500' }}>{value}</span>
        </div>
    );
}

function StatCard({ title, value, color }) {
    return (
        <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
        }}>
            <h3 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: color
            }}>
                {value}
            </h3>
            <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: '#6b7280'
            }}>
                {title}
            </p>
        </div>
    );
}

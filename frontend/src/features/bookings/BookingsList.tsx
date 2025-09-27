// src/features/bookings/BookingsList.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../store/AuthContext";

interface Customer {
    _id: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        nic?: string;
    };
}

interface Vehicle {
    _id: string;
    make?: string;
    model?: string;
    registrationNumber?: string;
    year?: number;
}

interface Booking {
    _id: string;
    bookingId: string;
    customer: Customer;
    vehicle: Vehicle;
    serviceType: string;
    status: string;
    priority?: string;
    scheduledDate?: string;
    createdAt: string;
    description?: string;
    timeSlot?: string;
}

interface FilterState {
    status: string;
    serviceType: string;
    priority: string;
}

export default function BookingsList() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filter, setFilter] = useState<FilterState>({
        status: "",
        serviceType: "",
        priority: ""
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Check if user can create bookings (not service advisor)
    const canCreateBookings = user?.role !== "service_advisor";

    useEffect(() => {
        loadBookings();
    }, [filter]);

    async function loadBookings() {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.status) params.set("status", filter.status);
            if (filter.serviceType) params.set("serviceType", filter.serviceType);
            if (filter.priority) params.set("priority", filter.priority);

            const response = await http.get(`/bookings?${params.toString()}`);
            setBookings(response.data?.bookings || []);
        } catch (error) {
            console.error("Failed to load bookings:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredBookings = bookings.filter(booking => {
        // General search term filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = (
                booking.bookingId?.toLowerCase().includes(searchLower) ||
                booking.customer?.profile?.firstName?.toLowerCase().includes(searchLower) ||
                booking.customer?.profile?.lastName?.toLowerCase().includes(searchLower) ||
                booking.vehicle?.registrationNumber?.toLowerCase().includes(searchLower) ||
                booking.vehicle?.make?.toLowerCase().includes(searchLower) ||
                booking.vehicle?.model?.toLowerCase().includes(searchLower) ||
                booking.serviceType?.toLowerCase().includes(searchLower)
            );
            if (!matchesSearch) return false;
        }

        return true;
    });

    const statusOptions = ["pending", "confirmed", "inspecting", "working", "completed", "cancelled"];
    const serviceTypeOptions = ["inspection", "repair", "maintenance", "bodywork", "detailing"];
    const priorityOptions = ["low", "medium", "high", "urgent"];

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
                    color: '#1f2937',
                    margin: 0
                }}>
                    Bookings Management
                </h1>

                {canCreateBookings && (
                    <Link
                        to="/bookings/new"
                        style={{
                            padding: '10px 20px',
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
                        <span>+ New Booking</span>
                    </Link>
                )}
            </div>

            {/* Filters Card */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                marginBottom: '24px'
            }}>
                <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '20px'
                }}>
                    Filter Bookings
                </h2>

                {/* First Row of Filters */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            🔍 Quick Search
                        </label>
                        <input
                            type="text"
                            placeholder="Search by ID, customer, vehicle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
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
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            🏷️ Status
                        </label>
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#000000'
                            }}
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(option => (
                                <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            🔧 Service Type
                        </label>
                        <select
                            value={filter.serviceType}
                            onChange={(e) => setFilter({ ...filter, serviceType: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#000000'
                            }}
                        >
                            <option value="">All Service Types</option>
                            {serviceTypeOptions.map(option => (
                                <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '6px'
                        }}>
                            ⚡ Priority
                        </label>
                        <select
                            value={filter.priority}
                            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#000000'
                            }}
                        >
                            <option value="">All Priorities</option>
                            {priorityOptions.map(option => (
                                <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Showing {filteredBookings.length} of {bookings.length} bookings
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => {
                                setFilter({
                                    status: "pending",
                                    serviceType: "",
                                    priority: ""
                                });
                                setSearchTerm("");
                            }}
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
                            � Pending Bookings
                        </button>
                        <button
                            onClick={() => {
                                setFilter({
                                    status: "",
                                    serviceType: "",
                                    priority: ""
                                });
                                setSearchTerm("");
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ Clear All Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookings List */}
            {isLoading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '24px', height: '24px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <span style={{ color: '#6b7280' }}>Loading bookings...</span>
                    </div>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        No bookings found
                    </h3>
                    <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                        {bookings.length === 0 ? 'No bookings have been created yet.' : 'Try adjusting your filters or search term.'}
                    </p>
                    <Link
                        to="/bookings/new"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'inline-block'
                        }}
                    >
                        Create Your First Booking
                    </Link>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredBookings.map(booking => (
                        <div key={booking._id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease',
                            border: '1px solid transparent'
                        }} onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }} onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        margin: '0 0 4px 0'
                                    }}>
                                        #{booking.bookingId}
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        margin: 0
                                    }}>
                                        {new Date(booking.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <StatusBadge value={booking.status} title={booking.status} />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        flexShrink: 0
                                    }}>
                                        <span style={{ color: '#3b82f6', fontSize: '16px' }}>👤</span>
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#1f2937',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {booking.customer?.profile?.firstName} {booking.customer?.profile?.lastName}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            margin: 0
                                        }}>
                                            Customer
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        flexShrink: 0
                                    }}>
                                        <span style={{ color: '#3b82f6', fontSize: '16px' }}>🚗</span>
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#1f2937',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {booking.vehicle?.make} {booking.vehicle?.model}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            margin: 0
                                        }}>
                                            {booking.vehicle?.registrationNumber}
                                        </p>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        flexShrink: 0
                                    }}>
                                        <span style={{ color: '#3b82f6', fontSize: '16px' }}>🔧</span>
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#1f2937',
                                            margin: '0 0 2px 0'
                                        }}>
                                            {booking.serviceType?.charAt(0).toUpperCase() + booking.serviceType?.slice(1)}
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            margin: 0
                                        }}>
                                            Service Type
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                borderTop: '1px solid #f3f4f6',
                                paddingTop: '16px'
                            }}>
                                <Link
                                    to={`/bookings/${booking._id}`}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
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
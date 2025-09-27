// src/features/bookings/ServiceAdvisorBookings.tsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

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
  serviceType: string;
  priority: string;
}

export default function ServiceAdvisorBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterState>({
    serviceType: "",
    priority: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadConfirmedBookings();
  }, [filter]);

  async function loadConfirmedBookings() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.serviceType) params.set("serviceType", filter.serviceType);
      if (filter.priority) params.set("priority", filter.priority);

      const response = await http.get(`/bookings?${params.toString()}`);
      const allBookings = response.data?.bookings || [];

      // Filter for pending and inspecting bookings
      const filteredBookings = allBookings.filter((booking: any) =>
        booking.status === "pending" || booking.status === "inspecting"
      );

      setBookings(filteredBookings);
    } catch (error) {
      console.error("Failed to load pending and inspecting bookings:", error);
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
          Pending & Inspecting Bookings
        </h1>

        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f59e0b',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {filteredBookings.length} Bookings Need Attention
        </div>
      </div>

      {/* Filters Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Quick Search */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Quick Search
            </label>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Service Type Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Service Type
            </label>
            <select
              value={filter.serviceType}
              onChange={(e) => setFilter(prev => ({ ...prev, serviceType: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">All Services</option>
              {serviceTypeOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Priority
            </label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
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
      </div>

      {/* Bookings Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading confirmed bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              No Bookings Need Attention
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              There are no pending or inspecting bookings at the moment.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Booking ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Customer
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Vehicle
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Service
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Priority
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Scheduled Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>
                      {booking.bookingId}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {booking.customer?.profile?.firstName && booking.customer?.profile?.lastName
                        ? `${booking.customer.profile.firstName} ${booking.customer.profile.lastName}`
                        : 'N/A'
                      }
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {booking.vehicle?.registrationNumber || 'N/A'}
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {booking.vehicle?.make && booking.vehicle?.model
                          ? `${booking.vehicle.make} ${booking.vehicle.model}`
                          : ''
                        }
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {booking.serviceType?.charAt(0).toUpperCase() + booking.serviceType?.slice(1) || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: booking.status === 'pending' ? '#fef3c7' :
                          booking.status === 'inspecting' ? '#dbeafe' : '#f3f4f6',
                        color: booking.status === 'pending' ? '#d97706' :
                          booking.status === 'inspecting' ? '#2563eb' : '#6b7280'
                      }}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: booking.priority === 'urgent' ? '#fef2f2' :
                          booking.priority === 'high' ? '#fff7ed' :
                            booking.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                        color: booking.priority === 'urgent' ? '#dc2626' :
                          booking.priority === 'high' ? '#ea580c' :
                            booking.priority === 'medium' ? '#d97706' : '#16a34a'
                      }}>
                        {booking.priority
                          ? booking.priority.charAt(0).toUpperCase() + booking.priority.slice(1)
                          : 'Medium'
                        }
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {booking.scheduledDate
                        ? new Date(booking.scheduledDate).toLocaleDateString()
                        : 'N/A'
                      }
                      {booking.timeSlot && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {booking.timeSlot}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/bookings/${booking._id}`}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/jobs/new/${booking._id}`}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Create Job
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
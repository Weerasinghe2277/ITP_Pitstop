// src/features/bookings/BookingDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../store/AuthContext";

export default function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [inspectors, setInspectors] = useState([]);
    const [inspectorId, setInspectorId] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    // const [notes, setNotes] = useState("");
    // const [isAddingNote, setIsAddingNote] = useState(false);
    const [timeline, setTimeline] = useState([]);

    const isAdmin = user?.role === "admin";
    const isManager = user?.role === "manager";
    const isServiceAdvisor = user?.role === "service_advisor";
    const isCashier = user?.role === "cashier";
    const canAssignInspector = isAdmin || isManager || isCashier;
    const canAccessBookingActions = isAdmin || isManager || isCashier; // New condition for booking actions

    async function loadBooking() {
        try {
            const response = await http.get(`/bookings/${id}`);
            setBooking(response.data?.booking);
            // setNotes(response.data?.booking?.notes[0].note || "");

            // Generate timeline from status history
            if (response.data?.booking?.statusHistory) {
                const timelineData = response.data.booking.statusHistory.map(item => ({
                    status: item.status,
                    timestamp: new Date(item.timestamp).toLocaleString(),
                    changedBy: item.changedBy?.name || 'System'
                }));
                setTimeline(timelineData);

                return response.data;
            }
        } catch (error) {
            console.log(error);
            setMessage({ text: "Failed to load booking details", type: "error" });
        }
    }

    async function loadInspectors() {
        try {
            const response = await http.get("/bookings/available-inspectors");
            setInspectors(response.data?.inspectors || []);
        } catch (error) {
            setMessage({ text: "Failed to load inspectors", type: "error" });
        }
    }

    useEffect(() => {
        loadBooking();
        if (canAssignInspector) {
            console.log("Loading inspectors...");
            loadInspectors();
        }
    }, [id]);

    async function assignInspector() {
        if (!inspectorId) {
            setMessage({ text: "Please select an inspector", type: "error" });
            return;
        }

        setIsLoading(true);
        try {
            await http.patch(`/bookings/${id}/assign-inspector`, { inspector: inspectorId });
            // await http.patch(`/bookings/${id}/status`, { status: "inspecting" });
            setMessage({ text: "Inspector assigned and status updated to inspecting", type: "success" });
            await loadBooking();
            setInspectorId("");
        } catch (error) {
            setMessage({ text: error.response?.data?.msg || "Failed to assign inspector", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    async function updateStatus(newStatus) {
        setIsLoading(true);
        try {
            await http.patch(`/bookings/${id}/status`, { status: newStatus });
            setMessage({ text: `Status updated to ${newStatus}`, type: "success" });
            await loadBooking();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to update status", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    async function cancelBooking() {
        if (!cancelReason) {
            setMessage({ text: "Please provide a reason for cancellation", type: "error" });
            return;
        }

        setIsCancelling(true);
        try {
            await http.patch(`/bookings/${id}/cancel`, { reason: cancelReason });
            setMessage({ text: "Booking cancelled successfully", type: "success" });
            setShowCancelDialog(false);
            setCancelReason("");
            await loadBooking();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to cancel booking", type: "error" });
        } finally {
            setIsCancelling(false);
        }
    }

    // async function updateNotes() {
    //     setIsAddingNote(true);
    //     try {
    //         await http.patch(`/bookings/${id}/notes`, { notes });
    //         setMessage({ text: "Notes updated successfully", type: "success" });
    //     } catch (error) {
    //         setMessage({ text: error.response?.data?.message || "Failed to update notes", type: "error" });
    //     } finally {
    //         setIsAddingNote(false);
    //     }
    // }

    async function sendReminder() {
        try {
            await http.post(`/bookings/${id}/send-reminder`);
            setMessage({ text: "Reminder sent successfully", type: "success" });
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to send reminder", type: "error" });
        }
    }

    if (!booking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh'
            }}>
                <div>Loading booking details...</div>
            </div>
        );
    }

    // Theme variables based on dark mode (you can integrate with your context)
    const darkMode = false; // This should come from your theme context
    const theme = {
        background: darkMode ? "#1f2937" : "#f9fafb",
        text: darkMode ? "#f3f4f6" : "#111827",
        card: darkMode ? "#374151" : "#ffffff",
        border: darkMode ? "#4b5563" : "#e5e7eb",
        mutedText: darkMode ? "#9ca3af" : "#6b7280",
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
                alignItems: 'flex-start',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ flex: 1 }}>
                    <Link
                        to="/bookings"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: '#3b82f6',
                            textDecoration: 'none',
                            marginBottom: '8px',
                            fontSize: '14px'
                        }}
                    >
                        ← Back to Bookings
                    </Link>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: theme.text,
                        margin: '0 0 16px 0'
                    }}>
                        Booking #{booking.bookingId}
                    </h1>

                    {/* Status Timeline - Moved under the booking title */}
                    <div style={{
                        background: theme.card,
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${theme.border}`,
                        marginBottom: '0'
                    }}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: theme.text,
                            marginBottom: '16px',
                            paddingBottom: '8px',
                            borderBottom: `1px solid ${theme.border}`
                        }}>
                            Status Timeline
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            {['pending', 'inspecting', 'working', 'completed', 'cancelled'].map((status, index, array) => (
                                <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: booking.status === status ? '#3b82f6' :
                                            array.indexOf(booking.status) >= index ? '#10b981' : '#e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '11px',
                                        zIndex: 2,
                                        position: 'relative'
                                    }}>
                                        {index + 1}
                                    </div>
                                    {index < array.length - 1 && (
                                        <div style={{
                                            flex: 1,
                                            height: '2px',
                                            backgroundColor: array.indexOf(booking.status) > index ? '#10b981' : '#e5e7eb'
                                        }} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            {['Pending', 'Inspecting', 'Working', 'Completed', 'Cancelled'].map((label, index) => (
                                <div key={index} style={{
                                    fontSize: '11px',
                                    color: theme.mutedText,
                                    textAlign: 'center',
                                    width: `${100 / 5}%`,
                                    padding: '0 2px'
                                }}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Status History */}
                        {timeline.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Status History</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {timeline.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            backgroundColor: index % 2 === 0 ? (darkMode ? '#374151' : '#f9fafb') : 'transparent',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            <span style={{ fontWeight: '500', flex: 1 }}>{item.status}</span>
                                            <span style={{ color: theme.mutedText, flex: 1, textAlign: 'center' }}>{item.timestamp}</span>
                                            <span style={{ color: theme.mutedText, flex: 1, textAlign: 'right' }}>By: {item.changedBy}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <StatusBadge value={booking.status} size="large" />
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
                {/* Booking Information Card */}
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
                        Booking Information
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Customer:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.customer?.profile ? `${(booking as any).customer.profile.firstName} ${(booking as any).customer.profile.lastName}` : 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Email:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.customer?.email || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Phone:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.customer?.profile?.phoneNumber || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Vehicle:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.vehicle ? `${(booking as any).vehicle.make} ${(booking as any).vehicle.model} (${(booking as any).vehicle.year})` : 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Registration:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.vehicle?.registrationNumber || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Service Type:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {booking.serviceType || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Scheduled Date:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {new Date(booking.scheduledDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <span style={{ flex: '1', color: theme.mutedText }}>Estimated Duration:</span>
                            <span style={{ flex: '1', fontWeight: '500' }}>
                                {(booking as any)?.estimatedDuration || 'N/A'} hours
                            </span>
                        </div>
                    </div>
                </div>

                {/* Assignment Card */}
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
                        {canAssignInspector && !booking.assignedInspector ? 'Assign Inspector' : 'Assigned Inspector'}
                    </h2>

                    {canAssignInspector && !booking.assignedInspector ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {<div>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: theme.text,
                                marginBottom: '6px'
                            }}>
                                Select Inspector
                            </label>
                            <select
                                value={inspectorId}
                                onChange={(e) => setInspectorId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#ffffff',
                                    color: '#000000'
                                }}
                            >
                                <option value="">Select an inspector</option>
                                {inspectors.map(inspector => (
                                    <option key={inspector._id} value={inspector._id}>
                                        {inspector.profile?.firstName} {inspector.profile?.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>}

                        <button
                            onClick={assignInspector}
                            disabled={isLoading || !inspectorId}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: isLoading || !inspectorId ? 'not-allowed' : 'pointer',
                                opacity: isLoading || !inspectorId ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span>Processing...</span>
                                    <div style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                </>
                            ) : (
                                'Assign & Mark as Inspecting'
                            )}
                        </button>

                        {booking.inspector && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe',
                                borderRadius: '8px',
                                border: `1px solid ${darkMode ? '#1e40af' : '#93c5fd'}`
                            }}>
                                <p style={{ margin: 0, fontSize: '14px', color: darkMode ? '#dbeafe' : '#1e40af' }}>
                                    Currently assigned to: <strong>{booking.inspector.profile?.firstName} {booking.inspector.profile?.lastName}</strong>
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: darkMode ? '#93c5fd' : '#3b82f6' }}>
                                    Email: {booking.inspector.email}
                                </p>
                            </div>
                        )}
                    </div>) : (<h1>{booking.assignedInspector.fullName}</h1>)}
                </div>

                {/* Notes Card */}
                {/* <div style={{
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
                        Notes & Comments
                    </h2>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this booking..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            marginBottom: '12px'
                        }}
                    />

                    <button
                        onClick={updateNotes}
                        disabled={isAddingNote}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isAddingNote ? 'not-allowed' : 'pointer',
                            opacity: isAddingNote ? 0.6 : 1
                        }}
                    >
                        {isAddingNote ? 'Saving...' : 'Save Notes'}
                    </button>
                </div> */}
            </div>

            {/* Booking Actions Card - Conditionally rendered */}
            {canAccessBookingActions && (
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
                        Booking Actions
                    </h2>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Removed Create Job button */}

                        <Link
                            to={`/invoices/new/${booking._id}`}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#8b5cf6',
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
                            <span>Generate Invoice</span>
                        </Link>

                        <button
                            onClick={sendReminder}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#f59e0b',
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
                            <span>Send Reminder</span>
                        </button>

                        {booking.status !== 'cancelled' && (
                            <button
                                onClick={() => setShowCancelDialog(true)}
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#ef4444',
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
                                <span>Cancel Booking</span>
                            </button>
                        )}

                        {/* Removed Quick Status Update Buttons (Start Inspection, Start Working, Mark as Completed) */}
                    </div>
                </div>
            )}

            {/* Cancel Booking Dialog */}
            {showCancelDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: theme.card,
                        borderRadius: '12px',
                        padding: '24px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Cancel Booking</h2>
                        <p style={{ marginBottom: '16px' }}>Please provide a reason for cancellation:</p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                marginBottom: '16px'
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setShowCancelDialog(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={cancelBooking}
                                disabled={isCancelling || !cancelReason.trim()}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isCancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
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
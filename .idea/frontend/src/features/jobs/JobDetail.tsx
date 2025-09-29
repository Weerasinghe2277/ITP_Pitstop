// src/features/jobs/JobDetail.tsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, type ChangeEvent } from "react";
import { http } from "../../lib/http";
import { useAuth } from "../../store/AuthContext";
import StatusBadge from "../../components/StatusBadge";
import { Enums } from "../../lib/validators";

interface Labourer {
    _id: string;
    labourer: {
        _id: string;
        userId: string;
        profile: {
            firstName: string;
            lastName: string;
        };
        employeeDetails?: {
            department?: string;
            specializations?: string[];
            employeeId?: string;
        };
    };
    assignedAt: string;
    hoursWorked: number;
}

interface WorkLogEntry {
    _id: string;
    labourer: {
        _id: string;
        userId: string;
        profile: {
            firstName: string;
            lastName: string;
        };
    };
    startTime: string;
    endTime: string;
    hoursWorked: number;
    description?: string;
    loggedAt?: string;
}

interface Job {
    _id: string;
    jobId: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    priority: string;
    estimatedHours: number;
    actualHours: number;
    estimatedCost: number;
    actualCost: number;
    partsCost: number;
    labourCost: number;
    scheduledDate?: string;
    booking?: {
        _id: string;
        bookingId: string;
        customer?: {
            userId: string;
            profile: {
                firstName: string;
                lastName: string;
                phoneNumber?: string;
            };
        };
        vehicle?: {
            registrationNumber: string;
            make: string;
            model: string;
            year?: number;
            color?: string;
        };
        serviceType: string;
        scheduledDate?: string;
        status?: string;
    };
    createdBy?: {
        _id: string;
        userId: string;
        profile: {
            firstName: string;
            lastName: string;
        };
        role?: string;
    };
    assignedLabourers: Labourer[];
    workLog: WorkLogEntry[];
    requirements?: {
        skills?: string[];
        tools?: string[];
        materials?: any[];
    };
    inspectionReport?: {
        preWorkInspection?: {
            condition?: string;
            issues?: string[];
            photos?: string[];
            inspector?: any;
            inspectedAt?: string;
        };
        postWorkInspection?: {
            condition?: string;
            issues?: string[];
            photos?: string[];
            qualityRating?: number;
            approved?: boolean;
            inspector?: any;
            inspectedAt?: string;
        };
    };
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    inspectedBy?: any;
}

interface WorkLogRequest {
    startTime: string;
    endTime: string;
    description: string;
}

interface StatusUpdateRequest {
    status: string;
    notes?: string;
}

export default function JobDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [status, setStatus] = useState<string>("");
    const [statusNotes, setStatusNotes] = useState<string>("");
    const [workLogDescription, setWorkLogDescription] = useState<string>("");
    const [workLogStartTime, setWorkLogStartTime] = useState<string>("");
    const [workLogEndTime, setWorkLogEndTime] = useState<string>("");
    const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | "info" | "" }>({ text: "", type: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);
    const [addingWorkLog, setAddingWorkLog] = useState<boolean>(false);

    console.log("Current user:", user); // Debug log
    console.log("Job ID:", id); // Debug log

    async function load() {
        if (!id) {
            setMsg({ text: "No job ID provided", type: "error" });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setMsg({ text: "", type: "" });
            console.log(`Loading job details for ID: ${id}`);

            const response = await http.get(`/jobs/${id}`);
            console.log("Job API response:", response.data);

            const jobData = response.data?.job as Job | undefined;
            if (jobData) {
                setJob(jobData);
                setStatus(jobData.status || "");
                console.log("Job loaded successfully:", jobData);

                // Check if current user is assigned to this job (for technicians)
                if (user?.role === "technician") {
                    const isAssigned = jobData.assignedLabourers?.some(
                        assignment => assignment.labourer._id === user._id || assignment.labourer.userId === user.userId
                    );
                    if (!isAssigned) {
                        setMsg({
                            text: "You are not assigned to this job. Only assigned technicians can view job details.",
                            type: "info"
                        });
                    }
                }
            } else {
                setJob(null);
                setMsg({ text: "Job data not found in response", type: "error" });
            }
        } catch (error: any) {
            console.error("Error loading job:", error);
            let errorMessage = "Failed to load job details";

            if (error.response?.status === 403) {
                errorMessage = "Access denied. You don't have permission to view this job.";
            } else if (error.response?.status === 401) {
                errorMessage = "Authentication required. Please log in again.";
            } else if (error.response?.status === 404) {
                errorMessage = "Job not found. It may have been deleted or the ID is incorrect.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMsg({ text: errorMessage, type: "error" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [id, user]);

    async function updateStatus() {
        if (!id || !status.trim()) {
            setMsg({ text: "Please select a status", type: "error" });
            return;
        }

        // Additional validation for technicians
        if (user?.role === "technician" && job) {
            const isAssigned = job.assignedLabourers?.some(
                assignment => assignment.labourer._id === user._id || assignment.labourer.userId === user.userId
            );
            if (!isAssigned) {
                setMsg({ text: "You can only update status for jobs assigned to you", type: "error" });
                return;
            }

            // Validate status transitions for technicians
            const allowedTransitions: Record<string, string[]> = {
                "pending": ["working"],
                "working": ["completed", "on_hold"],
                "on_hold": ["working"]
            };

            const currentStatus = job.status;
            if (!allowedTransitions[currentStatus]?.includes(status)) {
                setMsg({
                    text: `Invalid status transition from ${currentStatus} to ${status}. ${
                        allowedTransitions[currentStatus]
                            ? `Allowed transitions: ${allowedTransitions[currentStatus].join(", ")}`
                            : "No transitions allowed from current status"
                    }`,
                    type: "error"
                });
                return;
            }
        }

        setUpdating(true);
        setMsg({ text: "", type: "" });

        try {
            const requestData: StatusUpdateRequest = {
                status: status.trim(),
                notes: statusNotes.trim() || undefined
            };

            console.log("Updating job status:", requestData);
            await http.patch(`/jobs/${id}/status`, requestData);
            setMsg({ text: "Status updated successfully", type: "success" });
            setStatusNotes("");
            await load();
        } catch (error: any) {
            console.error("Error updating status:", error);
            let errorMessage = "Failed to update status";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMsg({ text: errorMessage, type: "error" });
        } finally {
            setUpdating(false);
        }
    }

    async function addWorkLog() {
        if (!id || !workLogStartTime || !workLogEndTime) {
            setMsg({ text: "Please enter start and end times", type: "error" });
            return;
        }

        const start = new Date(workLogStartTime);
        const end = new Date(workLogEndTime);

        if (start >= end) {
            setMsg({ text: "End time must be after start time", type: "error" });
            return;
        }

        // Check if work log is for a future date
        if (start > new Date()) {
            setMsg({ text: "Start time cannot be in the future", type: "error" });
            return;
        }

        // Additional validation for technicians
        if (user?.role === "technician" && job) {
            const isAssigned = job.assignedLabourers?.some(
                assignment => assignment.labourer._id === user._id || assignment.labourer.userId === user.userId
            );
            if (!isAssigned) {
                setMsg({ text: "You can only add work logs for jobs assigned to you", type: "error" });
                return;
            }
        }

        setAddingWorkLog(true);
        setMsg({ text: "", type: "" });

        try {
            const requestData: WorkLogRequest = {
                startTime: workLogStartTime,
                endTime: workLogEndTime,
                description: workLogDescription.trim() || "Work progress logged",
            };

            console.log("Adding work log:", requestData);
            await http.post(`/jobs/${id}/work-log`, requestData);
            setMsg({ text: "Work log added successfully", type: "success" });
            setWorkLogStartTime("");
            setWorkLogEndTime("");
            setWorkLogDescription("");
            await load();
        } catch (error: any) {
            console.error("Error adding work log:", error);
            let errorMessage = "Failed to add work log";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMsg({ text: errorMessage, type: "error" });
        } finally {
            setAddingWorkLog(false);
        }
    }

    // Enhanced permission checks
    const canUpdateStatus = user?.role && ["admin", "manager", "service_advisor", "technician"].includes(user.role);
    const canAddWorkLog = user?.role === "technician";
    const isAssignedTechnician = user?.role === "technician" && job?.assignedLabourers?.some(
        assignment => assignment.labourer._id === user._id || assignment.labourer.userId === user.userId
    );

    // Set default datetime values
    useEffect(() => {
        const now = new Date();
        const nowString = now.toISOString().slice(0, 16);
        if (!workLogStartTime) {
            setWorkLogStartTime(nowString);
        }
    }, []);

    // Styles (keeping your existing styles)
    const wrap: React.CSSProperties = {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const headerRow: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "12px",
        flexWrap: "wrap",
    };
    const title: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: "#1f2937", margin: 0 };
    const card: React.CSSProperties = {
        background: "white",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: 24,
    };
    const sectionTitle: React.CSSProperties = {
        fontSize: 18,
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #e5e7eb",
    };
    const grid: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
    };
    const field: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: 4,
    };
    const label: React.CSSProperties = {
        fontSize: 13,
        color: "#6b7280",
        fontWeight: 500,
    };
    const value: React.CSSProperties = {
        fontSize: 15,
        color: "#1f2937",
        fontWeight: 600,
    };
    const control: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 14,
        backgroundColor: "white",
    };
    const btn = (bg: string, disabled: boolean = false): React.CSSProperties => ({
        padding: "12px 20px",
        backgroundColor: disabled ? "#9ca3af" : bg,
        color: "white",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
    });
    const backBtn: React.CSSProperties = {
        padding: "10px 14px",
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
    };

    if (loading) {
        return (
            <div style={wrap}>
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading job details...</span>
                    <div
                        style={{
                            width: 14,
                            height: 14,
                            border: "2px solid transparent",
                            borderTop: "2px solid #6b7280",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    />
                </div>
                <style>{`@keyframes spin { 0%{ transform: rotate(0deg);} 100%{ transform: rotate(360deg);} }`}</style>
            </div>
        );
    }

    if (!job) {
        return (
            <div style={wrap}>
                <div style={headerRow}>
                    <h1 style={title}>Job Not Found</h1>
                    <Link to="/jobs" style={backBtn}>
                        ← Back to Jobs
                    </Link>
                </div>
                {msg.text && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: 8,
                            marginBottom: 24,
                            backgroundColor: msg.type === "error" ? "#fef2f2" : "#eff6ff",
                            color: msg.type === "error" ? "#991b1b" : "#1e40af",
                            border: `1px solid ${msg.type === "error" ? "#fecaca" : "#93c5fd"}`,
                        }}
                    >
                        {msg.text}
                    </div>
                )}
                <div style={card}>
                    <p style={{ color: "#6b7280", marginBottom: 20 }}>
                        The requested job could not be found. This might be because:
                    </p>
                    <ul style={{ color: "#6b7280", marginLeft: 20 }}>
                        <li>The job ID is incorrect</li>
                        <li>The job has been deleted</li>
                        <li>You don't have permission to view this job</li>
                        <li>There's a connection issue</li>
                    </ul>
                </div>
            </div>
        );
    }

    const priorityColors: Record<string, string> = {
        low: "#10b981",
        medium: "#f59e0b",
        high: "#ef4444",
        urgent: "#dc2626",
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <div>
                    <h1 style={title}>{job.jobId} - {job.title}</h1>
                    <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <StatusBadge value={job.status} />
                        <span style={{
                            padding: "4px 12px",
                            backgroundColor: priorityColors[job.priority] || "#6b7280",
                            color: "white",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "uppercase",
                        }}>
                            {job.priority}
                        </span>
                        <span style={{
                            padding: "4px 12px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                        }}>
                            {job.category}
                        </span>
                        {user?.role === "technician" && isAssignedTechnician && (
                            <span style={{
                                padding: "4px 12px",
                                backgroundColor: "#059669",
                                color: "white",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                            }}>
                                Assigned to You
                            </span>
                        )}
                    </div>
                </div>
                <Link to={job.booking ? `/bookings/${job.booking._id}` : "/jobs"} style={backBtn}>
                    ← Back
                </Link>
            </div>

            {/* Message */}
            {msg.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 24,
                        backgroundColor:
                            msg.type === "error" ? "#fef2f2" :
                                msg.type === "info" ? "#eff6ff" : "#f0fdf4",
                        color:
                            msg.type === "error" ? "#991b1b" :
                                msg.type === "info" ? "#1e40af" : "#166534",
                        border: `1px solid ${
                            msg.type === "error" ? "#fecaca" :
                                msg.type === "info" ? "#93c5fd" : "#bbf7d0"
                        }`,
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* Rest of your existing JSX with all the job details cards... */}
            {/* Job Overview */}
            <div style={card}>
                <h2 style={sectionTitle}>Job Overview</h2>
                {job.description && (
                    <p style={{ color: "#4b5563", marginBottom: 20, lineHeight: 1.6 }}>{job.description}</p>
                )}
                <div style={grid}>
                    <div style={field}>
                        <span style={label}>Job ID</span>
                        <span style={value}>{job.jobId}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Status</span>
                        <span style={value}>{job.status}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Priority</span>
                        <span style={value}>{job.priority}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Category</span>
                        <span style={value}>{job.category}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Created At</span>
                        <span style={value}>{new Date(job.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Updated At</span>
                        <span style={value}>{new Date(job.updatedAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Booking Information */}
            {job.booking && (
                <div style={card}>
                    <h2 style={sectionTitle}>Booking Information</h2>
                    <div style={grid}>
                        <div style={field}>
                            <span style={label}>Booking ID</span>
                            <span style={value}>
                                <Link to={`/bookings/${job.booking._id}`} style={{ color: "#3b82f6", textDecoration: "none" }}>
                                    {job.booking.bookingId}
                                </Link>
                            </span>
                        </div>
                        <div style={field}>
                            <span style={label}>Service Type</span>
                            <span style={value}>{job.booking.serviceType}</span>
                        </div>
                        {job.booking.customer && (
                            <div style={field}>
                                <span style={label}>Customer</span>
                                <span style={value}>
                                    {job.booking.customer.profile.firstName} {job.booking.customer.profile.lastName}
                                </span>
                            </div>
                        )}
                        {job.booking.customer?.profile.phoneNumber && (
                            <div style={field}>
                                <span style={label}>Phone</span>
                                <span style={value}>
                                    <a href={`tel:${job.booking.customer.profile.phoneNumber}`} style={{ color: "#3b82f6", textDecoration: "none" }}>
                                        {job.booking.customer.profile.phoneNumber}
                                    </a>
                                </span>
                            </div>
                        )}
                        {job.booking.vehicle && (
                            <>
                                <div style={field}>
                                    <span style={label}>Vehicle</span>
                                    <span style={value}>
                                        {job.booking.vehicle.make} {job.booking.vehicle.model}
                                        {job.booking.vehicle.year && ` (${job.booking.vehicle.year})`}
                                    </span>
                                </div>
                                <div style={field}>
                                    <span style={label}>Registration</span>
                                    <span style={value}>{job.booking.vehicle.registrationNumber}</span>
                                </div>
                                {job.booking.vehicle.color && (
                                    <div style={field}>
                                        <span style={label}>Color</span>
                                        <span style={value}>{job.booking.vehicle.color}</span>
                                    </div>
                                )}
                            </>
                        )}
                        {job.booking.scheduledDate && (
                            <div style={field}>
                                <span style={label}>Scheduled Date</span>
                                <span style={value}>{new Date(job.booking.scheduledDate).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cost & Hours Breakdown */}
            <div style={card}>
                <h2 style={sectionTitle}>Cost & Hours Breakdown</h2>
                <div style={grid}>
                    <div style={field}>
                        <span style={label}>Estimated Hours</span>
                        <span style={value}>{job.estimatedHours} hrs</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Actual Hours</span>
                        <span style={value}>{job.actualHours} hrs</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Estimated Cost</span>
                        <span style={value}>Rs. {job.estimatedCost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Actual Cost</span>
                        <span style={value}>Rs. {job.actualCost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Parts Cost</span>
                        <span style={value}>Rs. {job.partsCost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div style={field}>
                        <span style={label}>Labour Cost</span>
                        <span style={value}>Rs. {job.labourCost?.toFixed(2) || "0.00"}</span>
                    </div>
                </div>
            </div>

            {/* Assigned Technicians */}
            {job.assignedLabourers && job.assignedLabourers.length > 0 && (
                <div style={card}>
                    <h2 style={sectionTitle}>Assigned Technicians ({job.assignedLabourers.length})</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {job.assignedLabourers.map((assignment) => (
                            <div
                                key={assignment._id}
                                style={{
                                    padding: 16,
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: "#1f2937", marginBottom: 4 }}>
                                            {assignment.labourer.profile.firstName} {assignment.labourer.profile.lastName}
                                            {user?.role === "technician" &&
                                                (assignment.labourer._id === user._id || assignment.labourer.userId === user.userId) &&
                                                <span style={{ marginLeft: 8, padding: "2px 6px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>YOU</span>
                                            }
                                        </div>
                                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                                            {assignment.labourer.userId} • {assignment.labourer.employeeDetails?.department || "N/A"}
                                            {assignment.labourer.employeeDetails?.employeeId && ` (${assignment.labourer.employeeDetails.employeeId})`}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <div style={field}>
                                            <span style={label}>Assigned</span>
                                            <span style={{ ...value, fontSize: 13 }}>
                                                {new Date(assignment.assignedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={field}>
                                            <span style={label}>Hours Worked</span>
                                            <span style={{ ...value, fontSize: 13 }}>{assignment.hoursWorked || 0} hrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Created By */}
            {job.createdBy && (
                <div style={card}>
                    <h2 style={sectionTitle}>Created By</h2>
                    <div style={grid}>
                        <div style={field}>
                            <span style={label}>Name</span>
                            <span style={value}>
                                {job.createdBy.profile.firstName} {job.createdBy.profile.lastName}
                            </span>
                        </div>
                        <div style={field}>
                            <span style={label}>User ID</span>
                            <span style={value}>{job.createdBy.userId}</span>
                        </div>
                        {job.createdBy.role && (
                            <div style={field}>
                                <span style={label}>Role</span>
                                <span style={value}>{job.createdBy.role}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Work Log */}
            {job.workLog && job.workLog.length > 0 && (
                <div style={card}>
                    <h2 style={sectionTitle}>Work Log ({job.workLog.length} entries)</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {job.workLog.map((log) => (
                            <div
                                key={log._id}
                                style={{
                                    padding: 16,
                                    backgroundColor: "#f0fdf4",
                                    borderRadius: 8,
                                    border: "1px solid #bbf7d0",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: "#166534", marginBottom: 4 }}>
                                            {log.labourer.profile.firstName} {log.labourer.profile.lastName}
                                            {user?.role === "technician" &&
                                                (log.labourer._id === user._id || log.labourer.userId === user.userId) &&
                                                <span style={{ marginLeft: 8, padding: "2px 6px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>YOUR LOG</span>
                                            }
                                        </div>
                                        {log.description && (
                                            <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                                                {log.description}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#6b7280" }}>
                                        <div>
                                            <strong>Start:</strong> {new Date(log.startTime).toLocaleString()}
                                        </div>
                                        <div>
                                            <strong>End:</strong> {new Date(log.endTime).toLocaleString()}
                                        </div>
                                        <div>
                                            <strong>Hours:</strong> {log.hoursWorked?.toFixed(2) || "0.00"}
                                        </div>
                                        {log.loggedAt && (
                                            <div style={{ fontSize: 12, fontStyle: "italic" }}>
                                                Logged: {new Date(log.loggedAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Requirements */}
            {(job.requirements?.skills?.length || job.requirements?.tools?.length || job.requirements?.materials?.length) && (
                <div style={card}>
                    <h2 style={sectionTitle}>Requirements</h2>
                    <div style={grid}>
                        {job.requirements.skills && job.requirements.skills.length > 0 && (
                            <div style={field}>
                                <span style={label}>Required Skills</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                    {job.requirements.skills.map((skill, i) => (
                                        <span key={i} style={{ padding: "4px 10px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {job.requirements.tools && job.requirements.tools.length > 0 && (
                            <div style={field}>
                                <span style={label}>Required Tools</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                    {job.requirements.tools.map((tool, i) => (
                                        <span key={i} style={{ padding: "4px 10px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {job.requirements.materials && job.requirements.materials.length > 0 && (
                            <div style={field}>
                                <span style={label}>Required Materials</span>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                                    {job.requirements.materials.map((material, i) => (
                                        <span key={i} style={{ padding: "4px 10px", backgroundColor: "#f3e8ff", color: "#6b21a8", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                                            {typeof material === 'object' && material.name ? material.name : String(material)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
                {canUpdateStatus && (user?.role !== "technician" || isAssignedTechnician) && (
                    <div style={card}>
                        <h2 style={sectionTitle}>Update Job Status</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={updating} style={control}>
                                <option value="">Select status</option>
                                {Enums.JobStatus.map((s: string) => (
                                    <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                placeholder="Notes (optional)"
                                value={statusNotes}
                                onChange={(e) => setStatusNotes(e.target.value)}
                                disabled={updating}
                                style={{ ...control, minHeight: 80, resize: "vertical" }}
                            />
                            <button type="button" onClick={updateStatus} disabled={updating || !status.trim()} style={btn("#3b82f6", updating || !status.trim())}>
                                {updating ? "Updating..." : "Update Status"}
                            </button>
                        </div>
                    </div>
                )}

                {canAddWorkLog && (user?.role !== "technician" || isAssignedTechnician) && (
                    <div style={card}>
                        <h2 style={sectionTitle}>Add Work Log</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ ...label, display: "block", marginBottom: 6 }}>Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={workLogStartTime}
                                    onChange={(e) => setWorkLogStartTime(e.target.value)}
                                    disabled={addingWorkLog}
                                    style={control}
                                />
                            </div>
                            <div>
                                <label style={{ ...label, display: "block", marginBottom: 6 }}>End Time</label>
                                <input
                                    type="datetime-local"
                                    value={workLogEndTime}
                                    onChange={(e) => setWorkLogEndTime(e.target.value)}
                                    disabled={addingWorkLog}
                                    style={control}
                                />
                            </div>
                            <textarea
                                placeholder="Description of work performed..."
                                value={workLogDescription}
                                onChange={(e) => setWorkLogDescription(e.target.value)}
                                disabled={addingWorkLog}
                                style={{ ...control, minHeight: 80, resize: "vertical" }}
                            />
                            <button
                                type="button"
                                onClick={addWorkLog}
                                disabled={addingWorkLog || !workLogStartTime || !workLogEndTime}
                                style={btn("#10b981", addingWorkLog || !workLogStartTime || !workLogEndTime)}
                            >
                                {addingWorkLog ? "Adding..." : "Add Work Log"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { 0%{ transform: rotate(0deg);} 100%{ transform: rotate(360deg);} }`}</style>
        </div>
    );
}

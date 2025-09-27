// src/features/jobs/JobDetail.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState, type ChangeEvent } from "react";
import { http } from "../../lib/http";
import { useAuth } from "../../store/AuthContext";
import StatusBadge from "../../components/StatusBadge";
import { Enums } from "../../lib/validators";

interface Job {
    id?: string;
    _id?: string;
    jobId: string;
    title: string;
    status: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface WorkLogRequest {
    hoursLogged: number;
    note: string;
}

interface StatusUpdateRequest {
    status: string;
}

export default function JobDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [status, setStatus] = useState<string>("");
    const [hours, setHours] = useState<number>(1);
    const [msg, setMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);
    const [addingWorkLog, setAddingWorkLog] = useState<boolean>(false);

    async function load() {
        if (!id) return;
        try {
            setLoading(true);
            setMsg({ text: "", type: "" });
            const response = await http.get(`/jobs/${id}`);
            const jobData = response.data?.job as Job | undefined;
            if (jobData) {
                setJob(jobData);
                setStatus(jobData.status || "");
            } else {
                setJob(null);
            }
        } catch (error: any) {
            setMsg({ text: `Failed to load job: ${error?.message || "Unknown error"}`, type: "error" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const r = await http.get(`/jobs/${id}`);
                if (!cancelled) {
                    const jobData = r.data?.job as Job | undefined;
                    setJob(jobData || null);
                    setStatus(jobData?.status || "");
                }
            } catch (e: any) {
                if (!cancelled) setMsg({ text: `Failed to load job: ${e?.message || "Unknown error"}`, type: "error" });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]); // Cleanly loads on id change and avoids setState after unmount with a cancel flag [web:71][web:154]

    async function updateStatus() {
        if (!id || !status.trim()) {
            setMsg({ text: "Please select a status", type: "error" });
            return;
        }
        setUpdating(true);
        setMsg({ text: "", type: "" });
        try {
            const requestData: StatusUpdateRequest = { status: status.trim() };
            await http.patch(`/jobs/${id}/status`, requestData);
            setMsg({ text: "Status updated successfully", type: "success" });
            await load();
        } catch (error: any) {
            setMsg({ text: `Failed to update status: ${error?.message || "Unknown error"}`, type: "error" });
        } finally {
            setUpdating(false);
        }
    }

    async function addWorkLog() {
        if (!id || hours <= 0) {
            setMsg({ text: "Please enter valid hours (greater than 0)", type: "error" });
            return;
        }
        setAddingWorkLog(true);
        setMsg({ text: "", type: "" });
        try {
            const requestData: WorkLogRequest = {
                hoursLogged: hours,
                note: "Work progress logged",
            };
            await http.post(`/jobs/${id}/work-log`, requestData);
            setMsg({ text: "Work log added successfully", type: "success" });
            setHours(1);
            await load();
        } catch (error: any) {
            setMsg({ text: `Failed to add work log: ${error?.message || "Unknown error"}`, type: "error" });
        } finally {
            setAddingWorkLog(false);
        }
    }

    function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
        setStatus(e.target.value);
        if (msg.text) setMsg({ text: "", type: "" });
    }

    function handleHoursChange(e: ChangeEvent<HTMLInputElement>) {
        const value = parseFloat(e.target.value) || 0;
        setHours(Math.max(0, value));
        if (msg.text) setMsg({ text: "", type: "" });
    }

    const canUpdateStatus = user?.role && ["admin", "manager", "service_advisor"].includes(user.role);
    const canAddWorkLog = user?.role === "technician";

    // Styles
    const wrap: React.CSSProperties = {
        maxWidth: "1200px",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
    };
    const rowStyle: React.CSSProperties = { display: "flex" };
    const labelStyle: React.CSSProperties = { flex: 1, color: "#6b7280" };
    const valueStyle: React.CSSProperties = { flex: 1, fontWeight: 500 };
    const control: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        fontSize: 14,
        backgroundColor: "white",
    };
    const btn = (bg: string, border: string): React.CSSProperties => ({
        padding: "12px 20px",
        backgroundColor: bg,
        color: "white",
        border: `1px solid ${border}`,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    });

    if (loading) {
        return (
            <div style={wrap}>
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading job details…</span>
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
                <style>
                    {`@keyframes spin { 0%{ transform: rotate(0deg);} 100%{ transform: rotate(360deg);} }`}
                </style>
            </div>
        );
    }

    if (!job) {
        return (
            <div style={wrap}>
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 24,
                        backgroundColor: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                    }}
                    role="status"
                    aria-live="polite"
                >
                    Job not found
                </div>
            </div>
        );
    }

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>
                    {(job.jobId || job.id || job._id) ?? ""} - {job.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <StatusBadge value={job.status} />
                </div>
            </div>

            {/* Message (live region) */}
            {msg.text && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        padding: "12px 16px",
                        borderRadius: 8,
                        marginBottom: 24,
                        backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: msg.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${msg.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* Job info */}
            <div style={card}>
                <h2 style={sectionTitle}>Job Information</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={rowStyle}>
                        <span style={labelStyle}>Status:</span>
                        <span style={valueStyle}>{job.status}</span>
                    </div>
                    {job.description && (
                        <div style={{ ...rowStyle, alignItems: "flex-start" }}>
                            <span style={labelStyle}>Description:</span>
                            <span style={valueStyle}>{job.description}</span>
                        </div>
                    )}
                    <div style={grid}>
                        <div style={rowStyle}>
                            <span style={labelStyle}>Created:</span>
                            <span style={valueStyle}>
                {job.createdAt ? new Date(job.createdAt).toLocaleString() : "—"}
              </span>
                        </div>
                        <div style={rowStyle}>
                            <span style={labelStyle}>Updated:</span>
                            <span style={valueStyle}>
                {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : "—"}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
                {canUpdateStatus && (
                    <div style={card}>
                        <h2 style={sectionTitle}>Update Status</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                            <select value={status} onChange={handleStatusChange} disabled={updating} style={control}>
                                <option value="">Select status</option>
                                {Enums.JobStatus.map((s: string) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={updateStatus} disabled={updating || !status.trim()} style={btn("#3b82f6", "#2563eb")}>
                                {updating ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </div>
                )}

                {canAddWorkLog && (
                    <div style={card}>
                        <h2 style={sectionTitle}>Add Work Log</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                            <input
                                id="hours"
                                type="number"
                                min={0}
                                step={0.5}
                                value={hours}
                                onChange={handleHoursChange}
                                disabled={addingWorkLog}
                                style={control}
                                aria-label="Hours worked"
                            />
                            <button type="button" onClick={addWorkLog} disabled={addingWorkLog || hours <= 0} style={btn("#10b981", "#059669")}>
                                {addingWorkLog ? "Adding..." : "Add"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>
                {`@keyframes spin { 0%{ transform: rotate(0deg);} 100%{ transform: rotate(360deg);} }`}
            </style>
        </div>
    );
}

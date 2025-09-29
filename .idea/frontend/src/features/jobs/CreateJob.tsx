// src/features/jobs/CreateJob.jsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function CreateJob() {
    const { bookingId } = useParams();
    const nav = useNavigate();
    const [booking, setBooking] = useState(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: Enums.JobCategory[0],
        estimatedHours: 1,
        priority: "medium",
        scheduledDate: "",
        assignedTechnician: "",
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventorySearch, setInventorySearch] = useState("");
    const [inventoryFilter, setInventoryFilter] = useState({ category: "", status: "" });

    async function loadTechnicians() {
        setIsLoadingTechnicians(true);
        try {
            const response = await http.get('/users/technicians/by-specialization');
            setTechnicians(response.data?.technicians || []);
        } catch (error) {
            console.error('Failed to load technicians:', error);
            setMessage({ text: 'Failed to load technicians', type: 'error' });
        } finally {
            setIsLoadingTechnicians(false);
        }
    }

    // Enhanced function to update booking status with job creation
    async function updateBookingStatusToWorking() {
        try {
            console.log(`Updating booking ${bookingId} status to working...`);
            const response = await http.patch(`/bookings/${bookingId}/status`, {
                status: "working",
                updatedBy: "job_creation",
                updatedAt: new Date().toISOString()
            });

            if (response.data?.booking) {
                console.log('Booking status updated successfully:', response.data.booking);
                setBooking(prevBooking => ({
                    ...prevBooking,
                    status: "working",
                    lastStatusUpdate: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Failed to update booking status:', error);
        }
    }

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                const r = await http.get(`/bookings/${bookingId}`);
                if (!ignore) setBooking(r.data?.booking || null);
            } catch (e) {
                if (!ignore) setMessage({ text: e.message || "Failed to load booking", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        loadTechnicians();
        return () => { ignore = true; };
    }, [bookingId]);

    useEffect(() => {
        if (showInventoryModal) {
            loadInventoryItems();
        }
    }, [showInventoryModal, inventoryFilter]);

    async function loadInventoryItems() {
        try {
            const params = new URLSearchParams();
            if (inventoryFilter.category) params.set("category", inventoryFilter.category);
            if (inventoryFilter.status) params.set("status", inventoryFilter.status);
            const response = await http.get(`/inventory?${params.toString()}`);
            setInventoryItems(response.data?.items || []);
        } catch (error) {
            setMessage({ text: error.message || "Failed to load inventory items", type: "error" });
        }
    }

    function addItemToRequest(item) {
        const exists = selectedItems.find(selected => selected._id === item._id);
        if (!exists) {
            setSelectedItems([...selectedItems, { ...item, requestedQuantity: 1 }]);
        }
    }

    function removeItemFromRequest(itemId) {
        setSelectedItems(selectedItems.filter(item => item._id !== itemId));
    }

    function updateRequestedQuantity(itemId, quantity) {
        setSelectedItems(selectedItems.map(item =>
            item._id === itemId ? { ...item, requestedQuantity: Math.max(1, quantity) } : item
        ));
    }

    function update(key, value) {
        setForm(f => ({ ...f, [key]: value }));
    }

    function validate() {
        if (!form.title.trim()) return "Title is required";
        if (!form.category?.trim()) return "Category is required";
        if ((form.estimatedHours ?? 0) < 0) return "Estimated hours must be >= 0";
        if (!form.priority?.trim()) return "Priority is required";
        if (!form.scheduledDate) return "Scheduled date is required";
        if (!form.assignedTechnician) return "Technician assignment is required";
        return "";
    }

    function getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    function getTwoWeeksFromTodayString() {
        const today = new Date();
        const twoWeeksLater = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
        return twoWeeksLater.toISOString().split('T')[0];
    }

    async function submit(e) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: "", type: "" });

        try {
            // Prepare job data with initial status as "working"
            const jobData = {
                title: form.title,
                description: form.description,
                category: form.category,
                estimatedHours: form.estimatedHours,
                priority: form.priority,
                scheduledDate: form.scheduledDate,
                assignedTechnician: form.assignedTechnician,
                assignedLabourers: [form.assignedTechnician],
                status: "working", // Set initial job status
                requestedItems: selectedItems.map(item => ({
                    itemId: item._id,
                    requestedQuantity: item.requestedQuantity
                })),
                // Add status sync metadata
                statusSync: {
                    autoSyncWithBooking: true,
                    initialBookingStatus: booking?.status || "pending",
                    createdAt: new Date().toISOString()
                }
            };

            console.log('Submitting job data:', jobData);

            // Step 1: Create the job with working status
            const { data } = await http.post(`/jobs/booking/${bookingId}`, jobData);

            if (data?.job?._id) {
                console.log('Job created successfully:', data.job);

                // Step 2: Update booking status to "working"
                await updateBookingStatusToWorking();

                // Step 3: Show success message and navigate
                setMessage({
                    text: "Job created successfully! Both job and booking status set to 'Working'.",
                    type: "success"
                });

                setTimeout(() => {
                    nav(`/jobs/${data.job._id}`);
                }, 1500);
            } else {
                throw new Error("Job created but no ID returned");
            }
        } catch (e) {
            console.error('Job creation error:', e);
            setMessage({ text: e.message || "Failed to create job", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Rest of the component remains the same as previous version...
    // (All the styling and JSX code stays identical)
    const wrap = { maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' };
    const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
    const card = { background: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb", marginBottom: "24px" };
    const sectionTitle = { fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" };
    const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" };
    const label = { display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" };
    const control = { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" };
    const backBtn = { padding: "10px 14px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "inline-block" };

    return (
        <div style={wrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <h1 style={title}>Create New Job</h1>
                <Link to={booking ? `/bookings/${booking._id}` : "/bookings"} style={backBtn}>
                    ← Back to Booking
                </Link>
            </div>

            {message.text && (
                <div style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                    color: message.type === "error" ? "#991b1b" : "#166534",
                    border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                }}>
                    {message.text}
                </div>
            )}

            {isLoading && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading booking details…</span>
                    <div style={{ width: 14, height: 14, border: "2px solid transparent", borderTop: "2px solid #6b7280", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                </div>
            )}

            {!isLoading && booking && (
                <>
                    <div style={card}>
                        <h2 style={sectionTitle}>📋 Booking Information</h2>
                        <div style={grid}>
                            <Field label="Booking ID" value={booking.bookingId || "—"} />
                            <Field label="Customer" value={`${booking.customer?.profile?.firstName || ""} ${booking.customer?.profile?.lastName || ""}`.trim() || "—"} />
                            <Field label="Service Type" value={booking.serviceType || "—"} />
                            <Field label="Current Status" value={booking.status || "—"} />
                            <Field label="Scheduled Date" value={booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "—"} />
                        </div>
                        <div style={{
                            marginTop: "16px",
                            padding: "12px 16px",
                            backgroundColor: "#e0f2fe",
                            border: "1px solid #0284c7",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#0369a1"
                        }}>
                            🔄 <strong>Auto Status Sync:</strong> Creating this job will automatically update both job and booking status to "working". Future status changes will be synchronized between job and booking.
                        </div>
                    </div>

                    {/* Rest of the form JSX remains the same... */}
                    <form onSubmit={submit} style={card}>
                        <h2 style={sectionTitle}>🔧 Job Details</h2>
                        <div style={grid}>
                            <div>
                                <label style={label}>Title <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                    placeholder="e.g., Brake Inspection"
                                    value={form.title}
                                    onChange={(e) => update("title", e.target.value)}
                                    style={control}
                                    required
                                />
                            </div>

                            <div>
                                <label style={label}>Category <span style={{ color: "#ef4444" }}>*</span></label>
                                <select
                                    value={form.category}
                                    onChange={(e) => update("category", e.target.value)}
                                    style={control}
                                    required
                                >
                                    {Enums.JobCategory.map(x => <option key={x} value={x}>{x}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={label}>Estimated Hours <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.5"
                                    value={form.estimatedHours}
                                    onChange={(e) => update("estimatedHours", +e.target.value)}
                                    style={control}
                                    required
                                />
                            </div>

                            <div>
                                <label style={label}>Priority <span style={{ color: "#ef4444" }}>*</span></label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => update("priority", e.target.value)}
                                    style={control}
                                    required
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label style={label}>Scheduled Date <span style={{ color: "#ef4444" }}>*</span></label>
                                <input
                                    type="date"
                                    value={form.scheduledDate}
                                    min={getTodayString()}
                                    max={getTwoWeeksFromTodayString()}
                                    onChange={(e) => update("scheduledDate", e.target.value)}
                                    style={control}
                                    required
                                />
                            </div>

                            <div>
                                <label style={label}>Assign Technician <span style={{ color: "#ef4444" }}>*</span></label>
                                <select
                                    value={form.assignedTechnician}
                                    onChange={(e) => update("assignedTechnician", e.target.value)}
                                    style={{ ...control, borderColor: !form.assignedTechnician ? "#f87171" : "#d1d5db" }}
                                    disabled={isLoadingTechnicians}
                                    required
                                >
                                    <option value="">-- Select a technician --</option>
                                    {technicians.map(tech => (
                                        <option key={tech._id} value={tech._id}>
                                            {tech.profile?.firstName} {tech.profile?.lastName} ({tech.employeeDetails?.employeeId || tech.userId}) - {tech.employeeDetails?.department}
                                        </option>
                                    ))}
                                </select>
                                {isLoadingTechnicians && (
                                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                        Loading technicians...
                                    </div>
                                )}
                                {!form.assignedTechnician && !isLoadingTechnicians && (
                                    <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                                        Please select a technician to proceed
                                    </div>
                                )}
                                {form.assignedTechnician && (
                                    <div style={{ fontSize: "12px", color: "#10b981", marginTop: "4px" }}>
                                        ✓ Technician selected
                                    </div>
                                )}
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={label}>Description</label>
                                <textarea
                                    placeholder="Add detailed job description..."
                                    value={form.description}
                                    onChange={(e) => update("description", e.target.value)}
                                    style={{ ...control, minHeight: 120, resize: "vertical" }}
                                />
                            </div>
                        </div>
                    </form>

                    {/* Inventory section and modal remain the same... */}
                    <div style={card}>
                        <h2 style={sectionTitle}>📦 Request Inventory Items</h2>
                        <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
                            Add inventory items needed for this job. Items will be requested from inventory.
                        </p>

                        {selectedItems.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#1f2937" }}>
                                    Selected Items ({selectedItems.length})
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {selectedItems.map(item => (
                                        <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "4px" }}>{item.name}</div>
                                                <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", gap: "12px" }}>
                                                    <span>Stock: {item.currentStock || item.stock || 0} {item.unit || 'pcs'}</span>
                                                    <span>Price: Rs. {(item.unitPrice || item.price || 0).toFixed(2)}</span>
                                                    <span style={{ fontWeight: 500 }}>Total: Rs. {((item.unitPrice || item.price || 0) * (item.requestedQuantity || 1)).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRequestedQuantity(item._id, Math.max(1, (item.requestedQuantity || 1) - 1))}
                                                        style={{ width: "24px", height: "24px", border: "1px solid #d1d5db", backgroundColor: "#f9fafb", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.requestedQuantity || 1}
                                                        onChange={(e) => updateRequestedQuantity(item._id, parseInt(e.target.value) || 1)}
                                                        style={{ width: "60px", padding: "4px", border: "1px solid #d1d5db", borderRadius: "4px", textAlign: "center", fontSize: "14px" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRequestedQuantity(item._id, (item.requestedQuantity || 1) + 1)}
                                                        style={{ width: "24px", height: "24px", border: "1px solid #d1d5db", backgroundColor: "#f9fafb", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItemFromRequest(item._id)}
                                                    style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px" }}>
                                    <div style={{ fontWeight: 600, color: "#1e40af" }}>
                                        Total: Rs. {selectedItems.reduce((total, item) => total + ((item.unitPrice || item.price || 0) * (item.requestedQuantity || 1)), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowInventoryModal(true)}
                            style={{ padding: "10px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
                        >
                            + Add Items from Inventory
                        </button>
                    </div>

                    <div style={card}>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                type="button"
                                disabled={isSubmitting || !form.assignedTechnician}
                                onClick={submit}
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: (!form.assignedTechnician || isSubmitting) ? "#9ca3af" : "#3b82f6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: (!form.assignedTechnician || isSubmitting) ? "not-allowed" : "pointer"
                                }}
                            >
                                {isSubmitting ? "Creating Job & Syncing Status..." : "Create Job"}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setForm({
                                        title: "",
                                        description: "",
                                        category: Enums.JobCategory[0],
                                        estimatedHours: 1,
                                        priority: "medium",
                                        scheduledDate: "",
                                        assignedTechnician: ""
                                    });
                                    setSelectedItems([]);
                                }}
                                style={{
                                    padding: "12px 24px",
                                    backgroundColor: isSubmitting ? "#9ca3af" : "#6b7280",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: isSubmitting ? "not-allowed" : "pointer"
                                }}
                            >
                                Reset Form
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showInventoryModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "90%", maxWidth: "800px", maxHeight: "80vh", overflow: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Select Inventory Items</h3>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={inventorySearch}
                                onChange={(e) => setInventorySearch(e.target.value)}
                                style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                            />
                            <select
                                value={inventoryFilter.category}
                                onChange={(e) => setInventoryFilter(p => ({ ...p, category: e.target.value }))}
                                style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                            >
                                <option value="">All Categories</option>
                                <option value="parts">Parts</option>
                                <option value="tools">Tools</option>
                                <option value="fluids">Fluids</option>
                                <option value="consumables">Consumables</option>
                            </select>
                            <select
                                value={inventoryFilter.status}
                                onChange={(e) => setInventoryFilter(p => ({ ...p, status: e.target.value }))}
                                style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                            >
                                <option value="">All Status</option>
                                <option value="available">Available</option>
                                <option value="low_stock">Low Stock</option>
                            </select>
                        </div>

                        <div style={{ maxHeight: "400px", overflow: "auto" }}>
                            {inventoryItems
                                .filter(item => inventorySearch === "" || item.name?.toLowerCase().includes(inventorySearch.toLowerCase()))
                                .map(item => {
                                    const isSelected = selectedItems.some(s => s._id === item._id);
                                    return (
                                        <div
                                            key={item._id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "12px",
                                                borderBottom: "1px solid #e5e7eb",
                                                backgroundColor: isSelected ? "#f0fdf4" : "transparent"
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                                                    Stock: {item.currentStock || 0} | Price: Rs. {(item.unitPrice || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => isSelected ? removeItemFromRequest(item._id) : addItemToRequest(item)}
                                                disabled={!isSelected && !item.currentStock}
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: isSelected ? "#ef4444" : item.currentStock ? "#3b82f6" : "#9ca3af",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    cursor: (isSelected || item.currentStock) ? "pointer" : "not-allowed"
                                                }}
                                            >
                                                {isSelected ? "Remove" : item.currentStock ? "Add" : "Out of Stock"}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>

                        <button
                            onClick={() => setShowInventoryModal(false)}
                            style={{
                                marginTop: "16px",
                                padding: "8px 16px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(364deg); } }`}</style>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "#6b7280", fontSize: "14px" }}>{label}:</span>
            <span style={{ fontWeight: 500, fontSize: "14px" }}>{value}</span>
        </div>
    );
}

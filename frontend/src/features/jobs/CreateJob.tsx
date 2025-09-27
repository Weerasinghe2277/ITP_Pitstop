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
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inventory request state
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventorySearch, setInventorySearch] = useState("");
    const [inventoryFilter, setInventoryFilter] = useState({ category: "", status: "" });

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                const r = await http.get(`/bookings/${bookingId}`);
                if (!ignore) setBooking(r.data?.booking || null);
            } catch (e: any) {
                if (!ignore) setMessage({ text: e.message || "Failed to load booking", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, [bookingId]);

    // Load inventory items when modal is opened
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
        } catch (error: any) {
            setMessage({ text: error.message || "Failed to load inventory items", type: "error" });
        }
    }

    function addItemToRequest(item: any) {
        const exists = selectedItems.find((selected: any) => selected._id === item._id);
        if (!exists) {
            setSelectedItems([...selectedItems, { ...item, requestedQuantity: 1 }]);
        }
    }

    function removeItemFromRequest(itemId: string) {
        setSelectedItems(selectedItems.filter((item: any) => item._id !== itemId));
    }

    function updateRequestedQuantity(itemId: string, quantity: number) {
        setSelectedItems(selectedItems.map((item: any) =>
            item._id === itemId ? { ...item, requestedQuantity: Math.max(1, quantity) } : item
        ));
    }

    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value })); // Controlled inputs keep state as single source of truth [web:1]
    }

    function validate() {
        if (!form.title.trim()) return "Title is required";
        if (!form.category?.trim()) return "Category is required";
        if ((form.estimatedHours ?? 0) < 0) return "Estimated hours must be >= 0";
        if (!form.priority?.trim()) return "Priority is required";
        if (!form.scheduledDate) return "Scheduled date is required";
        return "";
    }

    // Helper functions for date constraints
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
            const { data } = await http.post(`/jobs/booking/${bookingId}`, form);
            nav(`/jobs/${data?.job?._id}`); // Programmatic navigation after success is a common useNavigate pattern [web:127][web:133]
        } catch (e) {
            setMessage({ text: e.message || "Failed to create job", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Styles
    const wrap = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const headerRow = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px",
    };
    const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
        marginBottom: "24px",
    };
    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid #e5e7eb",
    };
    const grid = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
    };
    const label = {
        display: "block",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
        marginBottom: "6px",
    };
    const control = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={headerRow}>
                <h1 style={title}>New Job</h1>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link
                        to={booking ? `/bookings/${booking._id}` : "/bookings"}
                        style={{
                            padding: "10px 14px",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "1px solid #2563eb",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Back
                    </Link>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, color: "#6b7280" }}>
                    <span>Loading booking…</span>
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
            )}

            {/* Booking Summary */}
            {!isLoading && booking && (
                <div style={card}>
                    <h2 style={sectionTitle}>Booking</h2>
                    <div style={grid}>
                        <Field label="Booking ID" value={booking.bookingId || "—"} />
                        <Field label="Customer" value={booking.customer?.profile?.firstName || booking.customer?.name || "—"} />
                        <Field label="Service Type" value={booking.serviceType || "—"} />
                        <Field
                            label="Scheduled Date"
                            value={booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "—"}
                        />
                    </div>
                </div>
            )}

            {/* Form */}
            {!isLoading && (
                <form onSubmit={submit} style={card}>
                    <h2 style={sectionTitle}>Job Details</h2>

                    <div style={grid}>
                        <div>
                            <label style={label}>Title</label>
                            <input
                                placeholder="e.g., Brake Inspection"
                                value={form.title}
                                onChange={(e) => update("title", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => update("category", e.target.value)}
                                style={control}
                            >
                                {Enums.JobCategory.map((x) => (
                                    <option key={x} value={x}>{x}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Estimated Hours</label>
                            <input
                                type="number"
                                min={0}
                                step="0.5"
                                value={form.estimatedHours}
                                onChange={(e) => update("estimatedHours", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Priority</label>
                            <select
                                value={form.priority}
                                onChange={(e) => update("priority", e.target.value)}
                                style={control}
                            >
                                <option value="low">low</option>
                                <option value="medium">medium</option>
                                <option value="high">high</option>
                            </select>
                        </div>

                        <div>
                            <label style={label}>Scheduled Date</label>
                            <input
                                type="date"
                                value={form.scheduledDate}
                                min={getTodayString()}
                                max={getTwoWeeksFromTodayString()}
                                onChange={(e) => update("scheduledDate", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Description</label>
                            <textarea
                                placeholder="Add details for the job"
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                style={{ ...control, minHeight: 120, resize: "vertical" }}
                            />
                        </div>
                    </div>
                </form>
            )}

            {/* Inventory Request Section - Show only when booking is loaded */}
            {!isLoading && booking && (
                <div style={card}>
                    <h2 style={sectionTitle}>Request Inventory Items</h2>
                    <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>
                        Add inventory items needed for this job. These will be requested from the inventory.
                    </p>

                    {/* Selected Items */}
                    {selectedItems.length > 0 && (
                        <div style={{ marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>
                                Selected Items ({selectedItems.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {selectedItems.map((item: any) => (
                                    <div key={item._id} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "16px",
                                        backgroundColor: "#f8fafc",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: "#1f2937",
                                                fontSize: "16px",
                                                marginBottom: "6px"
                                            }}>
                                                {item.name}
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                gap: "16px",
                                                fontSize: "14px",
                                                color: "#6b7280"
                                            }}>
                                                <span>Category: <strong>{item.category || 'N/A'}</strong></span>
                                                <span style={{
                                                    color: (item.currentStock || item.stock) > 0 ? "#059669" : "#dc2626"
                                                }}>
                                                    Available Stock: <strong>{item.currentStock || item.stock || 0} {item.unit || 'pcs'}</strong>
                                                </span>
                                                <span style={{ color: "#1f2937" }}>
                                                    Unit Price: <strong>Rs. {(item.unitPrice || item.price || 0).toFixed(2)}</strong>
                                                </span>
                                            </div>
                                            <div style={{
                                                marginTop: "8px",
                                                padding: "8px 12px",
                                                backgroundColor: "#e0f2fe",
                                                borderRadius: "6px",
                                                border: "1px solid #0891b2",
                                                fontSize: "14px",
                                                color: "#0c4a6e"
                                            }}>
                                                <strong>Total Cost:</strong> Rs. {((item.unitPrice || item.price || 0) * (item.requestedQuantity || 1)).toFixed(2)}
                                                ({item.requestedQuantity || 1} {item.unit || 'pcs'} × Rs. {(item.unitPrice || item.price || 0).toFixed(2)})
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "20px" }}>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                                                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>
                                                    Quantity
                                                </label>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <button
                                                        onClick={() => updateRequestedQuantity(item._id, Math.max(1, (item.requestedQuantity || 1) - 1))}
                                                        style={{
                                                            width: "28px",
                                                            height: "28px",
                                                            border: "1px solid #d1d5db",
                                                            backgroundColor: "#f9fafb",
                                                            borderRadius: "6px",
                                                            fontSize: "16px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.currentStock || item.stock || 999}
                                                        value={item.requestedQuantity || 1}
                                                        onChange={(e) => updateRequestedQuantity(item._id, parseInt(e.target.value) || 1)}
                                                        style={{
                                                            width: "70px",
                                                            padding: "6px 8px",
                                                            border: "2px solid #3b82f6",
                                                            borderRadius: "6px",
                                                            fontSize: "14px",
                                                            textAlign: "center",
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => updateRequestedQuantity(item._id, Math.min((item.currentStock || item.stock || 999), (item.requestedQuantity || 1) + 1))}
                                                        style={{
                                                            width: "28px",
                                                            height: "28px",
                                                            border: "1px solid #d1d5db",
                                                            backgroundColor: "#f9fafb",
                                                            borderRadius: "6px",
                                                            fontSize: "16px",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeItemFromRequest(item._id)}
                                                style={{
                                                    padding: "8px 12px",
                                                    backgroundColor: "#ef4444",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    fontWeight: 500
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Section */}
                            <div style={{
                                marginTop: "16px",
                                padding: "16px",
                                backgroundColor: "#f0f9ff",
                                border: "2px solid #0ea5e9",
                                borderRadius: "12px"
                            }}>
                                <div style={{ fontSize: "16px", fontWeight: 600, color: "#0c4a6e" }}>
                                    Items Summary: {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                                </div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: "#0c4a6e", marginTop: "4px" }}>
                                    Total Estimated Cost: Rs. {selectedItems.reduce((total, item) =>
                                        total + ((item.unitPrice || item.price || 0) * (item.requestedQuantity || 1)), 0
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowInventoryModal(true)}
                        style={{
                            padding: "10px 16px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <span>+</span>
                        Add Items from Inventory
                    </button>
                </div>
            )}

            {/* Inventory Selection Modal */}
            {showInventoryModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "24px",
                        width: "90%",
                        maxWidth: "800px",
                        maxHeight: "80vh",
                        overflow: "auto",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Select Inventory Items</h3>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                style={{
                                    padding: "8px",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    fontSize: "18px",
                                    cursor: "pointer",
                                    color: "#6b7280"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Search and Filter */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={inventorySearch}
                                onChange={(e) => setInventorySearch(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "14px"
                                }}
                            />
                            <select
                                value={inventoryFilter.category}
                                onChange={(e) => setInventoryFilter(prev => ({ ...prev, category: e.target.value }))}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "14px"
                                }}
                            >
                                <option value="">All Categories</option>
                                <option value="parts">Parts</option>
                                <option value="tools">Tools</option>
                                <option value="fluids">Fluids</option>
                                <option value="consumables">Consumables</option>
                            </select>
                            <select
                                value={inventoryFilter.status}
                                onChange={(e) => setInventoryFilter(prev => ({ ...prev, status: e.target.value }))}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    fontSize: "14px"
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="available">Available</option>
                                <option value="low_stock">Low Stock</option>
                            </select>
                        </div>

                        {/* Items List */}
                        <div style={{ maxHeight: "400px", overflow: "auto" }}>
                            {inventoryItems
                                .filter((item: any) => {
                                    const searchMatch = inventorySearch === "" ||
                                        item.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                                        item.category?.toLowerCase().includes(inventorySearch.toLowerCase());
                                    return searchMatch;
                                })
                                .map((item: any) => {
                                    const isSelected = selectedItems.some((selected: any) => selected._id === item._id);
                                    const selectedItem = selectedItems.find((selected: any) => selected._id === item._id);
                                    const requestedQuantity = selectedItem ? selectedItem.requestedQuantity : 1;

                                    return (
                                        <div key={item._id} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px",
                                            borderBottom: "1px solid #e5e7eb",
                                            backgroundColor: isSelected ? "#f0fdf4" : "transparent"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "16px" }}>
                                                    {item.name}
                                                </div>
                                                <div style={{
                                                    fontSize: "14px",
                                                    color: "#6b7280",
                                                    marginTop: "4px",
                                                    display: "flex",
                                                    gap: "16px"
                                                }}>
                                                    <span>Category: {item.category || 'N/A'}</span>
                                                    <span style={{
                                                        color: item.currentStock > 0 ? "#059669" : "#dc2626",
                                                        fontWeight: 500
                                                    }}>
                                                        Stock: {item.currentStock || 0} {item.unit || 'pcs'}
                                                    </span>
                                                    <span style={{ fontWeight: 500, color: "#1f2937" }}>
                                                        Price: Rs. {(item.unitPrice || 0).toFixed(2)} per {item.unit || 'pc'}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <div style={{
                                                        marginTop: "8px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px"
                                                    }}>
                                                        <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>
                                                            Requested Quantity:
                                                        </span>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <button
                                                                onClick={() => updateRequestedQuantity(item._id, Math.max(1, requestedQuantity - 1))}
                                                                style={{
                                                                    width: "24px",
                                                                    height: "24px",
                                                                    border: "1px solid #d1d5db",
                                                                    backgroundColor: "#f9fafb",
                                                                    borderRadius: "4px",
                                                                    fontSize: "14px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center"
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={item.currentStock || 999}
                                                                value={requestedQuantity}
                                                                onChange={(e) => updateRequestedQuantity(item._id, Math.max(1, parseInt(e.target.value) || 1))}
                                                                style={{
                                                                    width: "60px",
                                                                    padding: "4px 8px",
                                                                    border: "1px solid #d1d5db",
                                                                    borderRadius: "4px",
                                                                    textAlign: "center",
                                                                    fontSize: "14px"
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => updateRequestedQuantity(item._id, Math.min((item.currentStock || 999), requestedQuantity + 1))}
                                                                style={{
                                                                    width: "24px",
                                                                    height: "24px",
                                                                    border: "1px solid #d1d5db",
                                                                    backgroundColor: "#f9fafb",
                                                                    borderRadius: "4px",
                                                                    fontSize: "14px",
                                                                    cursor: "pointer",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center"
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span style={{
                                                            fontSize: "12px",
                                                            color: "#6b7280",
                                                            marginLeft: "8px"
                                                        }}>
                                                            Total: Rs. {((item.unitPrice || 0) * requestedQuantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => isSelected ? removeItemFromRequest(item._id) : addItemToRequest(item)}
                                                disabled={!isSelected && (item.currentStock === 0 || !item.currentStock)}
                                                style={{
                                                    padding: "8px 16px",
                                                    backgroundColor: isSelected ? "#ef4444" :
                                                        (!item.currentStock || item.currentStock === 0) ? "#9ca3af" : "#3b82f6",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    cursor: (isSelected || (item.currentStock && item.currentStock > 0)) ? "pointer" : "not-allowed",
                                                    minWidth: "80px"
                                                }}
                                            >
                                                {isSelected ? "Remove" : (!item.currentStock || item.currentStock === 0) ? "Out of Stock" : "Add"}
                                            </button>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", gap: "12px" }}>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#6b7280",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    cursor: "pointer"
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit buttons */}
            {!isLoading && booking && (
                <div style={{ ...card, paddingTop: "0" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={submit}
                            style={{
                                padding: "12px 20px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                opacity: isSubmitting ? 0.6 : 1,
                            }}
                        >
                            {isSubmitting ? "Creating..." : "Create Job"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setForm({
                                    title: "",
                                    description: "",
                                    category: Enums.JobCategory[0],
                                    estimatedHours: 1,
                                    priority: "medium",
                                    scheduledDate: "",
                                });
                                setSelectedItems([]);
                            }}
                            style={{
                                padding: "12px 20px",
                                backgroundColor: "#6b7280",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            Reset
                        </button>
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

function Field({ label, value }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280" }}>{label}:</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{value}</span>
        </div>
    );
}

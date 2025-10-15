import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { http } from "../../lib/http";

export default function CreateInvoice() {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [job, setJob] = useState(null);
    const [items, setItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [laborCharges, setLaborCharges] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [invoiceStatus, setInvoiceStatus] = useState("completed"); // Added invoice status state
    const [notes, setNotes] = useState("");
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                // Load inventory items first
                const inventoryResponse = await http.get("/inventory");
                if (!ignore) {
                    setInventoryItems(inventoryResponse.data?.items || inventoryResponse.data || []);
                }

                // Load booking data
                const bookingResponse = await http.get(`/bookings/${bookingId}`);
                if (!ignore) {
                    setBooking(bookingResponse.data?.booking || null);

                    // Load job data for this booking
                    try {
                        const jobResponse = await http.get(`/jobs/booking/${bookingId}`);
                        const jobData = jobResponse.data?.job || jobResponse.data?.jobs?.[0] || null;
                        setJob(jobData);

                        // Initialize items based on job data
                        if (jobData) {
                            const initialItems = [];
                            const allInventory = inventoryResponse.data?.items || inventoryResponse.data || [];

                            // Add labor items from assigned labourers
                            if (jobData.assignedLabourers && jobData.assignedLabourers.length > 0) {
                                jobData.assignedLabourers.forEach((labourer) => {
                                    const hoursWorked = labourer.hoursWorked || 0;
                                    initialItems.push({
                                        description: `Labor - ${labourer.labourer?.name || 'Technician'}`,
                                        quantity: hoursWorked,
                                        unitPrice: 2000,
                                        type: 'labor',
                                        inventoryItemId: null
                                    });
                                });
                            }

                            // Add parts/materials from job requirements with inventory lookup
                            if (jobData.requirements?.materials && jobData.requirements.materials.length > 0) {
                                jobData.requirements.materials.forEach((material) => {
                                    const inventoryItem = allInventory.find(inv =>
                                        inv.name.toLowerCase() === material.name.toLowerCase()
                                    );

                                    initialItems.push({
                                        description: inventoryItem ? `Part - ${inventoryItem.name}` : `Part - ${material.name}`,
                                        quantity: material.quantity || 1,
                                        unitPrice: inventoryItem?.unitPrice || 0,
                                        type: 'part',
                                        inventoryItemId: inventoryItem?._id || null,
                                        stockAvailable: inventoryItem?.currentStock || 0
                                    });
                                });
                            }

                            // Add default labor item if no items created
                            if (initialItems.length === 0) {
                                initialItems.push({
                                    description: "Labor",
                                    quantity: jobData.actualHours || jobData.estimatedHours || 1,
                                    unitPrice: 2000,
                                    type: 'labor',
                                    inventoryItemId: null
                                });
                            }

                            setItems(initialItems);
                        } else {
                            setItems([{ description: "Labor", quantity: 1, unitPrice: 2000, type: 'labor', inventoryItemId: null }]);
                        }
                    } catch (jobError) {
                        console.warn("No job found for this booking:", jobError.message);
                        setItems([{ description: "Labor", quantity: 1, unitPrice: 2000, type: 'labor', inventoryItemId: null }]);
                    }
                }
            } catch (e) {
                if (!ignore) setMessage({ text: e.message || "Failed to load booking", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, [bookingId]);

    function updateItem(index, patch) {
        setItems((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    }

    function selectInventoryItem(index, inventoryItemId) {
        if (!inventoryItemId) {
            updateItem(index, {
                description: "",
                unitPrice: 0,
                inventoryItemId: null,
                stockAvailable: undefined
            });
            return;
        }

        const inventoryItem = inventoryItems.find(item => item._id === inventoryItemId);
        if (inventoryItem) {
            updateItem(index, {
                description: `Part - ${inventoryItem.name}`,
                unitPrice: inventoryItem.unitPrice || 0,
                inventoryItemId: inventoryItem._id,
                stockAvailable: inventoryItem.currentStock,
                type: 'part'
            });
        }
    }

    function addLine() {
        setItems((prev) => [...prev, {
            description: "",
            quantity: 1,
            unitPrice: 0,
            type: 'service',
            inventoryItemId: null
        }]);
    }

    function removeLine(index) {
        if (items.length > 1) {
            setItems((prev) => prev.filter((_, i) => i !== index));
        }
    }

    function toMoney(n) {
        if (typeof n !== "number" || !Number.isFinite(n)) return "LKR 0.00";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    function itemsSubtotal() {
        return items.reduce((s, x) => s + Math.max(0, x.quantity || 0) * Math.max(0, x.unitPrice || 0), 0);
    }

    function subtotal() {
        return itemsSubtotal() + Math.max(0, laborCharges || 0);
    }

    function calculateTax() {
        return subtotal() * (Math.max(0, taxRate || 0) / 100);
    }

    function total() {
        return Math.max(0, subtotal() + calculateTax() - Math.max(0, discount || 0));
    }

    function validate() {
        if (!booking) return "Booking not loaded";
        if (!Array.isArray(items) || items.length === 0) return "Add at least one line item";

        for (const [i, it] of items.entries()) {
            if (!String(it.description || "").trim()) return `Line ${i + 1}: description is required`;
            if ((it.quantity ?? 0) <= 0) return `Line ${i + 1}: quantity must be greater than 0`;
            if ((it.unitPrice ?? 0) < 0) return `Line ${i + 1}: unit price must be >= 0`;

            // Check stock availability for parts
            if (it.type === 'part' && it.inventoryItemId && it.stockAvailable !== undefined) {
                if (it.quantity > it.stockAvailable) {
                    return `Line ${i + 1}: insufficient stock (available: ${it.stockAvailable})`;
                }
            }
        }

        if ((laborCharges ?? 0) < 0) return "Labor charges must be >= 0";
        if ((taxRate ?? 0) < 0 || (taxRate ?? 0) > 100) return "Tax rate must be between 0 and 100";
        if ((discount ?? 0) < 0) return "Discount must be >= 0";
        if (!paymentMethod) return "Payment method is required";
        if (!invoiceStatus) return "Invoice status is required";

        return "";
    }

    async function submit() {
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: "", type: "" });
        try {
            const payload = {
                booking: bookingId,
                customer: booking.customer?._id,
                job: job?._id,
                items: items.map((x) => ({
                    description: x.description,
                    quantity: Math.max(0, x.quantity || 0),
                    unitPrice: Math.max(0, x.unitPrice || 0),
                    total: Math.max(0, x.quantity || 0) * Math.max(0, x.unitPrice || 0),
                    type: x.type || 'service',
                    inventoryItemId: x.inventoryItemId || null
                })),
                laborCharges: Math.max(0, laborCharges || 0),
                subtotal: subtotal(),
                taxRate: Math.max(0, taxRate || 0),
                tax: calculateTax(),
                discount: Math.max(0, discount || 0),
                total: total(),
                paymentMethod,
                status: invoiceStatus, // Added status field
                notes: notes.trim()
            };

            await http.post("/invoices", payload);
            setMessage({ text: "Invoice created successfully!", type: "success" });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                window.location.href = `/bookings/${bookingId}`;
            }, 1500);
        } catch (e) {
            setMessage({ text: e.message || "Failed to create invoice", type: "error" });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Styles
    const wrap = {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
    };

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        marginBottom: "20px"
    };

    const sectionTitle = {
        fontSize: "18px",
        fontWeight: 700,
        color: "#1e293b",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "2px solid #f1f5f9",
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    const label = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151'
    };

    const control = {
        width: "100%",
        padding: "10px 12px",
        border: "2px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
        transition: 'border-color 0.2s ease',
        outline: 'none'
    };

    const button = {
        padding: "10px 18px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: 'all 0.2s ease',
        border: 'none'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    };

    const thStyle = {
        padding: '12px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 600,
        color: '#64748b',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0'
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: '1px solid #f1f5f9',
        verticalAlign: 'top'
    };

    return (
        <div style={wrap}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1e293b', margin: 0 }}>Create Invoice</h1>
                    <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '15px' }}>
                        Generate invoice for booking {booking?.bookingId ? `#${booking.bookingId}` : ''}
                    </p>
                </div>
                <Link
                    to={`/bookings/${bookingId}`}
                    style={{
                        ...button,
                        backgroundColor: 'white',
                        color: '#475569',
                        border: '2px solid #e2e8f0',
                        textDecoration: 'none',
                        display: 'inline-block'
                    }}
                >
                    ← Back to Booking
                </Link>
            </div>

            {/* Messages */}
            {message.text && (
                <div style={{
                    ...card,
                    backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                    color: message.type === "error" ? "#991b1b" : "#166534",
                    border: `2px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <span style={{ fontSize: 20 }}>{message.type === "error" ? "⚠️" : "✓"}</span>
                    <span>{message.text}</span>
                </div>
            )}

            {isLoading ? (
                <div style={{ ...card, textAlign: 'center', padding: 60, color: '#64748b' }}>
                    <div style={{ fontSize: 16 }}>Loading booking and inventory data...</div>
                </div>
            ) : (
                <>
                    {/* Booking & Job Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
                        {booking && (
                            <div style={card}>
                                <h2 style={sectionTitle}>
                                    <span>📋</span> Booking Details
                                </h2>
                                <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Customer:</span>
                                        <span style={{ fontWeight: 600 }}>{booking.customer?.profile?.firstName || booking.customer?.name || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Service Type:</span>
                                        <span style={{ fontWeight: 600 }}>{booking.serviceType || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Scheduled Date:</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '—'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Status:</span>
                                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{booking.status || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {job && (
                            <div style={card}>
                                <h2 style={sectionTitle}>
                                    <span>🔧</span> Job Details
                                </h2>
                                <div style={{ display: 'grid', gap: 14, fontSize: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Job ID:</span>
                                        <span style={{ fontWeight: 600 }}>{job.jobId || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Category:</span>
                                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{job.category || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Assigned Labourers:</span>
                                        <span style={{ fontWeight: 600 }}>{job.assignedLabourers?.length || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b' }}>Total Hours:</span>
                                        <span style={{ fontWeight: 600 }}>{job.actualHours || job.estimatedHours || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Invoice Items */}
                    <div style={card}>
                        <h2 style={sectionTitle}>
                            <span>💰</span> Invoice Items
                        </h2>

                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <button
                                onClick={addLine}
                                style={{ ...button, backgroundColor: '#10b981', color: 'white' }}
                            >
                                + Add Item
                            </button>
                            {job && (
                                <button
                                    onClick={() => {
                                        const jobItems = [];
                                        if (job.assignedLabourers) {
                                            job.assignedLabourers.forEach((labourer) => {
                                                jobItems.push({
                                                    description: `Labor - ${labourer.labourer?.name || 'Technician'}`,
                                                    quantity: labourer.hoursWorked || 1,
                                                    unitPrice: 2000,
                                                    type: 'labor',
                                                    inventoryItemId: null
                                                });
                                            });
                                        }
                                        if (job.requirements?.materials) {
                                            job.requirements.materials.forEach((material) => {
                                                const inventoryItem = inventoryItems.find(inv =>
                                                    inv.name.toLowerCase() === material.name.toLowerCase()
                                                );
                                                jobItems.push({
                                                    description: inventoryItem ? `Part - ${inventoryItem.name}` : `Part - ${material.name}`,
                                                    quantity: material.quantity || 1,
                                                    unitPrice: inventoryItem?.unitPrice || 0,
                                                    type: 'part',
                                                    inventoryItemId: inventoryItem?._id || null,
                                                    stockAvailable: inventoryItem?.currentStock
                                                });
                                            });
                                        }
                                        if (jobItems.length > 0) {
                                            setItems(jobItems);
                                        }
                                    }}
                                    style={{ ...button, backgroundColor: '#3b82f6', color: 'white' }}
                                >
                                    Auto-fill from Job
                                </button>
                            )}
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                <tr>
                                    <th style={{ ...thStyle, minWidth: 250 }}>Description</th>
                                    <th style={{ ...thStyle, minWidth: 130 }}>Type</th>
                                    <th style={{ ...thStyle, minWidth: 90 }}>Qty</th>
                                    <th style={{ ...thStyle, minWidth: 120 }}>Unit Price</th>
                                    <th style={{ ...thStyle, minWidth: 120 }}>Total</th>
                                    <th style={{ ...thStyle, width: 100 }}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                            No items added. Click "Add Item" to get started.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={tdStyle}>
                                            {item.type === 'part' ? (
                                                <select
                                                    value={item.inventoryItemId || ''}
                                                    onChange={(e) => selectInventoryItem(i, e.target.value)}
                                                    style={control}
                                                >
                                                    <option value="">Select from inventory...</option>
                                                    {inventoryItems.filter(inv => inv.status === 'active').map(inv => (
                                                        <option key={inv._id} value={inv._id}>
                                                            {inv.name} - {toMoney(inv.unitPrice)} (Stock: {inv.currentStock})
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(i, { description: e.target.value })}
                                                    style={control}
                                                    placeholder="Enter description"
                                                />
                                            )}
                                            {item.stockAvailable !== undefined && item.quantity > item.stockAvailable && (
                                                <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
                                                    ⚠ Only {item.stockAvailable} in stock
                                                </div>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <select
                                                value={item.type}
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    updateItem(i, {
                                                        type: newType,
                                                        inventoryItemId: newType === 'part' ? item.inventoryItemId : null
                                                    });
                                                }}
                                                style={control}
                                            >
                                                <option value="service">Service</option>
                                                <option value="labor">Labor</option>
                                                <option value="part">Part</option>
                                                <option value="material">Material</option>
                                            </select>
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                min={0.1}
                                                step="0.1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(i, { quantity: +e.target.value })}
                                                style={control}
                                            />
                                        </td>
                                        <td style={tdStyle}>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(i, { unitPrice: +e.target.value })}
                                                style={control}
                                                disabled={!!item.inventoryItemId}
                                            />
                                        </td>
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                                            {toMoney((item.quantity || 0) * (item.unitPrice || 0))}
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => removeLine(i)}
                                                disabled={items.length <= 1}
                                                style={{
                                                    ...button,
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    opacity: items.length <= 1 ? 0.5 : 1,
                                                    cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                                                    padding: '8px 14px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Charges & Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
                        <div style={card}>
                            <h2 style={sectionTitle}>
                                <span>⚙️</span> Additional Charges & Payment
                            </h2>
                            <div style={{ display: 'grid', gap: 18 }}>
                                <div>
                                    <label style={label}>Additional Labor Charges (LKR)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={laborCharges}
                                        onChange={(e) => setLaborCharges(+e.target.value)}
                                        style={control}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.1"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(+e.target.value)}
                                        style={control}
                                        placeholder="e.g., 15"
                                    />
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                        Tax amount: {toMoney(calculateTax())}
                                    </div>
                                </div>
                                <div>
                                    <label style={label}>Discount (LKR)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={discount}
                                        onChange={(e) => setDiscount(+e.target.value)}
                                        style={control}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        style={control}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="transfer">Bank Transfer</option>
                                        <option value="check">Check</option>
                                        <option value="digital">Digital Payment</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={label}>Invoice Status</label>
                                    <select
                                        value={invoiceStatus}
                                        onChange={(e) => setInvoiceStatus(e.target.value)}
                                        style={control}
                                    >
                                        <option value="completed">Completed</option>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={label}>Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        style={{ ...control, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
                                        placeholder="Add any additional notes or special instructions..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={card}>
                            <h2 style={sectionTitle}>
                                <span>📊</span> Invoice Summary
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Items Subtotal:</span>
                                    <span style={{ fontWeight: 600 }}>{toMoney(itemsSubtotal())}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Additional Labor:</span>
                                    <span style={{ fontWeight: 600 }}>{toMoney(laborCharges)}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 10,
                                    borderTop: '1px solid #e2e8f0'
                                }}>
                                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                                    <span style={{ fontWeight: 600 }}>{toMoney(subtotal())}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Tax ({taxRate}%):</span>
                                    <span style={{ fontWeight: 600 }}>{toMoney(calculateTax())}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Discount:</span>
                                    <span style={{ fontWeight: 600, color: '#ef4444' }}>-{toMoney(discount)}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 14,
                                    marginTop: 10,
                                    borderTop: '2px solid #e2e8f0',
                                    fontSize: 18
                                }}>
                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Total Amount:</span>
                                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{toMoney(total())}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 28, display: 'flex', gap: 12, flexDirection: 'column' }}>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    style={{
                                        ...button,
                                        backgroundColor: showPreview ? '#10b981' : '#64748b',
                                        color: 'white',
                                        width: '100%',
                                        padding: 12
                                    }}
                                >
                                    {showPreview ? '✓ Preview Shown' : '👁 Preview Invoice'}
                                </button>
                                <button
                                    onClick={submit}
                                    disabled={isSubmitting || !!validate()}
                                    style={{
                                        ...button,
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        width: '100%',
                                        padding: 14,
                                        fontSize: 16,
                                        opacity: (isSubmitting || validate()) ? 0.5 : 1,
                                        cursor: (isSubmitting || validate()) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSubmitting ? 'Creating Invoice...' : '💾 Create Invoice'}
                                </button>
                                {validate() && (
                                    <div style={{
                                        color: '#ef4444',
                                        fontSize: 13,
                                        textAlign: 'center',
                                        padding: 10,
                                        backgroundColor: '#fef2f2',
                                        borderRadius: 8,
                                        border: '1px solid #fecaca'
                                    }}>
                                        ⚠ {validate()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Preview */}
                    {showPreview && (
                        <div style={{ ...card, backgroundColor: '#f8fafc', padding: 32 }}>
                            <h2 style={sectionTitle}>
                                <span>📄</span> Invoice Preview
                            </h2>
                            <div style={{
                                backgroundColor: 'white',
                                padding: 40,
                                borderRadius: 12,
                                border: '2px dashed #cbd5e1',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {/* Invoice Header */}
                                <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #e2e8f0', paddingBottom: 24 }}>
                                    <h3 style={{ fontSize: 28, margin: 0, fontWeight: 700, color: '#1e293b' }}>INVOICE</h3>
                                    <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: 15 }}>
                                        Booking #{booking?.bookingId || 'N/A'}
                                    </p>
                                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: 14 }}>
                                        {new Date().toLocaleDateString('en-LK', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Customer Info */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 32,
                                    marginBottom: 32,
                                    padding: 20,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 8
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>CUSTOMER</div>
                                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
                                            {booking?.customer?.profile?.firstName || booking?.customer?.name || 'N/A'}
                                        </div>
                                        <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                                            {booking?.customer?.email || ''}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>PAYMENT METHOD</div>
                                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>
                                            {paymentMethod.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <table style={{ width: '100%', marginBottom: 24, fontSize: 14 }}>
                                    <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Description</th>
                                        <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#64748b' }}>Qty</th>
                                        <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Unit Price</th>
                                        <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748b' }}>Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 12 }}>{item.description}</td>
                                            <td style={{ padding: 12, textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: 12, textAlign: 'right' }}>{toMoney(item.unitPrice)}</td>
                                            <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>
                                                {toMoney(item.quantity * item.unitPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                    {laborCharges > 0 && (
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: 12 }}>Additional Labor Charges</td>
                                            <td style={{ padding: 12, textAlign: 'center' }}>—</td>
                                            <td style={{ padding: 12, textAlign: 'right' }}>—</td>
                                            <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>
                                                {toMoney(laborCharges)}
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>

                                {/* Summary */}
                                <div style={{
                                    marginTop: 24,
                                    paddingTop: 20,
                                    borderTop: '2px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: 10
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 280 }}>
                                        <span style={{ color: '#64748b' }}>Subtotal:</span>
                                        <span style={{ fontWeight: 600 }}>{toMoney(subtotal())}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 280 }}>
                                        <span style={{ color: '#64748b' }}>Tax ({taxRate}%):</span>
                                        <span style={{ fontWeight: 600 }}>{toMoney(calculateTax())}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: 280 }}>
                                            <span style={{ color: '#64748b' }}>Discount:</span>
                                            <span style={{ fontWeight: 600, color: '#ef4444' }}>-{toMoney(discount)}</span>
                                        </div>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: 280,
                                        paddingTop: 12,
                                        marginTop: 8,
                                        borderTop: '2px solid #e2e8f0'
                                    }}>
                                        <span style={{ fontSize: 18, fontWeight: 700 }}>Total:</span>
                                        <span style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{toMoney(total())}</span>
                                    </div>
                                </div>

                                {/* Notes */}
                                {notes && (
                                    <div style={{
                                        marginTop: 32,
                                        padding: 16,
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 8,
                                        borderLeft: '4px solid #3b82f6'
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>NOTES</div>
                                        <p style={{ margin: 0, fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{notes}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div style={{
                                    marginTop: 40,
                                    paddingTop: 20,
                                    borderTop: '1px solid #e2e8f0',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    fontSize: 13
                                }}>
                                    Thank you for your business!
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
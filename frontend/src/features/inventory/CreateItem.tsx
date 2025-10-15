// src/features/inventory/CreateItem.jsx
import { useState } from "react";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function CreateItem() {
    const [form, setForm] = useState({
        name: "",
        category: Enums.InventoryCategory[0],
        unitPrice: 0,
        unit: Enums.InventoryUnit[0],
        minimumStock: 0,
        currentStock: 0,
        partNumber: "",
        brand: "",
        description: "",
        notes: "",
        supplier: {
            name: "",
            contactPerson: "",
            phone: "",
            email: ""
        }
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function updateSupplier(key, value) {
        setForm((f) => ({
            ...f,
            supplier: { ...f.supplier, [key]: value }
        }));
    }

    function validate() {
        if (!form.name.trim()) return "Name is required";
        if (!form.category?.trim()) return "Category is required";
        if (form.unitPrice < 0) return "Unit price must be >= 0";
        if (!form.unit?.trim()) return "Unit is required";
        if (form.minimumStock < 0) return "Minimum stock (reorder level) must be >= 0";
        if (form.currentStock < 0) return "Current stock must be >= 0";

        // Validate email if provided
        if (form.supplier.email && form.supplier.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.supplier.email)) {
                return "Invalid supplier email format";
            }
        }

        return "";
    }

    async function submit(e) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsLoading(true);
        setMessage({ text: "", type: "" });
        try {
            // Build payload
            const payload = {
                name: form.name.trim(),
                category: form.category,
                unitPrice: parseFloat(form.unitPrice),
                unit: form.unit,
                minimumStock: parseInt(form.minimumStock),
                currentStock: parseInt(form.currentStock),
                status: "active"
            };

            // Add optional fields only if they have values
            if (form.partNumber?.trim()) {
                payload.partNumber = form.partNumber.trim();
            }
            if (form.brand?.trim()) {
                payload.brand = form.brand.trim();
            }
            if (form.description?.trim()) {
                payload.description = form.description.trim();
            }
            if (form.notes?.trim()) {
                payload.notes = form.notes.trim();
            }

            // Add supplier info if any field is filled
            if (form.supplier.name?.trim() ||
                form.supplier.contactPerson?.trim() ||
                form.supplier.phone?.trim() ||
                form.supplier.email?.trim()) {
                payload.supplier = {};
                if (form.supplier.name?.trim()) payload.supplier.name = form.supplier.name.trim();
                if (form.supplier.contactPerson?.trim()) payload.supplier.contactPerson = form.supplier.contactPerson.trim();
                if (form.supplier.phone?.trim()) payload.supplier.phone = form.supplier.phone.trim();
                if (form.supplier.email?.trim()) payload.supplier.email = form.supplier.email.trim();
            }

            const response = await http.post("/inventory", payload);

            setMessage({
                text: `Item created successfully! Item ID: ${response.data?.item?.itemId || ''}`,
                type: "success"
            });

            // Reset form
            setForm({
                name: "",
                category: Enums.InventoryCategory[0],
                unitPrice: 0,
                unit: Enums.InventoryUnit[0],
                minimumStock: 0,
                currentStock: 0,
                partNumber: "",
                brand: "",
                description: "",
                notes: "",
                supplier: {
                    name: "",
                    contactPerson: "",
                    phone: "",
                    email: ""
                }
            });

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message || "Failed to create item";
            setMessage({ text: errorMsg, type: "error" });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    }

    function resetForm() {
        setForm({
            name: "",
            category: Enums.InventoryCategory[0],
            unitPrice: 0,
            unit: Enums.InventoryUnit[0],
            minimumStock: 0,
            currentStock: 0,
            partNumber: "",
            brand: "",
            description: "",
            notes: "",
            supplier: {
                name: "",
                contactPerson: "",
                phone: "",
                email: ""
            }
        });
        setMessage({ text: "", type: "" });
    }

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e5e7eb",
    };

    const label = {
        display: "block",
        fontSize: "14px",
        fontWeight: 600,
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
        color: "#111827",
        transition: "border-color 0.2s ease",
    };

    const sectionTitle = {
        fontSize: "16px",
        fontWeight: 600,
        color: "#1f2937",
        marginBottom: "16px",
        marginTop: "24px",
        paddingBottom: "8px",
        borderBottom: "2px solid #e5e7eb",
    };

    // Check if stock is low
    const isLowStock = form.currentStock > 0 && form.minimumStock > 0 && form.currentStock <= form.minimumStock;
    const stockPercentage = form.minimumStock > 0 ? (form.currentStock / form.minimumStock) * 100 : 100;

    return (
        <div
            style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "20px",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                        Create New Inventory Item
                    </h1>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0 0" }}>
                        Add a new item to your inventory with complete details
                    </p>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div
                    role="alert"
                    style={{
                        padding: "14px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "14px",
                        fontWeight: 500,
                    }}
                >
                    <span style={{ fontSize: "18px" }}>
                        {message.type === "error" ? "⚠️" : "✅"}
                    </span>
                    <span>{message.text}</span>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 400px",
                    gap: "24px",
                    alignItems: "start",
                }}
            >
                {/* Form Card */}
                <form onSubmit={submit} style={card}>
                    {/* Basic Information */}
                    <h2
                        style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#1f2937",
                            marginBottom: "20px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #e5e7eb",
                        }}
                    >
                        📦 Item Details
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                        }}
                    >
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>
                                Item Name <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                placeholder="e.g., Engine Oil 5W-30, Brake Pad Set"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                style={control}
                                required
                            />
                        </div>

                        <div>
                            <label style={label}>
                                Category <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => update("category", e.target.value)}
                                style={control}
                                required
                            >
                                {Enums.InventoryCategory.map((x) => (
                                    <option key={x} value={x}>
                                        {x.charAt(0).toUpperCase() + x.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Part Number</label>
                            <input
                                placeholder="e.g., PN-12345"
                                value={form.partNumber}
                                onChange={(e) => update("partNumber", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Brand</label>
                            <input
                                placeholder="e.g., Mobil, Castrol"
                                value={form.brand}
                                onChange={(e) => update("brand", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Description</label>
                            <textarea
                                placeholder="Detailed description of the item"
                                value={form.description}
                                onChange={(e) => update("description", e.target.value)}
                                style={{ ...control, minHeight: 80, resize: "vertical" }}
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <h3 style={sectionTitle}>💰 Pricing & Stock</h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <label style={label}>
                                Unit Price (LKR) <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.unitPrice}
                                onChange={(e) => update("unitPrice", e.target.value)}
                                style={control}
                                required
                            />
                        </div>

                        <div>
                            <label style={label}>
                                Unit <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                                value={form.unit}
                                onChange={(e) => update("unit", e.target.value)}
                                style={control}
                                required
                            >
                                {Enums.InventoryUnit.map((x) => (
                                    <option key={x} value={x}>
                                        {x.charAt(0).toUpperCase() + x.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>
                                Current Stock <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                value={form.currentStock}
                                onChange={(e) => update("currentStock", e.target.value)}
                                style={control}
                                required
                            />
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                Available quantity in stock
                            </div>
                        </div>

                        <div>
                            <label style={label}>
                                Minimum Stock (Reorder Level) <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                value={form.minimumStock}
                                onChange={(e) => update("minimumStock", e.target.value)}
                                style={control}
                                required
                            />
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                Alert when stock falls below this level
                            </div>
                        </div>

                        {/* Stock Level Warning */}
                        {isLowStock && (
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div
                                    style={{
                                        padding: "12px",
                                        borderRadius: "8px",
                                        backgroundColor: "#fef3c7",
                                        border: "1px solid #fde68a",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>⚠️</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400e" }}>
                                            Low Stock Warning
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#92400e" }}>
                                            Current stock ({form.currentStock}) is at or below minimum level ({form.minimumStock})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Supplier Information */}
                    <h3 style={sectionTitle}>🏢 Supplier Information (Optional)</h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <label style={label}>Supplier Name</label>
                            <input
                                placeholder="e.g., ABC Auto Parts Ltd."
                                value={form.supplier.name}
                                onChange={(e) => updateSupplier("name", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Contact Person</label>
                            <input
                                placeholder="e.g., John Doe"
                                value={form.supplier.contactPerson}
                                onChange={(e) => updateSupplier("contactPerson", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Phone</label>
                            <input
                                type="tel"
                                placeholder="e.g., +94 11 234 5678"
                                value={form.supplier.phone}
                                onChange={(e) => updateSupplier("phone", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Email</label>
                            <input
                                type="email"
                                placeholder="e.g., supplier@example.com"
                                value={form.supplier.email}
                                onChange={(e) => updateSupplier("email", e.target.value)}
                                style={control}
                            />
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <h3 style={sectionTitle}>📝 Additional Notes</h3>

                    <div>
                        <label style={label}>Notes</label>
                        <textarea
                            placeholder="Any additional information about this item..."
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            style={{ ...control, minHeight: 100, resize: "vertical" }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "32px",
                            paddingTop: "24px",
                            borderTop: "1px solid #e5e7eb",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid transparent",
                                            borderTop: "2px solid white",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite",
                                        }}
                                    />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span>✓</span>
                                    <span>Create Item</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={isLoading}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "white",
                                color: "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <span>↻</span>
                            <span>Reset Form</span>
                        </button>
                    </div>
                </form>

                {/* Summary Card */}
                <div style={{ position: "sticky", top: "20px" }}>
                    <div style={card}>
                        <h2
                            style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1f2937",
                                marginBottom: "20px",
                                paddingBottom: "12px",
                                borderBottom: "1px solid #e5e7eb",
                            }}
                        >
                            📊 Summary
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <SummaryRow label="Item Name" value={form.name || "—"} />
                            <SummaryRow
                                label="Category"
                                value={form.category ? form.category.charAt(0).toUpperCase() + form.category.slice(1) : "—"}
                            />
                            {form.partNumber && <SummaryRow label="Part Number" value={form.partNumber} />}
                            {form.brand && <SummaryRow label="Brand" value={form.brand} />}
                            <SummaryRow
                                label="Unit Price"
                                value={form.unitPrice > 0 ? `LKR ${parseFloat(form.unitPrice).toFixed(2)}` : "—"}
                                highlight
                            />
                            <SummaryRow
                                label="Unit"
                                value={form.unit ? form.unit.charAt(0).toUpperCase() + form.unit.slice(1) : "—"}
                            />

                            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px", marginTop: "6px" }}>
                                <SummaryRow
                                    label="Current Stock"
                                    value={`${form.currentStock || 0} ${form.unit || 'units'}`}
                                    highlight
                                />
                                <SummaryRow
                                    label="Minimum Stock"
                                    value={`${form.minimumStock || 0} ${form.unit || 'units'}`}
                                />

                                {/* Stock Level Indicator */}
                                {form.minimumStock > 0 && (
                                    <div style={{ marginTop: "12px" }}>
                                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
                                            Stock Level
                                        </div>
                                        <div
                                            style={{
                                                height: "8px",
                                                background: "#f3f4f6",
                                                borderRadius: "9999px",
                                                overflow: "hidden",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "100%",
                                                    width: `${Math.min(100, stockPercentage)}%`,
                                                    background: isLowStock ? "#f59e0b" : "#10b981",
                                                    transition: "width 0.3s ease",
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                                            {stockPercentage.toFixed(0)}% of minimum level
                                        </div>
                                    </div>
                                )}
                            </div>

                            {form.supplier.name && (
                                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px", marginTop: "6px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                                        Supplier
                                    </div>
                                    <SummaryRow label="Name" value={form.supplier.name} small />
                                    {form.supplier.contactPerson && (
                                        <SummaryRow label="Contact" value={form.supplier.contactPerson} small />
                                    )}
                                </div>
                            )}

                            {/* Total Value */}
                            {form.unitPrice > 0 && form.currentStock > 0 && (
                                <div style={{
                                    marginTop: "14px",
                                    padding: "12px",
                                    background: "#f0fdf4",
                                    borderRadius: "8px",
                                    border: "1px solid #bbf7d0",
                                }}>
                                    <div style={{ fontSize: "12px", color: "#166534", fontWeight: 600, marginBottom: "4px" }}>
                                        Total Inventory Value
                                    </div>
                                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#166534" }}>
                                        LKR {(parseFloat(form.unitPrice) * parseInt(form.currentStock)).toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Card */}
                    <div style={{ ...card, marginTop: "16px", background: "#eff6ff", borderColor: "#bfdbfe" }}>
                        <div style={{ fontSize: "13px", color: "#1e40af", lineHeight: "1.6" }}>
                            <div style={{ fontWeight: 600, marginBottom: "8px" }}>💡 Tips:</div>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                <li>Set reorder level based on usage patterns</li>
                                <li>Keep supplier info updated for easy ordering</li>
                                <li>Use clear, searchable names</li>
                                <li>Include brand and part numbers for accuracy</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    button:not(:disabled):hover {
                        opacity: 0.9;
                        transform: translateY(-1px);
                    }
                    
                    button:not(:disabled):active {
                        transform: translateY(0);
                    }
                    
                    input:focus, select:focus, textarea:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }
                `}
            </style>
        </div>
    );
}

function SummaryRow({ label, value, highlight, small }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
                color: "#6b7280",
                fontSize: small ? "12px" : "13px",
                fontWeight: small ? 400 : 500
            }}>
                {label}:
            </span>
            <span style={{
                fontWeight: highlight ? 700 : 600,
                color: highlight ? "#1f2937" : "#374151",
                fontSize: small ? "12px" : "14px",
                textAlign: "right"
            }}>
                {value}
            </span>
        </div>
    );
}
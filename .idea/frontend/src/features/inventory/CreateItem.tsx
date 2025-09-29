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
        reorderLevel: 0,
        currentStock: 0,
        notes: "",
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function validate() {
        if (!form.name.trim()) return "Name is required";
        if (!form.category?.trim()) return "Category is required";
        if (form.unitPrice < 0) return "Unit price must be >= 0";
        if (!form.unit?.trim()) return "Unit is required";
        if (form.reorderLevel < 0) return "Reorder level must be >= 0";
        if (form.currentStock < 0) return "Stock must be >= 0";
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
            await http.post("/inventory", {
                name: form.name,
                category: form.category,
                unitPrice: form.unitPrice,
                unit: form.unit,
                reorderLevel: form.reorderLevel,
                currentStock: form.currentStock,
                notes: form.notes,
            });
            setMessage({ text: "Item created", type: "success" });
            setForm({
                name: "",
                category: Enums.InventoryCategory[0],
                unitPrice: 0,
                unit: Enums.InventoryUnit[0],
                reorderLevel: 0,
                currentStock: 0,
                notes: "",
            });
        } catch (e) {
            setMessage({ text: e.message || "Failed to create item", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
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
        color: "#000000",
    };

    return (
        <div
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "20px",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
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
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
                    New Item
                </h1>
            </div>

            {message.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    }}
                >
                    {message.text}
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                }}
            >
                {/* Form Card */}
                <form onSubmit={submit} style={card}>
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
                        Item Details
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <label style={label}>Name</label>
                            <input
                                placeholder="e.g., Engine Oil 5W-30"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
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
                                {Enums.InventoryCategory.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Unit Price</label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.unitPrice}
                                onChange={(e) => update("unitPrice", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Unit</label>
                            <select
                                value={form.unit}
                                onChange={(e) => update("unit", e.target.value)}
                                style={control}
                            >
                                {Enums.InventoryUnit.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Reorder Level</label>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                value={form.reorderLevel}
                                onChange={(e) => update("reorderLevel", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Current Stock</label>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                value={form.currentStock}
                                onChange={(e) => update("currentStock", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Notes</label>
                            <textarea
                                placeholder="Optional notes"
                                value={form.notes}
                                onChange={(e) => update("notes", e.target.value)}
                                style={{ ...control, minHeight: 100, resize: "vertical" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: "12px 20px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.6 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span>Creating...</span>
                                    <div
                                        style={{
                                            width: "14px",
                                            height: "14px",
                                            border: "2px solid transparent",
                                            borderTop: "2px solid white",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite",
                                        }}
                                    />
                                </>
                            ) : (
                                "Create Item"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setForm({
                                    name: "",
                                    category: Enums.InventoryCategory[0],
                                    unitPrice: 0,
                                    unit: Enums.InventoryUnit[0],
                                    reorderLevel: 0,
                                    currentStock: 0,
                                    notes: "",
                                })
                            }
                            style={{
                                padding: "12px 20px",
                                backgroundColor: "#6b7280",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {/* Summary Card */}
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
                        Summary
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Row label="Name" value={form.name || "—"} />
                        <Row label="Category" value={form.category || "—"} />
                        <Row
                            label="Unit Price"
                            value={
                                Number.isFinite(form.unitPrice) ? `LKR ${form.unitPrice.toFixed(2)}` : "—"
                            }
                        />
                        <Row label="Unit" value={form.unit || "—"} />
                        <Row
                            label="Reorder Level"
                            value={Number.isFinite(form.reorderLevel) ? String(form.reorderLevel) : "—"}
                        />
                        <Row
                            label="Current Stock"
                            value={Number.isFinite(form.currentStock) ? String(form.currentStock) : "—"}
                        />
                    </div>
                </div>
            </div>

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

function Row({ label, value }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280" }}>{label}:</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{value}</span>
        </div>
    );
}
// src/features/vehicles/CreateVehicle.jsx
import { useState } from "react";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function CreateVehicle() {
    const [form, setForm] = useState({
        registrationNumber: "",
        owner: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        fuelType: Enums.FuelType[0],
        transmission: Enums.Transmission[0],
        mileage: 0,
        color: "",
        engineNumber: "",
        chassisNumber: "",
        notes: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    function update(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function validate() {
        if (!form.registrationNumber.trim()) return "Registration number is required";
        if (!form.owner.trim()) return "Owner is required";
        if (!form.make.trim()) return "Make is required";
        if (!form.model.trim()) return "Model is required";
        if (form.year < 1900 || form.year > new Date().getFullYear() + 1)
            return "Please enter a valid year";
        if (!form.fuelType?.trim()) return "Fuel type is required";
        if (!form.transmission?.trim()) return "Transmission is required";
        if (form.mileage < 0) return "Mileage must be >= 0";
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
            await http.post("/vehicles", {
                registrationNumber: form.registrationNumber.toUpperCase(),
                owner: form.owner,
                make: form.make,
                model: form.model,
                year: form.year,
                fuelType: form.fuelType,
                transmission: form.transmission,
                mileage: form.mileage,
                color: form.color,
                engineNumber: form.engineNumber,
                chassisNumber: form.chassisNumber,
                notes: form.notes
            });
            setMessage({ text: "Vehicle created successfully", type: "success" });
            // Reset form after successful creation
            setForm({
                registrationNumber: "",
                owner: "",
                make: "",
                model: "",
                year: new Date().getFullYear(),
                fuelType: Enums.FuelType[0],
                transmission: Enums.Transmission[0],
                mileage: 0,
                color: "",
                engineNumber: "",
                chassisNumber: "",
                notes: ""
            });
        } catch (e) {
            setMessage({ text: e.message || "Failed to create vehicle", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e5e7eb"
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
        backgroundColor: "#ffffff",
        color: "#000000"
    };

    return (
        <div
            style={{
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "20px",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                backgroundColor: "#f9fafb",
                minHeight: "100vh"
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
                <h1 style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1f2937",
                    margin: 0
                }}>
                    New Vehicle
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
                    <button
                        onClick={() => setMessage({ text: "", type: "" })}
                        style={{
                            float: 'right',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: message.type === "error" ? "#991b1b" : "#166534"
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
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
                        Vehicle Information
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "16px",
                        }}
                    >
                        <div>
                            <label style={label}>Registration Number *</label>
                            <input
                                placeholder="e.g., ABC-1234"
                                value={form.registrationNumber}
                                onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Owner ID *</label>
                            <input
                                placeholder="Owner user ID"
                                value={form.owner}
                                onChange={(e) => update("owner", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Make *</label>
                            <input
                                placeholder="e.g., Toyota"
                                value={form.make}
                                onChange={(e) => update("make", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Model *</label>
                            <input
                                placeholder="e.g., Camry"
                                value={form.model}
                                onChange={(e) => update("model", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Year *</label>
                            <input
                                type="number"
                                min={1900}
                                max={new Date().getFullYear() + 1}
                                value={form.year}
                                onChange={(e) => update("year", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Fuel Type *</label>
                            <select
                                value={form.fuelType}
                                onChange={(e) => update("fuelType", e.target.value)}
                                style={control}
                            >
                                {Enums.FuelType.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Transmission *</label>
                            <select
                                value={form.transmission}
                                onChange={(e) => update("transmission", e.target.value)}
                                style={control}
                            >
                                {Enums.Transmission.map((x) => (
                                    <option key={x} value={x}>
                                        {x}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={label}>Mileage (km)</label>
                            <input
                                type="number"
                                min={0}
                                step="1"
                                placeholder="e.g., 50000"
                                value={form.mileage}
                                onChange={(e) => update("mileage", +e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Color</label>
                            <input
                                placeholder="e.g., Red, Blue"
                                value={form.color}
                                onChange={(e) => update("color", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Engine Number</label>
                            <input
                                placeholder="Engine number"
                                value={form.engineNumber}
                                onChange={(e) => update("engineNumber", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div>
                            <label style={label}>Chassis Number</label>
                            <input
                                placeholder="Chassis number"
                                value={form.chassisNumber}
                                onChange={(e) => update("chassisNumber", e.target.value)}
                                style={control}
                            />
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={label}>Notes</label>
                            <textarea
                                placeholder="Additional notes about the vehicle"
                                value={form.notes}
                                onChange={(e) => update("notes", e.target.value)}
                                style={{
                                    ...control,
                                    minHeight: 100,
                                    resize: "vertical"
                                }}
                            />
                        </div>
                    </div>

                    <div style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "20px",
                        flexWrap: "wrap"
                    }}>
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
                                "Create Vehicle"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setForm({
                                    registrationNumber: "",
                                    owner: "",
                                    make: "",
                                    model: "",
                                    year: new Date().getFullYear(),
                                    fuelType: Enums.FuelType[0],
                                    transmission: Enums.Transmission[0],
                                    mileage: 0,
                                    color: "",
                                    engineNumber: "",
                                    chassisNumber: "",
                                    notes: ""
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
                            Reset Form
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
                        Vehicle Summary
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Row label="Registration" value={form.registrationNumber || "—"} />
                        <Row label="Owner ID" value={form.owner || "—"} />
                        <Row label="Vehicle" value={form.make && form.model ? `${form.make} ${form.model}` : "—"} />
                        <Row label="Year" value={form.year ? String(form.year) : "—"} />
                        <Row label="Fuel Type" value={form.fuelType || "—"} />
                        <Row label="Transmission" value={form.transmission || "—"} />
                        <Row
                            label="Mileage"
                            value={form.mileage ? `${form.mileage.toLocaleString()} km` : "—"}
                        />
                        <Row label="Color" value={form.color || "—"} />
                        <Row label="Engine #" value={form.engineNumber || "—"} />
                        <Row label="Chassis #" value={form.chassisNumber || "—"} />
                    </div>

                    {/* Quick Stats */}
                    <div style={{
                        marginTop: "20px",
                        padding: "16px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb"
                    }}>
                        <h3 style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#374151",
                            marginBottom: "8px"
                        }}>
                            Form Status
                        </h3>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            Required fields completed: {
                            [form.registrationNumber, form.owner, form.make, form.model, form.fuelType, form.transmission]
                                .filter(Boolean).length
                        } / 6
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
        `}
            </style>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280", fontSize: "14px" }}>{label}:</span>
            <span style={{ flex: 1, fontWeight: 500, fontSize: "14px" }}>{value}</span>
        </div>
    );
}

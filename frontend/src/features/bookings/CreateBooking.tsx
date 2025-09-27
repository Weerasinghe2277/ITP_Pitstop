// src/features/bookings/CreateBooking.jsx
import { useMemo, useState, useEffect } from "react";
import { http } from "../../lib/http";
import { useNavigate } from "react-router-dom";
import { Enums } from "../../lib/validators";

type BookingForm = {
    // Customer details
    firstName: string;
    lastName: string;
    nic: string;
    phone: string;
    address: string;
    email: string;
    // Vehicle details
    registrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    fuelType: string;
    transmission: string;
    // Booking details
    customer: string; // backend expects userId
    customerNic?: string; // UI entry
    vehicle: string; // will store vehicle ID after creation/lookup
    serviceType: string;
    scheduledDate: string;
    timeSlot: string;
    description: string;
    priority: "low" | "medium" | "high";
};

type CustomerRegForm = {
    name: string;
    email: string;
    phone: string;
    address: string;
    nic?: string;
};

export default function CreateBooking() {
    const nav = useNavigate();
    const [form, setForm] = useState<BookingForm>({
        // Customer details
        firstName: "",
        lastName: "",
        nic: "",
        phone: "",
        address: "",
        email: "",
        // Vehicle details
        registrationNumber: "",
        vehicleMake: "",
        vehicleModel: "",
        fuelType: "petrol",
        transmission: "manual",
        // Booking details
        customer: "",
        customerNic: "",
        vehicle: "",
        serviceType: Enums.ServiceType[0],
        scheduledDate: "",
        timeSlot: "",
        description: "",
        priority: "medium",
    });
    const [step, setStep] = useState(1); // 1..5
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customerForm, setCustomerForm] = useState<CustomerRegForm>({
        name: "",
        email: "",
        phone: "",
        address: "",
        nic: "",
    });
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [searchNicOrEmail, setSearchNicOrEmail] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute to check for past time slots
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());

            // Clear selected time slot if it has become past
            if (form.timeSlot && form.scheduledDate && isTimeSlotPast(form.timeSlot, form.scheduledDate)) {
                setForm(prev => ({ ...prev, timeSlot: "" }));
                setMessage({
                    text: "Selected time slot has passed and has been cleared. Please select a new time slot.",
                    type: "error"
                });
            }
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [form.timeSlot, form.scheduledDate]); // Dependencies for clearing past slots

    // Search for existing customer
    async function searchExistingCustomer() {
        if (!searchNicOrEmail.trim()) {
            setMessage({ text: "Please enter NIC or email to search", type: "error" });
            return;
        }

        setIsSearchingCustomer(true);
        setMessage({ text: "", type: "" });

        try {
            const response = await http.get(`/users/search?q=${encodeURIComponent(searchNicOrEmail.trim())}`);
            const customer = response.data?.user;

            if (customer) {
                // Pre-fill form with customer data
                setForm(f => ({
                    ...f,
                    firstName: customer.profile?.firstName || "",
                    lastName: customer.profile?.lastName || "",
                    nic: customer.profile?.nic || "",
                    phone: customer.profile?.phoneNumber || "",
                    address: customer.profile?.address?.street || "",
                    email: customer.email || ""
                }));
                setMessage({ text: "Customer found and form pre-filled!", type: "success" });
                setSearchNicOrEmail("");
            } else {
                setMessage({ text: "No customer found with that NIC or email", type: "error" });
            }
        } catch (e: any) {
            setMessage({ text: "Customer not found", type: "error" });
        } finally {
            setIsSearchingCustomer(false);
        }
    }

    function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function updateCustomer<K extends keyof CustomerRegForm>(key: K, value: CustomerRegForm[K]) {
        setCustomerForm((f) => ({ ...f, [key]: value }));
    }

    function validate() {
        if (!form.firstName?.trim()) return "First name is required";
        if (!form.lastName?.trim()) return "Last name is required";
        if (!form.nic?.trim()) return "NIC is required";
        if (!form.phone?.trim()) return "Phone number is required";
        if (!form.address?.trim()) return "Address is required";
        if (!form.email?.trim()) return "Email is required";
        if (!form.registrationNumber?.trim()) return "Vehicle registration number is required";
        if (!form.vehicleMake?.trim()) return "Vehicle make is required";
        if (!form.vehicleModel?.trim()) return "Vehicle model is required";
        if (!form.fuelType?.trim()) return "Fuel type is required";
        if (!form.transmission?.trim()) return "Transmission type is required";
        if (!form.serviceType?.trim()) return "Service type is required";
        if (!form.scheduledDate?.trim()) return "Scheduled date is required";
        if (!form.timeSlot?.trim()) return "Time slot is required";
        return "";
    }

    // Helper functions for date constraints (today .. +30 days)
    function toDateOnly(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function fmt(d: Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }
    const today = toDateOnly(new Date());
    const maxDate = toDateOnly(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30));
    function getTodayString() { return fmt(today); }
    function getMaxFromTodayString() { return fmt(maxDate); }

    // Suggested slot list (2h windows) - matching backend enum values
    const suggestedSlots = useMemo(
        () => [
            "09:00-11:00",
            "11:00-13:00",
            "13:00-15:00",
            "15:00-17:00",
        ],
        []
    );

    // Check if a time slot is in the past
    function isTimeSlotPast(timeSlot: string, selectedDate: string): boolean {
        if (!selectedDate) return false;

        const today = new Date();
        const selectedDateObj = new Date(selectedDate);

        // If selected date is not today, then no slots are past
        if (selectedDateObj.toDateString() !== today.toDateString()) {
            return false;
        }

        // Extract end time from slot (e.g., "09:00-11:00" -> "11:00")
        const endTime = timeSlot.split('-')[1];
        const [hours, minutes] = endTime.split(':').map(Number);

        // Create a Date object for the slot end time today
        const slotEndTime = new Date();
        slotEndTime.setHours(hours, minutes, 0, 0);

        // Check if current time is past the slot end time
        return currentTime >= slotEndTime;
    }

    function validateCustomer() {
        if (!customerForm.name?.trim()) return "Customer name is required";
        if (!customerForm.email?.trim()) return "Email is required";
        if (!customerForm.phone?.trim()) return "Phone is required";
        if (!customerForm.nic?.trim()) return "NIC is required";
        return "";
    }

    async function registerCustomer() {
        const v = validateCustomer();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsRegisteringCustomer(true);
        setMessage({ text: "", type: "" });
        try {
            const { data } = await http.post("/users", {
                ...customerForm,
                role: "customer",
                profile: {
                    firstName: customerForm.name.split(' ')[0] || customerForm.name,
                    lastName: customerForm.name.split(' ').slice(1).join(' ') || '',
                    phone: customerForm.phone,
                    address: customerForm.address,
                    nic: customerForm.nic,
                }
            });
            setMessage({ text: "Customer registered successfully!", type: "success" });
            update("customer", data?.user?._id || data?.user?.id || "");
            setShowCustomerForm(false);
            setCustomerForm({ name: "", email: "", phone: "", address: "", nic: "" });
        } catch (e: any) {
            setMessage({ text: e?.message || "Failed to register customer", type: "error" });
        } finally {
            setIsRegisteringCustomer(false);
        }
    }

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsLoading(true);
        setMessage({ text: "", type: "" });
        try {
            // First create/find the customer using the public endpoint
            const customerData = {
                email: form.email,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                nic: form.nic,
                address: form.address
            };

            const customerResponse = await http.post("/users/register-customer", customerData);
            const customerId = customerResponse.data?.user?._id;

            // Show appropriate message based on whether customer was new or existing
            if (customerResponse.data?.isExisting) {
                setMessage({ text: "Found existing customer, creating booking...", type: "success" });
            } else {
                setMessage({ text: "Customer registered successfully, creating booking...", type: "success" });
            }

            // Then create or find vehicle
            let vehicleId;
            try {
                // First try to find existing vehicle by registration number
                const vehResp = await http.get(`/vehicles`, { params: { search: form.registrationNumber, limit: 1 } });
                const foundVehicle = (vehResp.data?.vehicles || [])[0];

                if (foundVehicle?._id || foundVehicle?.id) {
                    // Use existing vehicle
                    vehicleId = foundVehicle._id || foundVehicle.id;
                } else {
                    // Create new vehicle
                    const vehicleData = {
                        registrationNumber: form.registrationNumber,
                        make: form.vehicleMake,
                        model: form.vehicleModel,
                        year: new Date().getFullYear(), // Default to current year
                        owner: customerId, // Link to the customer
                        fuelType: form.fuelType,
                        transmission: form.transmission,
                        status: "active"
                    };

                    const vehicleResponse = await http.post("/vehicles", vehicleData);
                    vehicleId = vehicleResponse.data?.vehicle?._id || vehicleResponse.data?.vehicle?.id;

                    if (!vehicleId) {
                        throw new Error("Failed to create vehicle");
                    }
                }
            } catch (vehicleError) {
                console.error("Vehicle creation/lookup error:", vehicleError);
                throw new Error("Failed to create or find vehicle. Please check the vehicle details.");
            }

            // Finally create the booking
            const bookingPayload = {
                customer: customerId,
                vehicle: vehicleId,
                serviceType: form.serviceType,
                scheduledDate: form.scheduledDate,
                timeSlot: form.timeSlot,
                description: form.description,
                priority: form.priority
            };
            const { data } = await http.post("/bookings/public", bookingPayload);
            nav(`/bookings/${data?.booking?._id}`);
        } catch (e: any) {
            setMessage({ text: e?.response?.data?.message || e?.message || "Failed to create booking", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    const inputStyle = {
        width: "100%",
        padding: "10px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        backgroundColor: "white",
    };

    const labelStyle = {
        display: "block",
        fontSize: "14px",
        fontWeight: 500,
        color: "#374151",
        marginBottom: "6px",
    };

    const sectionCard = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    };

    const pill = (active: boolean): React.CSSProperties => ({
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${active ? "#3b82f6" : "#e5e7eb"}`,
        color: active ? "#1e3a8a" : "#374151",
        background: active ? "#eff6ff" : "#ffffff",
        fontSize: 12,
        fontWeight: 700,
    });

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
                <h1
                    style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "#1f2937",
                        margin: 0,
                    }}
                >
                    New Booking
                </h1>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {["Customer", "Vehicle", "Service", "Schedule", "Review"].map((label, idx) => {
                        const s = idx + 1;
                        const active = step === s;
                        const complete = step > s;
                        return (
                            <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: 999,
                                    background: complete ? "#10b981" : active ? "#3b82f6" : "#e5e7eb",
                                    color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 800
                                }}>{s}</span>
                                <span style={{ fontSize: 12, color: active ? "#1f2937" : "#6b7280" }}>{label}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                        backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                        color: message.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"
                            }`,
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Multi-step form */}
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <form onSubmit={submit} style={sectionCard}>
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
                        {step === 1 && "Customer Details"}
                        {step === 2 && "Vehicle"}
                        {step === 3 && "Service"}
                        {step === 4 && "Schedule"}
                        {step === 5 && "Review"}
                    </h2>

                    {/* Step content */}
                    {step === 1 && (
                        <>
                            {/* Customer Search Section */}
                            <div style={{
                                backgroundColor: "#f8fafc",
                                padding: "16px",
                                borderRadius: "8px",
                                marginBottom: "24px",
                                border: "1px solid #e2e8f0"
                            }}>
                                <h3 style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#475569",
                                    marginBottom: "12px"
                                }}>
                                    Search Existing Customer (Optional)
                                </h3>
                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: "13px" }}>Enter NIC or Email</label>
                                        <input
                                            placeholder="Enter NIC number or email address"
                                            value={searchNicOrEmail}
                                            onChange={(e) => setSearchNicOrEmail(e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={searchExistingCustomer}
                                        disabled={isSearchingCustomer || !searchNicOrEmail.trim()}
                                        style={{
                                            padding: "11px 16px",
                                            backgroundColor: isSearchingCustomer || !searchNicOrEmail.trim() ? "#9ca3af" : "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            cursor: isSearchingCustomer || !searchNicOrEmail.trim() ? "not-allowed" : "pointer",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {isSearchingCustomer ? "Searching..." : "Search"}
                                    </button>
                                </div>
                                <p style={{
                                    fontSize: "12px",
                                    color: "#64748b",
                                    marginTop: "8px",
                                    marginBottom: "0"
                                }}>
                                    If found, customer details will be automatically filled in the form below.
                                </p>
                            </div>

                            {/* Customer Details Form */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>First Name *</label>
                                    <input
                                        placeholder="Enter first name"
                                        value={form.firstName}
                                        onChange={(e) => update("firstName", e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name *</label>
                                    <input
                                        placeholder="Enter last name"
                                        value={form.lastName}
                                        onChange={(e) => update("lastName", e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>NIC Number *</label>
                                    <input
                                        placeholder="Enter NIC number (e.g., 123456789V)"
                                        value={form.nic}
                                        onChange={(e) => update("nic", e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number *</label>
                                    <input
                                        placeholder="Enter phone number (e.g., 0771234567)"
                                        value={form.phone}
                                        onChange={(e) => update("phone", e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={labelStyle}>Address *</label>
                                    <textarea
                                        placeholder="Enter full address"
                                        value={form.address}
                                        onChange={(e) => update("address", e.target.value)}
                                        style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Vehicle Registration Number *</label>
                                <input
                                    placeholder="Enter registration number (e.g., ABC-1234)"
                                    value={form.registrationNumber}
                                    onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Vehicle Make *</label>
                                <input
                                    placeholder="Enter vehicle make (e.g., Toyota, Honda, BMW)"
                                    value={form.vehicleMake}
                                    onChange={(e) => update("vehicleMake", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Vehicle Model *</label>
                                <input
                                    placeholder="Enter vehicle model (e.g., Camry, Civic, X3)"
                                    value={form.vehicleModel}
                                    onChange={(e) => update("vehicleModel", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Fuel Type *</label>
                                <select
                                    value={form.fuelType}
                                    onChange={(e) => update("fuelType", e.target.value)}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="hybrid">Hybrid</option>
                                    <option value="electric">Electric</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Transmission *</label>
                                <select
                                    value={form.transmission}
                                    onChange={(e) => update("transmission", e.target.value)}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="manual">Manual</option>
                                    <option value="automatic">Automatic</option>
                                    <option value="cvt">CVT</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    placeholder="Add details about the issue or requested service"
                                    value={form.description}
                                    onChange={(e) => update("description", e.target.value)}
                                    style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            <div style={{ gridColumn: "1 / -1", marginBottom: 8 }}><label style={labelStyle}>Service Type</label></div>
                            {Enums.ServiceType.map((x) => (
                                <button key={x} type="button" onClick={() => update("serviceType", x)} style={{ ...pill(form.serviceType === x), textTransform: "capitalize", cursor: "pointer" }}>
                                    {x}
                                </button>
                            ))}

                            <div style={{ gridColumn: "1 / -1", marginTop: 16 }}>
                                <label style={labelStyle}>Priority</label>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {["low", "medium", "high"].map((p) => (
                                        <button key={p} type="button" onClick={() => update("priority", p as any)} style={{ ...pill(form.priority === p), textTransform: "capitalize", cursor: "pointer" }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Scheduled Date</label>
                                <input type="date" value={form.scheduledDate} min={getTodayString()} max={getMaxFromTodayString()} onChange={(e) => update("scheduledDate", e.target.value)} style={inputStyle} />
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>You can book up to 30 days from today.</div>
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={labelStyle}>Time Slot</label>
                                    <div style={{
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}>
                                        🕐 Current time: {currentTime.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                                    {suggestedSlots.map((slot) => {
                                        const isPast = isTimeSlotPast(slot, form.scheduledDate);
                                        const isSelected = form.timeSlot === slot;
                                        return (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => !isPast && update("timeSlot", slot)}
                                                disabled={isPast}
                                                style={{
                                                    ...pill(isSelected),
                                                    cursor: isPast ? "not-allowed" : "pointer",
                                                    opacity: isPast ? 0.5 : 1,
                                                    position: "relative",
                                                    backgroundColor: isPast ? "#f3f4f6" : (isSelected ? "#eff6ff" : "#ffffff"),
                                                    borderColor: isPast ? "#d1d5db" : (isSelected ? "#3b82f6" : "#e5e7eb"),
                                                    color: isPast ? "#9ca3af" : (isSelected ? "#1e3a8a" : "#374151")
                                                }}
                                                title={isPast ? "This time slot has passed" : ""}
                                            >
                                                {slot}
                                                {isPast && (
                                                    <span style={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        left: "50%",
                                                        transform: "translate(-50%, -50%)",
                                                        fontSize: "12px",
                                                        color: "#ef4444",
                                                        fontWeight: "bold"
                                                    }}>
                                                        ✕
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                                    {form.scheduledDate === getTodayString() ? (
                                        <span>⚠️ Past time slots are disabled and update in real-time</span>
                                    ) : (
                                        <span>📅 All time slots are available for future dates</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div style={{ display: "grid", gap: 8 }}>
                            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>Customer Details</h3>
                            <Row label="First Name" value={form.firstName || "—"} />
                            <Row label="Last Name" value={form.lastName || "—"} />
                            <Row label="NIC" value={form.nic || "—"} />
                            <Row label="Phone" value={form.phone || "—"} />
                            <Row label="Email" value={form.email || "—"} />
                            <Row label="Address" value={form.address || "—"} />

                            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginTop: "20px", marginBottom: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>Vehicle Details</h3>
                            <Row label="Registration Number" value={form.registrationNumber || "—"} />
                            <Row label="Make" value={form.vehicleMake || "—"} />
                            <Row label="Model" value={form.vehicleModel || "—"} />

                            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginTop: "20px", marginBottom: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>Booking Details</h3>
                            <Row label="Service Type" value={form.serviceType || "—"} />
                            <Row label="Priority" value={form.priority || "—"} />
                            <Row label="Date" value={form.scheduledDate || "—"} />
                            <Row label="Time Slot" value={form.timeSlot || "—"} />
                            <Row label="Description" value={form.description || "—"} />
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                        {step > 1 && (
                            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ padding: "10px 14px", backgroundColor: "#e5e7eb", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                                Back
                            </button>
                        )}
                        {step < 5 && (
                            <button type="button" onClick={() => setStep((s) => Math.min(5, s + 1))} style={{ padding: "10px 14px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                                Next
                            </button>
                        )}
                        {step === 5 && (
                            <button type="submit" disabled={isLoading} style={{ padding: "12px 20px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1 }}>
                                {isLoading ? "Creating..." : "Create Booking"}
                            </button>
                        )}
                        <button type="button" onClick={() => nav(-1)} style={{ padding: "10px 14px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Customer Registration Modal */}
            {showCustomerForm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        if (e.target === e.currentTarget) setShowCustomerForm(false);
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            width: "90%",
                            maxWidth: "500px",
                            maxHeight: "90vh",
                            overflow: "auto",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
                                Register New Customer
                            </h2>
                            <button
                                onClick={() => setShowCustomerForm(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                registerCustomer();
                            }}
                            style={{ display: "grid", gap: "16px" }}
                        >
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input
                                    placeholder="Enter customer full name"
                                    value={customerForm.name}
                                    onChange={(e) => updateCustomer("name", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={customerForm.email}
                                    onChange={(e) => updateCustomer("email", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Phone *</label>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={customerForm.phone}
                                    onChange={(e) => updateCustomer("phone", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>NIC *</label>
                                <input
                                    type="text"
                                    placeholder="Enter NIC number (e.g., 123456789V or 123456789012)"
                                    value={customerForm.nic}
                                    onChange={(e) => updateCustomer("nic", e.target.value)}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Address</label>
                                <textarea
                                    placeholder="Enter customer address"
                                    value={customerForm.address}
                                    onChange={(e) => updateCustomer("address", e.target.value)}
                                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                <button
                                    type="submit"
                                    disabled={isRegisteringCustomer}
                                    style={{
                                        flex: 1,
                                        padding: "12px 20px",
                                        backgroundColor: "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: isRegisteringCustomer ? "not-allowed" : "pointer",
                                        opacity: isRegisteringCustomer ? 0.6 : 1,
                                    }}
                                >
                                    {isRegisteringCustomer ? "Registering..." : "Register Customer"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerForm(false)}
                                    style={{
                                        flex: 1,
                                        padding: "12px 20px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
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

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex" }}>
            <span style={{ flex: 1, color: "#6b7280" }}>{label}:</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{value}</span>
        </div>
    );
}

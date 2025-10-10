// src/features/bookings/CreateBooking.jsx
import { useMemo, useState, useEffect } from "react";
import { http } from "../../lib/http";
import { useNavigate } from "react-router-dom";
import { Enums } from "../../lib/validators";
import { ToastContainer, toast } from "react-toastify"; // Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

type BookingForm = {
    firstName: string;
    lastName: string;
    nic: string;
    phone: string;
    address: string;
    email: string;
    registrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    fuelType: string;
    transmission: string;
    customer: string;
    customerNic?: string;
    vehicle: string;
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

// Validation rules
const validators = {
    firstName: (value: string) => {
        if (!value.trim()) return "First name is required";
        if (value.length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "First name can only contain letters and spaces";
        return "";
    },
    lastName: (value: string) => {
        if (!value.trim()) return "Last name is required";
        if (value.length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Last name can only contain letters and spaces";
        return "";
    },
    nic: (value: string) => {
        if (!value.trim()) return "NIC is required";
        // Sri Lankan NIC format: 9 digits + 'V' or 12 digits
        if (!/^(?:\d{9}[Vv]|\d{12})$/.test(value)) return "Invalid NIC format (e.g., 123456789V or 123456789012)";
        return "";
    },
    phone: (value: string) => {
        if (!value.trim()) return "Phone number is required";
        if (!/^\d{10}$/.test(value)) return "Phone number must be 10 digits (e.g., 0771234567)";
        return "";
    },
    email: (value: string) => {
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return "";
    },
    address: (value: string) => {
        if (!value.trim()) return "Address is required";
        if (value.length < 5) return "Address must be at least 5 characters";
        return "";
    },
    registrationNumber: (value: string) => {
        if (!value.trim()) return "Registration number is required";
        if (!/^[A-Z0-9-]{2,8}$/.test(value)) return "Invalid registration number (e.g., ABC-1234)";
        return "";
    },
    vehicleMake: (value: string) => {
        if (!value.trim()) return "Vehicle make is required";
        if (value.length < 2) return "Vehicle make must be at least 2 characters";
        return "";
    },
    vehicleModel: (value: string) => {
        if (!value.trim()) return "Vehicle model is required";
        if (value.length < 2) return "Vehicle model must be at least 2 characters";
        return "";
    },
};

export default function CreateBooking() {
    const nav = useNavigate();
    const [form, setForm] = useState<BookingForm>({
        firstName: "",
        lastName: "",
        nic: "",
        phone: "",
        address: "",
        email: "",
        registrationNumber: "",
        vehicleMake: "",
        vehicleModel: "",
        fuelType: "petrol",
        transmission: "manual",
        customer: "",
        customerNic: "",
        vehicle: "",
        serviceType: Enums.ServiceType[0],
        scheduledDate: "",
        timeSlot: "",
        description: "",
        priority: "medium",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof BookingForm | 'searchNicOrEmail' | 'searchVehicleReg', string>>>({}); // Store inline errors
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customerForm, setCustomerForm] = useState<CustomerRegForm>({
        name: "",
        email: "",
        phone: "",
        address: "",
        nic: "",
    });
    const [customerErrors, setCustomerErrors] = useState<Partial<Record<keyof CustomerRegForm, string>>>({}); // Customer form errors
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [searchNicOrEmail, setSearchNicOrEmail] = useState("");
    const [isSearchingVehicle, setIsSearchingVehicle] = useState(false);
    const [searchVehicleReg, setSearchVehicleReg] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            if (form.timeSlot && form.scheduledDate && isTimeSlotPast(form.timeSlot, form.scheduledDate)) {
                setForm(prev => ({ ...prev, timeSlot: "" }));
                toast.error("Selected time slot has passed and has been cleared. Please select a new time slot.");
            }
        }, 60000);
        return () => clearInterval(timer);
    }, [form.timeSlot, form.scheduledDate]);

    // Validate customer search input
    const validateSearchNicOrEmail = (value: string) => {
        if (!value.trim()) return "Please enter NIC or email to search";
        if (!/^(?:\d{9}[Vv]|\d{12}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(value)) {
            return "Enter a valid NIC (e.g., 123456789V or 123456789012) or email";
        }
        return "";
    };

    // Validate vehicle search input
    const validateSearchVehicleReg = (value: string) => {
        if (!value.trim()) return "Please enter vehicle registration number to search";
        if (value.length < 2) return "Registration number must be at least 2 characters";
        return "";
    };

    // Search for existing customer
    async function searchExistingCustomer() {
        const error = validateSearchNicOrEmail(searchNicOrEmail);
        if (error) {
            toast.error(error);
            return;
        }

        setIsSearchingCustomer(true);
        try {
            const response = await http.get(`/users/search?q=${encodeURIComponent(searchNicOrEmail.trim())}`);
            const customer = response.data?.user;

            if (customer) {
                setForm(f => ({
                    ...f,
                    firstName: customer.profile?.firstName || "",
                    lastName: customer.profile?.lastName || "",
                    nic: customer.profile?.nic || "",
                    phone: customer.profile?.phoneNumber || "",
                    address: customer.profile?.address?.street || "",
                    email: customer.email || "",
                    customer: customer._id || customer.id || "",
                }));
                setErrors({}); // Clear errors on successful customer load
                toast.success("Customer found and form pre-filled!");
                setSearchNicOrEmail("");
            } else {
                toast.error("No customer found with that NIC or email");
            }
        } catch (e: any) {
            toast.error(e?.message || "Failed to search customer");
        } finally {
            setIsSearchingCustomer(false);
        }
    }

    // Search for existing vehicle
    async function searchExistingVehicle() {
        const error = validateSearchVehicleReg(searchVehicleReg);
        if (error) {
            toast.error(error);
            return;
        }

        setIsSearchingVehicle(true);
        try {
            const response = await http.get(`/vehicles/registration/${encodeURIComponent(searchVehicleReg.trim().toUpperCase())}`);
            const vehicle = response.data?.vehicle;

            if (vehicle) {
                setForm(f => ({
                    ...f,
                    registrationNumber: vehicle.registrationNumber || "",
                    vehicleMake: vehicle.make || "",
                    vehicleModel: vehicle.model || "",
                    fuelType: vehicle.fuelType || "petrol",
                    transmission: vehicle.transmission || "manual",
                    vehicle: vehicle._id || vehicle.id || "",
                }));
                setErrors({}); // Clear errors on successful vehicle load
                toast.success("Vehicle found and form pre-filled!");
                setSearchVehicleReg("");
            } else {
                toast.error("No vehicle found with that registration number");
            }
        } catch (e: any) {
            if (e?.response?.status === 404) {
                toast.error("No vehicle found with that registration number");
            } else {
                toast.error(e?.message || "Failed to search vehicle");
            }
        } finally {
            setIsSearchingVehicle(false);
        }
    }

    // Inline validation for form fields
    function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
        setForm(f => ({ ...f, [key]: value }));
        const validator = validators[key as keyof typeof validators];
        if (validator) {
            const error = validator(value as string);
            setErrors(prev => ({ ...prev, [key]: error }));
        }
    }

    // Inline validation for customer registration form
    function updateCustomer<K extends keyof CustomerRegForm>(key: K, value: CustomerRegForm[K]) {
        setCustomerForm(f => ({ ...f, [key]: value }));
        const validator = validators[key as keyof typeof validators];
        if (validator) {
            const error = validator(value as string);
            setCustomerErrors(prev => ({ ...prev, [key]: error }));
        }
    }

    // Form submission validation
    function validate() {
        const newErrors: Partial<Record<keyof BookingForm, string>> = {};
        Object.entries(validators).forEach(([key, validator]) => {
            const value = form[key as keyof BookingForm];
            const error = validator(value as string);
            if (error) newErrors[key as keyof BookingForm] = error;
        });
        if (!form.serviceType?.trim()) newErrors.serviceType = "Service type is required";
        if (!form.scheduledDate?.trim()) newErrors.scheduledDate = "Scheduled date is required";
        if (!form.timeSlot?.trim()) newErrors.timeSlot = "Time slot is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    // Customer registration validation
    function validateCustomer() {
        const newErrors: Partial<Record<keyof CustomerRegForm, string>> = {};
        Object.entries(validators).forEach(([key, validator]) => {
            if (key in customerForm) {
                const value = customerForm[key as keyof CustomerRegForm];
                const error = validator(value as string);
                if (error) newErrors[key as keyof CustomerRegForm] = error;
            }
        });
        setCustomerErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    // Date and time utilities
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

    const suggestedSlots = useMemo(() => [
        "09:00-11:00",
        "11:00-13:00",
        "13:00-15:00",
        "15:00-17:00",
    ], []);

    function isTimeSlotPast(timeSlot: string, selectedDate: string): boolean {
        if (!selectedDate) return false;
        const today = new Date();
        const selectedDateObj = new Date(selectedDate);
        if (selectedDateObj.toDateString() !== today.toDateString()) {
            return false;
        }
        const endTime = timeSlot.split('-')[1];
        const [hours, minutes] = endTime.split(':').map(Number);
        const slotEndTime = new Date();
        slotEndTime.setHours(hours, minutes, 0, 0);
        return currentTime >= slotEndTime;
    }

    async function registerCustomer() {
        if (!validateCustomer()) {
            toast.error("Please fix the errors in the customer form");
            return;
        }
        setIsRegisteringCustomer(true);
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
            toast.success("Customer registered successfully!");
            update("customer", data?.user?._id || data?.user?.id || "");
            setShowCustomerForm(false);
            setCustomerForm({ name: "", email: "", phone: "", address: "", nic: "" });
            setCustomerErrors({});
        } catch (e: any) {
            toast.error(e?.message || "Failed to register customer");
        } finally {
            setIsRegisteringCustomer(false);
        }
    }

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fix the errors in the form");
            return;
        }
        setIsLoading(true);
        try {
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

            if (customerResponse.data?.isExisting) {
                toast.success("Found existing customer, creating booking...");
            } else {
                toast.success("Customer registered successfully, creating booking...");
            }

            let vehicleId;
            try {
                const vehResp = await http.get(`/vehicles`, { params: { search: form.registrationNumber, limit: 1 } });
                const foundVehicle = (vehResp.data?.vehicles || [])[0];

                if (foundVehicle?._id || foundVehicle?.id) {
                    vehicleId = foundVehicle._id || foundVehicle.id;
                } else {
                    const vehicleData = {
                        registrationNumber: form.registrationNumber,
                        make: form.vehicleMake,
                        model: form.vehicleModel,
                        year: new Date().getFullYear(),
                        owner: customerId,
                        fuelType: form.fuelType,
                        transmission: form.transmission,
                        status: "active"
                    };
                    const vehicleResponse = await http.post("/vehicles", vehicleData);
                    vehicleId = vehicleResponse.data?.vehicle?._id || vehicleResponse.data?.vehicle?.id;
                    if (!vehicleId) throw new Error("Failed to create vehicle");
                }
            } catch (vehicleError) {
                console.error("Vehicle creation/lookup error:", vehicleError);
                throw new Error("Failed to create or find vehicle. Please check the vehicle details.");
            }

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
            toast.success("Booking created successfully!");
            nav(`/bookings/${data?.booking?._id}`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || "Failed to create booking");
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
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="light" />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
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

            {/* Multi-step form */}
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <form onSubmit={submit} style={sectionCard}>
                    <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #e5e7eb" }}>
                        {step === 1 && "Customer Details"}
                        {step === 2 && "Vehicle"}
                        {step === 3 && "Service"}
                        {step === 4 && "Schedule"}
                        {step === 5 && "Review"}
                    </h2>

                    {step === 1 && (
                        <>
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "12px" }}>
                                    Search Existing Customer (Optional)
                                </h3>
                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: "13px" }}>Enter NIC or Email</label>
                                        <input
                                            placeholder="Enter NIC number or email address"
                                            value={searchNicOrEmail}
                                            onChange={(e) => {
                                                setSearchNicOrEmail(e.target.value);
                                                const error = validateSearchNicOrEmail(e.target.value);
                                                setErrors(prev => ({ ...prev, searchNicOrEmail: error }));
                                            }}
                                            style={{ ...inputStyle, borderColor: errors.searchNicOrEmail ? "#ef4444" : "#d1d5db" }}
                                        />
                                        {errors.searchNicOrEmail && (
                                            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.searchNicOrEmail}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={searchExistingCustomer}
                                        disabled={isSearchingCustomer || !!errors.searchNicOrEmail}
                                        style={{
                                            padding: "11px 16px",
                                            backgroundColor: isSearchingCustomer || errors.searchNicOrEmail ? "#9ca3af" : "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            cursor: isSearchingCustomer || errors.searchNicOrEmail ? "not-allowed" : "pointer",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {isSearchingCustomer ? "Searching..." : "Search"}
                                    </button>
                                </div>
                                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", marginBottom: "0" }}>
                                    If found, customer details will be automatically filled in the form below.
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>First Name *</label>
                                    <input
                                        placeholder="Enter first name"
                                        value={form.firstName}
                                        onChange={(e) => update("firstName", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.firstName ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.firstName && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name *</label>
                                    <input
                                        placeholder="Enter last name"
                                        value={form.lastName}
                                        onChange={(e) => update("lastName", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.lastName ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.lastName && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.lastName}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>NIC Number *</label>
                                    <input
                                        placeholder="Enter NIC number (e.g., 123456789V)"
                                        value={form.nic}
                                        onChange={(e) => update("nic", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.nic ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.nic && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.nic}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number *</label>
                                    <input
                                        placeholder="Enter phone number (e.g., 0771234567)"
                                        value={form.phone}
                                        onChange={(e) => update("phone", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.phone ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.phone && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.phone}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.email ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.email && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.email}</p>}
                                </div>
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={labelStyle}>Address *</label>
                                    <textarea
                                        placeholder="Enter full address"
                                        value={form.address}
                                        onChange={(e) => update("address", e.target.value)}
                                        style={{ ...inputStyle, minHeight: 80, resize: "vertical", borderColor: errors.address ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.address && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.address}</p>}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#475569", marginBottom: "12px" }}>
                                    Search Existing Vehicle (Optional)
                                </h3>
                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ ...labelStyle, fontSize: "13px" }}>Enter Vehicle Registration Number</label>
                                        <input
                                            placeholder="Enter vehicle registration number (e.g., ABC-1234)"
                                            value={searchVehicleReg}
                                            onChange={(e) => {
                                                setSearchVehicleReg(e.target.value.toUpperCase());
                                                const error = validateSearchVehicleReg(e.target.value);
                                                setErrors(prev => ({ ...prev, searchVehicleReg: error }));
                                            }}
                                            style={{ ...inputStyle, borderColor: errors.searchVehicleReg ? "#ef4444" : "#d1d5db" }}
                                        />
                                        {errors.searchVehicleReg && (
                                            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.searchVehicleReg}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={searchExistingVehicle}
                                        disabled={isSearchingVehicle || !!errors.searchVehicleReg}
                                        style={{
                                            padding: "11px 16px",
                                            backgroundColor: isSearchingVehicle || errors.searchVehicleReg ? "#9ca3af" : "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            cursor: isSearchingVehicle || errors.searchVehicleReg ? "not-allowed" : "pointer",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {isSearchingVehicle ? "Searching..." : "Search"}
                                    </button>
                                </div>
                                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", marginBottom: "0" }}>
                                    If found, vehicle details will be automatically filled in the form below.
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Vehicle Registration Number *</label>
                                    <input
                                        placeholder="Enter registration number (e.g., ABC-1234)"
                                        value={form.registrationNumber}
                                        onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())}
                                        style={{ ...inputStyle, borderColor: errors.registrationNumber ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.registrationNumber && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.registrationNumber}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Vehicle Make *</label>
                                    <input
                                        placeholder="Enter vehicle make (e.g., Toyota, Honda, BMW)"
                                        value={form.vehicleMake}
                                        onChange={(e) => update("vehicleMake", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.vehicleMake ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.vehicleMake && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.vehicleMake}</p>}
                                </div>
                                <div>
                                    <label style={labelStyle}>Vehicle Model *</label>
                                    <input
                                        placeholder="Enter vehicle model (e.g., Camry, Civic, X3)"
                                        value={form.vehicleModel}
                                        onChange={(e) => update("vehicleModel", e.target.value)}
                                        style={{ ...inputStyle, borderColor: errors.vehicleModel ? "#ef4444" : "#d1d5db" }}
                                        required
                                    />
                                    {errors.vehicleModel && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.vehicleModel}</p>}
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
                        </>
                    )}

                    {step === 3 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            <div style={{ gridColumn: "1 / -1", marginBottom: 8 }}>
                                <label style={labelStyle}>Service Type</label>
                                {errors.serviceType && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.serviceType}</p>}
                            </div>
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
                                <input
                                    type="date"
                                    value={form.scheduledDate}
                                    min={getTodayString()}
                                    max={getMaxFromTodayString()}
                                    onChange={(e) => update("scheduledDate", e.target.value)}
                                    style={{ ...inputStyle, borderColor: errors.scheduledDate ? "#ef4444" : "#d1d5db" }}
                                />
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>You can book up to 30 days from today.</div>
                                {errors.scheduledDate && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.scheduledDate}</p>}
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={labelStyle}>Time Slot</label>
                                    <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                                        🕐 Current time: {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                                {errors.timeSlot && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.timeSlot}</p>}
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
                            <button
                                type="button"
                                onClick={() => {
                                    const stepErrors = Object.keys(errors).filter(key => {
                                        if (step === 1) return ['firstName', 'lastName', 'nic', 'phone', 'email', 'address'].includes(key);
                                        if (step === 2) return ['registrationNumber', 'vehicleMake', 'vehicleModel'].includes(key);
                                        if (step === 3) return ['serviceType'].includes(key);
                                        if (step === 4) return ['scheduledDate', 'timeSlot'].includes(key);
                                        return false;
                                    }).filter(key => errors[key as keyof BookingForm]); // Only include keys with actual error messages
                                    if (stepErrors.length > 0) {
                                        toast.error("Please fix the errors before proceeding");
                                        return;
                                    }
                                    setStep((s) => Math.min(5, s + 1));
                                }}
                                style={{ padding: "10px 14px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                            >
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
                                    style={{ ...inputStyle, borderColor: customerErrors.name ? "#ef4444" : "#d1d5db" }}
                                    required
                                />
                                {customerErrors.name && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{customerErrors.name}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={customerForm.email}
                                    onChange={(e) => updateCustomer("email", e.target.value)}
                                    style={{ ...inputStyle, borderColor: customerErrors.email ? "#ef4444" : "#d1d5db" }}
                                    required
                                />
                                {customerErrors.email && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{customerErrors.email}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Phone *</label>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={customerForm.phone}
                                    onChange={(e) => updateCustomer("phone", e.target.value)}
                                    style={{ ...inputStyle, borderColor: customerErrors.phone ? "#ef4444" : "#d1d5db" }}
                                    required
                                />
                                {customerErrors.phone && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{customerErrors.phone}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>NIC *</label>
                                <input
                                    type="text"
                                    placeholder="Enter NIC number (e.g., 123456789V or 123456789012)"
                                    value={customerForm.nic}
                                    onChange={(e) => updateCustomer("nic", e.target.value)}
                                    style={{ ...inputStyle, borderColor: customerErrors.nic ? "#ef4444" : "#d1d5db" }}
                                    required
                                />
                                {customerErrors.nic && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{customerErrors.nic}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Address</label>
                                <textarea
                                    placeholder="Enter customer address"
                                    value={customerForm.address}
                                    onChange={(e) => updateCustomer("address", e.target.value)}
                                    style={{ ...inputStyle, minHeight: 80, resize: "vertical", borderColor: customerErrors.address ? "#ef4444" : "#d1d5db" }}
                                />
                                {customerErrors.address && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{customerErrors.address}</p>}
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
// src/features/users/CreateUser.jsx
import { useState } from "react";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function CreateUser() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        role: Enums.Roles[0] || "customer",
        profile: {
            firstName: "",
            lastName: "",
            phoneNumber: "",
            address: {
                street: "",
                city: "",
                province: "",
                postalCode: ""
            },
            nic: "",
            dateOfBirth: ""
        },
        customerDetails: {
            emergencyContact: {
                name: "",
                phoneNumber: "",
                relationship: ""
            }
        },
        employeeDetails: {
            baseSalary: "",
            joinDate: "",
            department: ""
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const provinces = ["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"];
    const relationships = ["spouse", "parent", "sibling", "friend", "other"];

    // Calculate the maximum allowed birth date (18 years ago from today)
    const getMaxBirthDate = () => {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return maxDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    // Get today's date for join date max constraint
    const getTodaysDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    function validateField(path: string, value: any) {
        let error = "";
        
        switch (path) {
            case "email":
                if (!value?.trim()) error = "Email is required";
                else if (!/^\S+@\S+\.\S+$/.test(value)) error = "Enter a valid email";
                break;
            case "password":
                if (!value?.trim()) error = "Password is required";
                else if (value.length < 6) error = "Password must be at least 6 characters";
                break;
            case "role":
                if (!value?.trim()) error = "Role is required";
                else if (!Enums.Roles.includes(value)) error = "Invalid role";
                break;
            case "profile.firstName":
                if (!value?.trim()) error = "First name is required";
                break;
            case "profile.lastName":
                if (!value?.trim()) error = "Last name is required";
                break;
            case "profile.phoneNumber":
                if (!value?.trim()) error = "Phone number is required";
                break;
            case "profile.nic":
                if (!value?.trim()) error = "NIC is required";
                break;
            case "profile.dateOfBirth":
                if (!value?.trim()) {
                    error = "Date of birth is required";
                } else {
                    const dob = new Date(value);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const monthDiff = today.getMonth() - dob.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    if (age < 18) error = "User must be at least 18 years old";
                }
                break;
            case "profile.address.street":
                if (!value?.trim()) error = "Street address is required";
                break;
            case "profile.address.city":
                if (!value?.trim()) error = "City is required";
                break;
            case "profile.address.province":
                if (!value?.trim()) error = "Province is required";
                else if (!provinces.includes(value)) error = "Invalid province";
                break;
            case "profile.address.postalCode":
                if (!value?.trim()) error = "Postal code is required";
                break;
            case "customerDetails.emergencyContact.name":
                if (!value?.trim()) error = "Emergency contact name is required";
                break;
            case "customerDetails.emergencyContact.phoneNumber":
                if (!value?.trim()) error = "Emergency contact phone number is required";
                break;
            case "customerDetails.emergencyContact.relationship":
                if (!value?.trim()) error = "Emergency contact relationship is required";
                else if (!relationships.includes(value)) error = "Invalid emergency contact relationship";
                break;
            case "employeeDetails.baseSalary":
                if (!value) error = "Base salary is required";
                else if (isNaN(Number(value)) || Number(value) <= 0) error = "Base salary must be a positive number";
                break;
            case "employeeDetails.joinDate":
                if (!value?.trim()) error = "Join date is required";
                break;
            case "employeeDetails.department":
                if (value && !Enums.JobCategory.includes(value)) error = "Invalid department";
                break;
        }
        
        if (error) {
            setFieldErrors(prev => ({ ...prev, [path]: error }));
        } else {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[path];
                return newErrors;
            });
        }
    }

    function update(path: string, value: any) {
        const paths = path.split('.');
        setForm(prev => {
            let newForm = { ...prev };
            let current: any = newForm;
            for (let i = 0; i < paths.length - 1; i++) {
                current = current[paths[i]] = { ...current[paths[i]] };
            }
            current[paths[paths.length - 1]] = value;
            return newForm;
        });
        
        // Clear field error when user starts typing
        if (fieldErrors[path]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[path];
                return newErrors;
            });
        }
        
        // Validate field on change
        validateField(path, value);
    } // Controlled inputs keep state as the single source of truth for the form.

    function validate() {
        // Basic field validations
        if (!form.email.trim()) return "Email is required";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
        if (!form.password.trim()) return "Password is required";
        if (form.password.length < 6) return "Password must be at least 6 characters";
        if (!form.role?.trim()) return "Role is required";
        if (!Enums.Roles.includes(form.role)) return "Invalid role";
        if (!form.profile.firstName.trim()) return "First name is required";
        if (!form.profile.lastName.trim()) return "Last name is required";
        if (!form.profile.phoneNumber.trim()) return "Phone number is required";
        if (!form.profile.nic.trim()) return "NIC is required";
        if (!form.profile.dateOfBirth.trim()) return "Date of birth is required";
        if (!form.profile.address.street.trim()) return "Street address is required";
        if (!form.profile.address.city.trim()) return "City is required";
        if (!form.profile.address.province.trim()) return "Province is required";
        if (!provinces.includes(form.profile.address.province)) return "Invalid province";
        if (!form.profile.address.postalCode.trim()) return "Postal code is required";
        if (!form.customerDetails.emergencyContact.name.trim()) return "Emergency contact name is required";
        if (!form.customerDetails.emergencyContact.phoneNumber.trim()) return "Emergency contact phone number is required";
        if (!form.customerDetails.emergencyContact.relationship.trim()) return "Emergency contact relationship is required";
        if (!relationships.includes(form.customerDetails.emergencyContact.relationship)) return "Invalid emergency contact relationship";
        if (!form.employeeDetails.baseSalary) return "Base salary is required";
        if (isNaN(Number(form.employeeDetails.baseSalary)) || Number(form.employeeDetails.baseSalary) <= 0) return "Base salary must be a positive number";
        if (!form.employeeDetails.joinDate.trim()) return "Join date is required";
        if (form.employeeDetails.department && !Enums.JobCategory.includes(form.employeeDetails.department)) return "Invalid department";

        // Age validation
        const dob = new Date(form.profile.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        if (age < 18) return "User must be at least 18 years old";

        return "";
    } // Simple client validation is straightforward with controlled state.

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const v = validate();
        if (v) {
            setMessage({ text: v, type: "error" });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: "", type: "" });
        try {
            await http.post("/users", {
                ...form,
                employeeDetails: {
                    ...form.employeeDetails,
                    baseSalary: Number(form.employeeDetails.baseSalary)
                }
            });
            setMessage({ text: "User created", type: "success" });
            setForm({
                email: "",
                password: "",
                role: Enums.Roles[0] || "customer",
                profile: {
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    address: {
                        street: "",
                        city: "",
                        province: "",
                        postalCode: ""
                    },
                    nic: "",
                    dateOfBirth: ""
                },
                customerDetails: {
                    emergencyContact: {
                        name: "",
                        phoneNumber: "",
                        relationship: ""
                    }
                },
                employeeDetails: {
                    baseSalary: "",
                    joinDate: "",
                    department: ""
                }
            });
        } catch (e: any) {
            setMessage({ text: e.message || "Failed to create user", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    } // useState manages form and submit state for predictable updates in function components.

    function renderFieldError(fieldPath: string) {
        const error = fieldErrors[fieldPath];
        if (!error) return null;
        
        return (
            <div style={{
                color: "#dc2626",
                fontSize: "12px",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
            }}>
                <span>⚠</span>
                {error}
            </div>
        );
    }

    // Styles
    const wrap = {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };
    const card = {
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e5e7eb",
    };
    const header = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
    };
    const title = { fontSize: "28px", fontWeight: 700, color: "#1f2937", margin: 0 };
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
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
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
    const controlError = {
        ...control,
        borderColor: "#dc2626",
        boxShadow: "0 0 0 1px #dc2626",
    };
    const submitBtn = {
        padding: "12px 20px",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
    };

    return (
        <div style={wrap}>
            <div style={header}>
                <h1 style={title}>New User</h1>
            </div>

            {message.text && (
                <div
                    role="status"
                    aria-live="polite"
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
            ) /* role=status acts as a polite live region for feedback per ARIA guidance. */}

            <form onSubmit={submit} style={card}>
                <h2 style={sectionTitle}>Account</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>Email</label>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            style={fieldErrors["email"] ? controlError : control}
                            autoComplete="email"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("email")}
                    </div>

                    <div>
                        <label style={label}>Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            style={fieldErrors["password"] ? controlError : control}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("password")}
                    </div>

                    <div>
                        <label style={label}>Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => update("role", e.target.value)}
                            style={fieldErrors["role"] ? controlError : control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Role</option>
                            {Enums.Roles.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
                        {renderFieldError("role")}
                    </div>
                </div>

                <h2 style={{ ...sectionTitle, marginTop: "20px" }}>Profile</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>First name</label>
                        <input
                            placeholder="First name"
                            value={form.profile.firstName}
                            onChange={(e) => update("profile.firstName", e.target.value)}
                            style={fieldErrors["profile.firstName"] ? controlError : control}
                            autoComplete="given-name"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.firstName")}
                    </div>

                    <div>
                        <label style={label}>Last name</label>
                        <input
                            placeholder="Last name"
                            value={form.profile.lastName}
                            onChange={(e) => update("profile.lastName", e.target.value)}
                            style={fieldErrors["profile.lastName"] ? controlError : control}
                            autoComplete="family-name"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.lastName")}
                    </div>

                    <div>
                        <label style={label}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="0771234567"
                            value={form.profile.phoneNumber}
                            onChange={(e) => update("profile.phoneNumber", e.target.value)}
                            style={fieldErrors["profile.phoneNumber"] ? controlError : control}
                            autoComplete="tel"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.phoneNumber")}
                    </div>

                    <div>
                        <label style={label}>NIC</label>
                        <input
                            placeholder="123456789V"
                            value={form.profile.nic}
                            onChange={(e) => update("profile.nic", e.target.value)}
                            style={fieldErrors["profile.nic"] ? controlError : control}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.nic")}
                    </div>

                    <div>
                        <label style={label}>Date of Birth</label>
                        <input
                            type="date"
                            value={form.profile.dateOfBirth}
                            onChange={(e) => update("profile.dateOfBirth", e.target.value)}
                            style={fieldErrors["profile.dateOfBirth"] ? controlError : control}
                            max={getMaxBirthDate()}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.dateOfBirth")}
                    </div>
                </div>

                <h2 style={{ ...sectionTitle, marginTop: "20px" }}>Address</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>Street</label>
                        <input
                            placeholder="123 Main Street"
                            value={form.profile.address.street}
                            onChange={(e) => update("profile.address.street", e.target.value)}
                            style={fieldErrors["profile.address.street"] ? controlError : control}
                            autoComplete="street-address"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.address.street")}
                    </div>

                    <div>
                        <label style={label}>City</label>
                        <input
                            placeholder="Colombo"
                            value={form.profile.address.city}
                            onChange={(e) => update("profile.address.city", e.target.value)}
                            style={fieldErrors["profile.address.city"] ? controlError : control}
                            autoComplete="address-level2"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.address.city")}
                    </div>

                    <div>
                        <label style={label}>Province</label>
                        <select
                            value={form.profile.address.province}
                            onChange={(e) => update("profile.address.province", e.target.value)}
                            style={fieldErrors["profile.address.province"] ? controlError : control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Province</option>
                            {provinces.map((province) => (
                                <option key={province} value={province}>{province}</option>
                            ))}
                        </select>
                        {renderFieldError("profile.address.province")}
                    </div>

                    <div>
                        <label style={label}>Postal Code</label>
                        <input
                            placeholder="10100"
                            value={form.profile.address.postalCode}
                            onChange={(e) => update("profile.address.postalCode", e.target.value)}
                            style={fieldErrors["profile.address.postalCode"] ? controlError : control}
                            autoComplete="postal-code"
                            disabled={isSubmitting}
                        />
                        {renderFieldError("profile.address.postalCode")}
                    </div>
                </div>

                <h2 style={{ ...sectionTitle, marginTop: "20px" }}>Emergency Contact</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>Name</label>
                        <input
                            placeholder="Jane Doe"
                            value={form.customerDetails.emergencyContact.name}
                            onChange={(e) => update("customerDetails.emergencyContact.name", e.target.value)}
                            style={fieldErrors["customerDetails.emergencyContact.name"] ? controlError : control}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("customerDetails.emergencyContact.name")}
                    </div>

                    <div>
                        <label style={label}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="0777654321"
                            value={form.customerDetails.emergencyContact.phoneNumber}
                            onChange={(e) => update("customerDetails.emergencyContact.phoneNumber", e.target.value)}
                            style={fieldErrors["customerDetails.emergencyContact.phoneNumber"] ? controlError : control}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("customerDetails.emergencyContact.phoneNumber")}
                    </div>

                    <div>
                        <label style={label}>Relationship</label>
                        <select
                            value={form.customerDetails.emergencyContact.relationship}
                            onChange={(e) => update("customerDetails.emergencyContact.relationship", e.target.value)}
                            style={fieldErrors["customerDetails.emergencyContact.relationship"] ? controlError : control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Relationship</option>
                            {relationships.map((relationship) => (
                                <option key={relationship} value={relationship}>{relationship}</option>
                            ))}
                        </select>
                        {renderFieldError("customerDetails.emergencyContact.relationship")}
                    </div>
                </div>

                <h2 style={{ ...sectionTitle, marginTop: "20px" }}>Employee Details</h2>
                <div style={grid}>
                    <div>
                        <label style={label}>Base Salary</label>
                        <input
                            type="number"
                            placeholder="50000"
                            value={form.employeeDetails.baseSalary}
                            onChange={(e) => update("employeeDetails.baseSalary", e.target.value)}
                            style={fieldErrors["employeeDetails.baseSalary"] ? controlError : control}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("employeeDetails.baseSalary")}
                    </div>

                    <div>
                        <label style={label}>Join Date</label>
                        <input
                            type="date"
                            value={form.employeeDetails.joinDate}
                            onChange={(e) => update("employeeDetails.joinDate", e.target.value)}
                            style={fieldErrors["employeeDetails.joinDate"] ? controlError : control}
                            max={getTodaysDate()}
                            disabled={isSubmitting}
                        />
                        {renderFieldError("employeeDetails.joinDate")}
                    </div>

                    <div>
                        <label style={label}>Department (Optional)</label>
                        <select
                            value={form.employeeDetails.department}
                            onChange={(e) => update("employeeDetails.department", e.target.value)}
                            style={fieldErrors["employeeDetails.department"] ? controlError : control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Department (Optional)</option>
                            {Enums.JobCategory.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        {renderFieldError("employeeDetails.department")}
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{ ...submitBtn, opacity: isSubmitting ? 0.6 : 1 }}
                    >
                        {isSubmitting ? "Creating..." : "Create"}
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            setForm({
                                email: "",
                                password: "",
                                role: Enums.Roles[0] || "customer",
                                profile: {
                                    firstName: "",
                                    lastName: "",
                                    phoneNumber: "",
                                    address: {
                                        street: "",
                                        city: "",
                                        province: "",
                                        postalCode: ""
                                    },
                                    nic: "",
                                    dateOfBirth: ""
                                },
                                customerDetails: {
                                    emergencyContact: {
                                        name: "",
                                        phoneNumber: "",
                                        relationship: ""
                                    }
                                },
                                employeeDetails: {
                                    baseSalary: "",
                                    joinDate: "",
                                    department: ""
                                }
                            })
                        }
                        disabled={isSubmitting}
                        style={{
                            padding: "12px 20px",
                            backgroundColor: "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            opacity: isSubmitting ? 0.6 : 1,
                        }}
                    >
                        Reset
                    </button>
                </div>
            </form>
        </div>
    );
}
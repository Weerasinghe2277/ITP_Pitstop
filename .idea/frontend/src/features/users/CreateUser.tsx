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

    const provinces = ["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"];
    const relationships = ["spouse", "parent", "sibling", "friend", "other"];

    function update(path, value) {
        const paths = path.split('.');
        setForm(prev => {
            let newForm = { ...prev };
            let current = newForm;
            for (let i = 0; i < paths.length - 1; i++) {
                current = current[paths[i]] = { ...current[paths[i]] };
            }
            current[paths[paths.length - 1]] = value;
            return newForm;
        });
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
        if (isNaN(form.employeeDetails.baseSalary) || Number(form.employeeDetails.baseSalary) <= 0) return "Base salary must be a positive number";
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
        if (age < 16) return "User must be at least 16 years old";

        return "";
    } // Simple client validation is straightforward with controlled state.

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
        } catch (e) {
            setMessage({ text: e.message || "Failed to create user", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    } // useState manages form and submit state for predictable updates in function components.

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
                            style={control}
                            autoComplete="email"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            style={control}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => update("role", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Role</option>
                            {Enums.Roles.map((x) => (
                                <option key={x} value={x}>{x}</option>
                            ))}
                        </select>
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
                            style={control}
                            autoComplete="given-name"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Last name</label>
                        <input
                            placeholder="Last name"
                            value={form.profile.lastName}
                            onChange={(e) => update("profile.lastName", e.target.value)}
                            style={control}
                            autoComplete="family-name"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="0771234567"
                            value={form.profile.phoneNumber}
                            onChange={(e) => update("profile.phoneNumber", e.target.value)}
                            style={control}
                            autoComplete="tel"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>NIC</label>
                        <input
                            placeholder="123456789V"
                            value={form.profile.nic}
                            onChange={(e) => update("profile.nic", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Date of Birth</label>
                        <input
                            type="date"
                            value={form.profile.dateOfBirth}
                            onChange={(e) => update("profile.dateOfBirth", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        />
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
                            style={control}
                            autoComplete="street-address"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>City</label>
                        <input
                            placeholder="Colombo"
                            value={form.profile.address.city}
                            onChange={(e) => update("profile.address.city", e.target.value)}
                            style={control}
                            autoComplete="address-level2"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Province</label>
                        <select
                            value={form.profile.address.province}
                            onChange={(e) => update("profile.address.province", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Province</option>
                            {provinces.map((province) => (
                                <option key={province} value={province}>{province}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={label}>Postal Code</label>
                        <input
                            placeholder="10100"
                            value={form.profile.address.postalCode}
                            onChange={(e) => update("profile.address.postalCode", e.target.value)}
                            style={control}
                            autoComplete="postal-code"
                            disabled={isSubmitting}
                        />
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
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="0777654321"
                            value={form.customerDetails.emergencyContact.phoneNumber}
                            onChange={(e) => update("customerDetails.emergencyContact.phoneNumber", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Relationship</label>
                        <select
                            value={form.customerDetails.emergencyContact.relationship}
                            onChange={(e) => update("customerDetails.emergencyContact.relationship", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Relationship</option>
                            {relationships.map((relationship) => (
                                <option key={relationship} value={relationship}>{relationship}</option>
                            ))}
                        </select>
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
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Join Date</label>
                        <input
                            type="date"
                            value={form.employeeDetails.joinDate}
                            onChange={(e) => update("employeeDetails.joinDate", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label style={label}>Department (Optional)</label>
                        <select
                            value={form.employeeDetails.department}
                            onChange={(e) => update("employeeDetails.department", e.target.value)}
                            style={control}
                            disabled={isSubmitting}
                        >
                            <option value="">Select Department (Optional)</option>
                            {Enums.JobCategory.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
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
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const navigate = useNavigate();

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Email is required");
            toast.error("Email is required");
            return;
        }

        if (!password.trim()) {
            setError("Password is required");
            toast.error("Password is required");
            return;
        }

        setIsSubmitting(true);

        try {
            await login(email.trim(), password);
            toast.success("Login successful!");
            setTimeout(() => navigate("/dashboard"), 1500);
        } catch (err: any) {
            const errorMessage = err?.message === "Invalid credentials"
                ? "Incorrect email or password"
                : "Login failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
        if (error) setError("");
    }

    function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
        if (error) setError("");
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <ToastContainer position="top-right" autoClose={3000} />
            {/* Main login container */}
            <div style={{
                background: 'rgba(255, 255, 255, 1)',
                borderRadius: '16px',
                padding: '40px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
            }}>
                {/* Logo section */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '16px',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}>
                        🔧
                    </div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: '0 0 4px 0',
                    }}>
                        Pitstop System
                    </h1>
                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: 0
                    }}>
                        Vehicle Service Center Portal
                    </p>
                </div>

                <form onSubmit={onSubmit}>
                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            marginBottom: '24px',
                            color: '#dc2626',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '16px' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px',
                        }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                                disabled={isSubmitting || loading}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 40px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isSubmitting || loading ? '#f9fafb' : 'white',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '16px',
                                color: '#9ca3af'
                            }}>
                                ✉️
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                disabled={isSubmitting || loading}
                                style={{
                                    width: '100%',
                                    padding: '12px 45px 12px 40px',
                                    fontSize: '14px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isSubmitting || loading ? '#f9fafb' : 'white',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '16px',
                                color: '#9ca3af'
                            }}>
                                🔒
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.color = '#3b82f6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = '#9ca3af';
                                }}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || loading || !email.trim() || !password.trim()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'white',
                            background: isSubmitting || loading || !email.trim() || !password.trim()
                                ? '#9ca3af'
                                : '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isSubmitting || loading || !email.trim() || !password.trim() ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting && !loading && email.trim() && password.trim()) {
                                e.currentTarget.style.background = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting && !loading && email.trim() && password.trim()) {
                                e.currentTarget.style.background = '#3b82f6';
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></span>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* System info */}
                <div style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Pitstop System v2.4.1 • Internal Use Only
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 480px) {
                    div > div {
                        padding: 24px !important;
                    }
                }
            `}</style>
        </div>
    );
}
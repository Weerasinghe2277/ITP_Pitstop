import { useAuth } from "../../store/AuthContext";

export default function EmployeeReport() {
    const { user } = useAuth();

    if (!user || user.role !== "owner") {
        return <div>Access denied. This page is restricted to Owners.</div>;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f7fa',
            padding: '40px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '24px',
                }}>
                    Employee Report
                </h1>
                <div style={{
                    background: '#f9fafb',
                    borderRadius: '12px',
                    padding: '24px',
                }}>
                    <p style={{
                        fontSize: '16px',
                        color: '#4b5563',
                    }}>
                        This is a placeholder for the Employee Report. It displays comprehensive employee data for the Owner.
                    </p>
                    {/* Add your report logic here (e.g., fetch employee data from backend) */}
                </div>
            </div>
        </div>
    );
}